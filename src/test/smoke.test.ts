import { describe, it, expect } from "vitest";
import { fc } from "./setup";

describe("Test Setup Smoke Test", () => {
  it("should run basic assertions", () => {
    expect(1 + 1).toBe(2);
  });

  it("should run fast-check property tests", () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (a, b) => {
        return a + b === b + a; // Commutativity of addition
      })
    );
  });
});
