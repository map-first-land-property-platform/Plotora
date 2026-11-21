"use client";

import { useId, useRef, type KeyboardEvent } from "react";
import { OTP_LENGTH, writeOtp } from "../otp";

type Props = {
  value: string[];
  onChange: (digits: string[]) => void;
  error?: string;
  disabled?: boolean;
};

export default function OtpInput({ value, onChange, error, disabled }: Props) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const errorId = useId();

  function focus(index: number) {
    refs.current[Math.max(0, Math.min(OTP_LENGTH - 1, index))]?.focus();
  }

  function enter(index: number, raw: string) {
    onChange(writeOtp(value, index, raw));
    const added = raw.replace(/[^0-9]/g, "").length;
    if (added) focus(index + added);
  }

  function onKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace") {
      event.preventDefault();
      const target = !value[index] && index > 0 ? index - 1 : index;
      onChange(writeOtp(value, target, ""));
      focus(target);
    } else if (event.key === "Delete") {
      event.preventDefault(); onChange(writeOtp(value, index, ""));
    } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault(); focus(index + (event.key === "ArrowLeft" ? -1 : 1));
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault(); focus(event.key === "Home" ? 0 : OTP_LENGTH - 1);
    }
  }

  return (
    <div>
      <div className="phone-otp-grid" role="group" aria-label="Verification code" aria-describedby={error ? errorId : undefined}>
        {Array.from({ length: OTP_LENGTH }, (_, index) => (
          <input key={index} ref={(node) => { refs.current[index] = node; }}
            value={value[index] ?? ""} type="text" inputMode="numeric" pattern="[0-9]*"
            autoComplete={index === 0 ? "one-time-code" : "off"} maxLength={OTP_LENGTH}
            aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`} aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined} disabled={disabled}
            onChange={(event) => enter(index, event.target.value)} onKeyDown={(event) => onKeyDown(index, event)}
            onFocus={(event) => event.target.select()}
            onPaste={(event) => { event.preventDefault(); enter(index, event.clipboardData.getData("text")); }} />
        ))}
      </div>
      {error && <p className="phone-code-error" role="alert" id={errorId}>{error}</p>}
    </div>
  );
}
