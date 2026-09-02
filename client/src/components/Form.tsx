import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/Select";

export const fieldClass =
  "w-full rounded-lg bg-input px-4 py-2 text-xs " +
  "border border-muted/40 outline-none focus:border-blue " +
  "placeholder:text-neutral-600";

export const areaClass =
  "w-full rounded-2xl bg-input px-4 py-2 text-xs " +
  "border border-muted/40 outline-none focus:border-blue " +
  "placeholder:text-neutral-600 resize-none [field-sizing:content]";

export const labelClass = "block text-xs text-neutral-800 mt-1 mb-1 first:mt-0";

export type Option = { value: string; label: string };

export function Field({
  label,
  error,
  ...props
}: { label: string; error?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className={labelClass}>
        {label}
      </label>
      <input className={fieldClass} {...props} />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function TextArea({
  label,
  error,
  hint,
  ...props
}: { label: string; error?: string; hint?: string; } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label className={labelClass}>{label}</label>
        {hint && <span className="text-xs text-muted/60">{hint}</span>}
      </div>
      <textarea className={areaClass} rows={2} {...props} />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function SelectField({
  label,
  error,
  options,
  placeholder = "Selection field",
  value,
  onChange,
}: {
  label: string;
  error?: string;
  options: readonly Option[];
  placeholder?: string;
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <Select value={value} onValueChange={onChange} items={options}>
        <SelectTrigger className={`${fieldClass} flex items-center justify-between`}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}