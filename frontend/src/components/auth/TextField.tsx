import { forwardRef, InputHTMLAttributes, ReactNode } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  required?: boolean;
  icon?: ReactNode;
  right?: ReactNode;
  error?: string;
};

const TextField = forwardRef<HTMLInputElement, Props>(function TextField(
  { label, required, icon, right, error, id, ...rest },
  ref
) {
  const inputId = id ?? rest.name;
  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-[#1f2d33]">
        {label}
        {required && <span className="ml-1 text-red-600">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          className={`h-11 w-full rounded-lg border bg-white text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#14796a] focus:ring-2 focus:ring-[#14796a]/20 ${
            icon ? "pl-10" : "pl-3"
          } ${right ? "pr-10" : "pr-3"} ${error ? "border-red-500" : "border-slate-200"}`}
          {...rest}
        />
        {right && <span className="absolute right-3 top-1/2 -translate-y-1/2">{right}</span>}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
});

export default TextField;