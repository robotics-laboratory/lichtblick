// SPDX-License-Identifier: MPL-2.0

import { parseServerLayoutList } from "@lichtblick/suite-base/util/serverLayouts";

describe("parseServerLayoutList", () => {
  it("assigns deterministic IDs to the legacy filename-only format", () => {
    expect(parseServerLayoutList("layouts/Z.json\nlayouts/A.json\n")).toEqual([
      { filename: "layouts/A.json", id: "id1" },
      { filename: "layouts/Z.json", id: "id2" },
    ]);
  });

  it("uses IDs supplied by the server", () => {
    expect(parseServerLayoutList("id-truck layouts/Truck.json\nid2 layouts/Demo.json")).toEqual([
      { filename: "layouts/Truck.json", id: "id-truck" },
      { filename: "layouts/Demo.json", id: "id2" },
    ]);
  });

  it("rejects mixed explicit and legacy formats", () => {
    expect(() => parseServerLayoutList("id1 layouts/A.json\nlayouts/B.json")).toThrow(
      "layouts.list must not mix entries with and without explicit IDs",
    );
  });

  it("rejects duplicate explicit IDs", () => {
    expect(() => parseServerLayoutList("id1 layouts/A.json\nid1 layouts/B.json")).toThrow(
      "layouts.list contains duplicate IDs",
    );
  });
});
