import { forwardRef, InputHTMLAttributes, ReactNode, useId } from "react";

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
  const generatedId = useId();
  const inputId = id ?? rest.name ?? generatedId;
  const input = (
    <input
      ref={ref}
      id={inputId}
      aria-invalid={!!error}
      className={`input ${right ? "pr-12" : ""}`}
      {...rest}
    />
  );

  return (
    <div className={`field ${error ? "is-invalid" : ""}`}>
      <label className="label" htmlFor={inputId}>
        {label}{required && <span className="req" aria-hidden="true">*</span>}
      </label>
      {icon || right ? (
        <div className={icon ? "input-icon" : "relative"}>
          {icon}
          {input}
          {right && <span className="absolute right-3 top-1/2 -translate-y-1/2">{right}</span>}
        </div>
      ) : input}
      {error && <div className="field-error" role="alert">{error}</div>}
    </div>
  );
});

export default TextField;
