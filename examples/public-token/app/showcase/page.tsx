'use client';

import { useState } from 'react';
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Radio,
  Select,
  Switch,
  Tabs,
  Tag,
  Textarea,
} from '@fourthwall-examples/ui';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardBody className="flex flex-wrap items-start gap-4">{children}</CardBody>
    </Card>
  );
}

export default function Showcase() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('account');

  return (
    <main className="mx-auto max-w-4xl space-y-6 bg-muted p-10">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">@fourthwall-examples/ui</h1>
        <p className="text-muted-foreground">Generic component system · core 12 · neutral theme</p>
      </header>

      <Section title="Buttons">
        <Button appearance="primary">Primary</Button>
        <Button>Secondary</Button>
        <Button appearance="destructive">Destructive</Button>
        <Button appearance="semi-transparent">Semi-transparent</Button>
        <Button appearance="primary" disabled>Disabled</Button>
        <Button appearance="primary" loading>Saving</Button>
        <Button appearance="primary" size="small">Small</Button>
        <Button appearance="primary" size="large">Large</Button>
      </Section>

      <Section title="Inputs">
        <div className="grid w-full grid-cols-2 gap-4">
          <Input label="Email" type="email" placeholder="you@example.com" />
          <Input label="Workspace" placeholder="acme-inc" />
          <Input label="Coupon" defaultValue="SAVE10" error="That code has expired" />
          <Select label="Plan" defaultValue="pro">
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="team">Team</option>
          </Select>
          <Textarea label="Notes" placeholder="Anything else?" className="col-span-2" />
        </div>
      </Section>

      <Section title="Toggles">
        <Checkbox label="Send tracking email" defaultChecked />
        <Checkbox label="Unchecked" />
        <Radio name="r" label="Option A" defaultChecked />
        <Radio name="r" label="Option B" />
        <Switch label="Notifications" defaultChecked />
      </Section>

      <Section title="Tags">
        <Tag>Neutral</Tag>
        <Tag appearance="brand">Brand</Tag>
        <Tag appearance="success">Active</Tag>
        <Tag appearance="critical">Failed</Tag>
        <Tag appearance="alert">Pending</Tag>
      </Section>

      <Section title="Alerts">
        <div className="w-full space-y-3">
          <Alert title="Heads up">This is an informational alert.</Alert>
          <Alert appearance="success" title="Saved">Your changes were saved.</Alert>
          <Alert appearance="critical" title="Something went wrong" onDismiss={() => {}}>
            We couldn&apos;t process that request.
          </Alert>
        </div>
      </Section>

      <Section title="Tabs">
        <div className="w-full">
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { id: 'account', label: 'Account' },
              { id: 'billing', label: 'Billing' },
              { id: 'team', label: 'Team' },
            ]}
          />
          <p className="pt-4 text-muted-foreground">Active tab: {tab}</p>
        </div>
      </Section>

      <Section title="Modal">
        <Button appearance="primary" onClick={() => setOpen(true)}>Open modal</Button>
        <Modal open={open} onClose={() => setOpen(false)}>
          <ModalHeader>Invite a teammate</ModalHeader>
          <ModalBody>
            <p className="mb-4">They&apos;ll get access to this workspace immediately.</p>
            <Input label="Email address" type="email" placeholder="teammate@example.com" />
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button appearance="primary" onClick={() => setOpen(false)}>Send invite</Button>
          </ModalFooter>
        </Modal>
      </Section>
    </main>
  );
}
