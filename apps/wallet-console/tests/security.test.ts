import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseManifest,
  amount,
  validateReceipt,
  allowWrite,
} from "../src/security.ts";
const manifest = {
  chainId: 84532,
  vault: "0x1111111111111111111111111111111111111111",
  runtimeCodeHash: "0x" + "11".repeat(32),
  securityVersion: 1,
  assets: [],
};
test("manifest rejects mainnet without verifiable audit evidence", () =>
  assert.throws(
    () => parseManifest({ ...manifest, chainId: 8453 }),
    /mainnet/i,
  ));
test("manifest rejects wrong version and invalid code hashes", () => {
  assert.throws(
    () => parseManifest({ ...manifest, securityVersion: 2 }),
    /version/i,
  );
  assert.throws(
    () => parseManifest({ ...manifest, runtimeCodeHash: "0x1234" }),
    /hash/i,
  );
});
test("amount parsing rejects rounded fractions and nonpositive values", () => {
  for (const v of ["0", "-1", "1e3", "0.0000001"])
    assert.throws(() => amount(v, 6));
  assert.equal(amount("1.234567", 6), 1234567n);
});
test("reverted receipt never reports success", () =>
  assert.throws(() => validateReceipt({ status: "reverted" }), /reverted/i));
test("operator cannot write owner methods or bypass verification", () => {
  assert.throws(
    () => allowWrite("operator", "setOperator", true, false),
    /owner/i,
  );
  assert.throws(
    () => allowWrite("owner", "setOperator", false, false),
    /verify/i,
  );
  assert.throws(() => allowWrite("owner", "agentExecute", true, true), /demo/i);
});
test("a receipt for another transaction cannot confirm the submitted request", () =>
  assert.throws(
    () =>
      validateReceipt(
        {
          status: "success",
          transactionHash: ("0x" + "22".repeat(32)) as `0x${string}`,
        },
        ("0x" + "11".repeat(32)) as `0x${string}`,
      ),
    /different transaction/i,
  ));
