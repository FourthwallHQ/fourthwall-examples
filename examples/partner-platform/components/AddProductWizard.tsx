'use client';

import { useState } from 'react';
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from '@fourthwall-examples/ui';
import type { Blueprint, PreviewResult, ProductLink } from '@/lib/types';
import { StepPick } from './StepPick';
import { StepArtwork } from './StepArtwork';
import { StepPreview } from './StepPreview';
import { StepDetails } from './StepDetails';
import { StepShopName } from './StepShopName';
import { StepPublish } from './StepPublish';

/**
 * AddProductWizard — the stepped modal that walks a creator from a blank
 * product to a live one. Owns step state and the accumulated design (blueprint
 * → artwork → preview inputs → details), and gates Next on each step's minimum.
 *
 * The shop boundary lives across the steps: pick · artwork · preview are
 * entirely shop-less, driven through the channel-api. Only Publish needs a shop.
 * On the FIRST publish (no shop yet) a "Name your shop" step is injected at the
 * end so the creator names the shop that publishing provisions; once a shop
 * exists that step is skipped.
 */
export interface WizardData {
  blueprint: Blueprint | null;
  artwork: { imageId: string; uri: string; fileName: string; width: number; height: number; file: File } | null;
  /** Selected colors / sizes (empty ⇒ all available). Threaded through preview → publish. */
  colors: string[];
  sizes: string[];
  /** Selected design region (real `regionId`, e.g. `front_large_dtf`). Threaded through preview → publish. */
  region: string | null;
  preview: PreviewResult | null;
  title: string;
  description: string;
  profitMargin: string;
  /** Shop name — collected by the injected step on first publish only. */
  shopName: string;
}

const EMPTY: WizardData = {
  blueprint: null,
  artwork: null,
  colors: [],
  sizes: [],
  region: null,
  preview: null,
  title: '',
  description: '',
  profitMargin: '',
  shopName: '',
};

const BASE_STEPS = ['Pick a product', 'Add artwork', 'Preview', 'Details & price'] as const;

export function AddProductWizard({ open, hasShop, onClose, onPublished }: {
  open: boolean;
  /** Whether the app already has a shop — when false, the wizard adds a naming step. */
  hasShop: boolean;
  onClose: () => void;
  onPublished: (link: ProductLink) => void;
}) {
  const [step, setStep] = useState(0); // 0-indexed into `steps`
  const [data, setData] = useState<WizardData>(EMPTY);
  const [publishing, setPublishing] = useState(false);

  // The naming step is appended only when there's no shop yet.
  const steps = hasShop ? [...BASE_STEPS] : [...BASE_STEPS, 'Name your shop'];
  const isShopNameStep = !hasShop && step === BASE_STEPS.length;

  const patch = (p: Partial<WizardData>) => setData((d) => ({ ...d, ...p }));

  const canAdvance =
    step === 0
      ? data.blueprint !== null
      : step === 1
        ? data.artwork !== null
        : step === 2
          ? data.preview !== null && data.preview.images.length > 0
          : step === 3
            ? data.title.trim().length > 0
            : data.shopName.trim().length > 0; // the shop-name step

  function close() {
    setStep(0);
    setData(EMPTY);
    setPublishing(false);
    onClose();
  }

  const onLastStep = step === steps.length - 1;

  return (
    <Modal open={open} onClose={close} size="large">
      <ModalHeader>Add a product</ModalHeader>
      <ModalBody>
        <Stepper step={step} steps={steps} />
        {publishing ? (
          <StepPublish data={data} onDone={(link) => { close(); onPublished(link); }} onCancel={close} />
        ) : (
          <>
            {step === 0 && <StepPick data={data} patch={patch} />}
            {step === 1 && <StepArtwork data={data} patch={patch} />}
            {step === 2 && <StepPreview data={data} patch={patch} />}
            {step === 3 && <StepDetails data={data} patch={patch} />}
            {isShopNameStep && <StepShopName data={data} patch={patch} />}
          </>
        )}
      </ModalBody>
      {!publishing && (
        <ModalFooter>
          <Button onClick={close}>Cancel</Button>
          {step > 0 && (
            <Button appearance="secondary" onClick={() => setStep((s) => Math.max(0, s - 1))}>
              Back
            </Button>
          )}
          {!onLastStep ? (
            <Button appearance="primary" disabled={!canAdvance} onClick={() => setStep((s) => s + 1)}>
              Next
            </Button>
          ) : (
            <Button
              appearance="primary"
              disabled={!canAdvance}
              onClick={() => {
                if (data.blueprint && data.artwork && data.region) setPublishing(true);
              }}
            >
              {hasShop ? 'Publish' : 'Create shop & publish'}
            </Button>
          )}
        </ModalFooter>
      )}
    </Modal>
  );
}

function Stepper({ step, steps }: { step: number; steps: readonly string[] }) {
  return (
    <div className="mb-8 flex flex-col gap-2">
      <div className="flex gap-1.5">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-border'}`}
          />
        ))}
      </div>
      <span className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        Step {step + 1} of {steps.length} · {steps[step]}
      </span>
    </div>
  );
}
