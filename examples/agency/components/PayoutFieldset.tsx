import { Select } from "@fourthwall-examples/ui";
import type { PayoutInput } from "@/lib/types";

interface PayoutFieldsetProps {
  value: PayoutInput;
  onChange: (value: PayoutInput) => void;
}

const COUNTRIES = ["US", "GB", "CA", "AU", "DE", "FR", "ES", "IT", "NL", "PL"];

/** Minimal payout fieldset — the creator completes ID + bank in hosted onboarding. */
export function PayoutFieldset({ value, onChange }: PayoutFieldsetProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Select
        label="Country"
        value={value.country}
        onChange={(e) => onChange({ ...value, country: e.target.value })}
      >
        {COUNTRIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </Select>
      <Select
        label="Business type"
        value={value.businessType}
        onChange={(e) => onChange({ ...value, businessType: e.target.value })}
      >
        <option value="INDIVIDUAL">Individual</option>
        <option value="COMPANY">Company</option>
      </Select>
    </div>
  );
}
