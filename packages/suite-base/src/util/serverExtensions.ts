// SPDX-License-Identifier: MPL-2.0

// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

export type ServerExtensionArtifact = {
  filename: string;
  url: string;
};

const EXTENSIONS_LIST_URL = "/remote-extensions.list";
const EXTENSIONS_URL_PREFIX = "/remote-extensions/";

export async function getServerExtensionArtifacts(): Promise<ServerExtensionArtifact[]> {
  const response = await fetch(EXTENSIONS_LIST_URL);
  if (!response.ok) {
    throw new Error(`${EXTENSIONS_LIST_URL}: status ${response.status}`);
  }

  return (await response.text())
    .split("\n")
    .map((line) => line.trim().replace(/^\.\//, ""))
    .filter(Boolean)
    .map((filename) => ({ filename, url: `${EXTENSIONS_URL_PREFIX}${filename}` }));
}
