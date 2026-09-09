// SPDX-License-Identifier: MPL-2.0

import { getServerExtensionArtifacts } from "@lichtblick/suite-base/util/serverExtensions";

describe("getServerExtensionArtifacts", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("maps arbitrary filenames from the server list", async () => {
    jest
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response("./vendor.first-1.0.0.foxe\nvendor.second-2.0.0.foxe\n"));

    await expect(getServerExtensionArtifacts()).resolves.toEqual([
      {
        filename: "vendor.first-1.0.0.foxe",
        url: "/remote-extensions/vendor.first-1.0.0.foxe",
      },
      {
        filename: "vendor.second-2.0.0.foxe",
        url: "/remote-extensions/vendor.second-2.0.0.foxe",
      },
    ]);
    expect(global.fetch).toHaveBeenCalledWith("/remote-extensions.list");
  });

  it("rejects an unsuccessful list response", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(new Response(undefined, { status: 502 }));

    await expect(getServerExtensionArtifacts()).rejects.toThrow(
      "/remote-extensions.list: status 502",
    );
  });
});
