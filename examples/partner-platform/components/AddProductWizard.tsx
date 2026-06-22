'use client';

import { useState } from 'react';
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from '@fourthwall-examples/ui';
import type { Blueprint, PreviewResult, ProductLink } from '@/lib/types';
import { StepPick } from './StepPick';
import { StepArtwork } from './StepArtwork';
import { StepPreview } from './StepPreview';
import { StepDetails } from './StepDetails';
import { StepPublish } from './StepPublish';

/**
 * AddProductWizard — the stepped modal that walks a creator from a blank
 * product to a live one. Owns step state and the accumulated design (blueprint
 * → artwork → preview inputs → details), and gates Next on each step's minimum.
 *
 * The shop boundary lives across the steps: steps 1–3 (pick · artwork · preview)
 * are entirely shop-less, driven through the channel-api. Only the Publish
 * action on step 4 needs a shop — and it provisions one behind the scenes.
 */
export interface WizardData {
  blueprint: Blueprint | null;
  artwork: { imageId: string; uri: string; fileName: string; width: number; height: number } | null;
  /** Selected colors / sizes (empty ⇒ all available). Threaded through preview → publish. */
  colors: string[];
  sizes: string[];
  preview: PreviewResult | null;
  title: string;
  description: string;
  profitMargin: string;
}

const EMPTY: WizardData = {
  blueprint: null,
  artwork: null,
  colors: [],
  sizes: [],
  preview: null,
  title: '',
  description: '',
  profitMargin: '',
};

const STEPS = ['Pick a product', 'Add artwork', 'Preview', 'Details & price'] as const;

export function AddProductWizard({ open, onClose, onPublished }: {
  open: boolean;
  onClose: () => void;
  onPublished: (link: ProductLink) => void;
}) {
  const [step, setStep] = useState(0); // 0-indexed into STEPS
  const [data, setData] = useState<WizardData>(EMPTY);
  const [publishing, setPublishing] = useState(false);

  const patch = (p: Partial<WizardData>) => setData((d) => ({ ...d, ...p }));

  const canAdvance =
    step === 0
      ? data.blueprint !== null
      : step === 1
        ? data.artwork !== null
        : step === 2
          ? data.preview !== null && data.preview.images.length > 0
          : data.title.trim().length > 0;

  function close() {
    setStep(0);
    setData(EMPTY);
    setPublishing(false);
    onClose();
  }

  return (
    <Modal open={open} onClose={close} size="large">
      <ModalHeader>Add a product</ModalHeader>
      <ModalBody>
        <Stepper step={step} />
        {publishing ? (
          <StepPublish data={data} onDone={(link) => { close(); onPublished(link); }} onCancel={close} />
        ) : (
          <>
            {step === 0 && <StepPick data={data} patch={patch} />}
            {step === 1 && <StepArtwork data={data} patch={patch} />}
            {step === 2 && <StepPreview data={data} patch={patch} />}
            {step === 3 && <StepDetails data={data} patch={patch} />}
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
          {step < STEPS.length - 1 ? (
            <Button appearance="primary" disabled={!canAdvance} onClick={() => setStep((s) => s + 1)}>
              Next
            </Button>
          ) : (
            <Button
              appearance="primary"
              disabled={!canAdvance}
              onClick={() => {
                if (data.blueprint && data.artwork) setPublishing(true);
              }}
            >
              Publish
            </Button>
          )}
        </ModalFooter>
      )}
    </Modal>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <div className="mb-8 flex flex-col gap-2">
      <div className="flex gap-1.5">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-border'}`}
          />
        ))}
      </div>
      <span className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        Step {step + 1} of {STEPS.length} · {STEPS[step]}
      </span>
    </div>
  );
}
