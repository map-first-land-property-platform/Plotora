import test from "node:test";
import assert from "node:assert/strict";
import { emptyOtp, isCompleteOtp, writeOtp } from "../src/features/auth/otp.ts";

test("OTP editing keeps later digits in their original boxes", () => {
  const original = ['1', '2', '3', '4', '5', '6'];
  const edited = writeOtp(original, 2, '');
  assert.deepEqual(edited, ['1', '2', '', '4', '5', '6']);
  assert.equal(isCompleteOtp(edited), false);
  assert.deepEqual(writeOtp(edited, 2, '9'), ['1', '2', '9', '4', '5', '6']);
  assert.deepEqual(original, ['1', '2', '3', '4', '5', '6']);
});

test("OTP paste/autofill accepts six ASCII digits and preserves boundaries", () => {
  assert.deepEqual(writeOtp(emptyOtp(), 0, '12 34-56789'), ['1', '2', '3', '4', '5', '6']);
  assert.deepEqual(writeOtp(emptyOtp(), 4, '789'), ['', '', '', '', '7', '8']);
  assert.equal(isCompleteOtp(writeOtp(emptyOtp(), 0, '123456')), true);
  assert.equal(isCompleteOtp(['1', '2', '', '3', '4', '5']), false);
  assert.equal(isCompleteOtp(['1', '2', 'x', '3', '4', '5']), false);
  assert.equal(isCompleteOtp(['1', '2', '3', '4', '5']), false);
  assert.deepEqual(writeOtp(emptyOtp(), -1, '123456'), emptyOtp());
});
