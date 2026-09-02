import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

export const fieldClass=
    "w-full rounded-full bg-input px-4 py-2 text-xs text-center " +
    "border border-muted/40 outline-none focus:border-blue " +
    "placeholder:text-neutral-600";

export const areaClass =
    "w-full rounded-2xl bg-input px-4 py-2 text-xs " +
    "border border-muted/40 outline-none focus:border-blue " +
    "placeholder:text-neutral-600 placeholder:text-center resize-none [field-sizing:content]";

export const labelClass = "block text-xs text-neutral-800 mb-1";

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
    ...props
}: { label: string; error?: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return (
        <div>
            <label className={labelClass}>
                {label}
            </label>
            <textarea className={areaClass} rows={2} {...props} />
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}