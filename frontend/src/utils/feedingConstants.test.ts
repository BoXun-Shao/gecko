import { describe, expect, it } from "vitest";
import { sizesFor } from "./feedingConstants";

describe("sizesFor", () => {
  it("returns the known size options for a recognized food", () => {
    expect(sizesFor("蟋蟀")).toEqual(["針頭", "1–2齡 S", "3–4齡 M", "5齡 L", "成蟲"]);
  });

  it("trims whitespace before matching", () => {
    expect(sizesFor("  蟋蟀  ")).toEqual(sizesFor("蟋蟀"));
  });

  it("falls back to generic S/M/L for an unrecognized food", () => {
    expect(sizesFor("神秘餌料")).toEqual(["S", "M", "L"]);
  });
});
