import test from "node:test";
import assert from "node:assert/strict";
import { recoveryEmailSchema, recoveryPasswordSchema } from "../src/features/auth/recovery-validation.ts";

test("recovery accepts trimmed emails and rejects invalid or empty input", () => {
  assert.equal(recoveryEmailSchema.parse({ email: "  buyer@example.com  " }).email, "buyer@example.com");
  for (const email of ["", " ", "not-an-email", "buyer@", "buyer@example.com\nother@example.com"]) {
    assert.equal(recoveryEmailSchema.safeParse({ email }).success, false);
  }
});

test("reset requires matching passwords and the existing registration rules", () => {
  const cases = ["short1A", "lowercase123", "UPPERCASE123", "NoNumbersHere", "A1" + "a".repeat(99), "Ab1" + "界".repeat(24)];
  for (const password of cases) assert.equal(recoveryPasswordSchema.safeParse({ password, confirmPassword: password }).success, false);
  assert.equal(recoveryPasswordSchema.safeParse({ password: "Example123", confirmPassword: "Different123" }).success, false);
  for (const password of ["Example1", "A1" + "a".repeat(70), "Ab1" + "界".repeat(23)]) assert.equal(recoveryPasswordSchema.safeParse({ password, confirmPassword: password }).success, true);
});
