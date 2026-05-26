'use client';

import { useState } from 'react';
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
  Checkbox,
  Input,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Select,
  Switch,
  Tabs,
  Tag,
  Textarea,
} from '@fourthwall-examples/ui';

export default function AccountSettings() {
  const [tab, setTab] = useState('profile');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-6 py-12">
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Account settings</h1>
          <p className="text-muted-foreground">Manage your profile and preferences.</p>
        </div>
        <Tag appearance="brand">Pro</Tag>
      </header>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'profile', label: 'Profile' },
          { id: 'notifications', label: 'Notifications' },
          { id: 'danger', label: 'Danger zone' },
        ]}
      />

      {tab === 'profile' && (
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>This information is shown on your public store page.</CardDescription>
          </CardHeader>
          <CardBody className="space-y-5">
            {saved && <Alert appearance="success" title="Saved" onDismiss={() => setSaved(false)}>Your profile was updated.</Alert>}
            <div className="grid grid-cols-2 gap-4">
              <Input label="Display name" defaultValue="Acme Inc" />
              <Input label="Email" type="email" defaultValue="team@acme.com" />
            </div>
            <Select label="Timezone" defaultValue="pst">
              <option value="pst">Pacific (PST)</option>
              <option value="est">Eastern (EST)</option>
              <option value="utc">UTC</option>
            </Select>
            <Textarea label="Bio" placeholder="Tell supporters about your brand…" rows={3} />
            <Switch label="Show profile publicly" defaultChecked />
          </CardBody>
          <CardFooter>
            <Button>Cancel</Button>
            <Button appearance="primary" onClick={() => setSaved(true)}>Save changes</Button>
          </CardFooter>
        </Card>
      )}

      {tab === 'notifications' && (
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Choose what we email you about.</CardDescription>
          </CardHeader>
          <CardBody className="space-y-3">
            <Checkbox label="New orders" defaultChecked />
            <Checkbox label="Weekly summary" defaultChecked />
            <Checkbox label="Product tips" />
          </CardBody>
        </Card>
      )}

      {tab === 'danger' && (
        <Card>
          <CardHeader>
            <CardTitle>Danger zone</CardTitle>
            <CardDescription>Irreversible actions.</CardDescription>
          </CardHeader>
          <CardBody>
            <Alert appearance="critical" title="Delete account">
              This permanently removes your account and all shop data.
            </Alert>
          </CardBody>
          <CardFooter>
            <Button appearance="destructive" onClick={() => setConfirmOpen(true)}>Delete account</Button>
          </CardFooter>
        </Card>
      )}

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} size="small">
        <ModalHeader>Delete account?</ModalHeader>
        <ModalBody>This cannot be undone. All of your shop data will be permanently removed.</ModalBody>
        <ModalFooter>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button appearance="destructive" onClick={() => setConfirmOpen(false)}>Delete</Button>
        </ModalFooter>
      </Modal>
    </main>
  );
}
