// SPDX-License-Identifier: MPL-2.0

// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

import { LayoutID } from "@lichtblick/suite-base/context/CurrentLayoutContext";

export type ServerLayoutEntry = {
  filename: string;
  id: LayoutID;
};

/**
 * Parses layouts.list. Plain filename lines are assigned IDs in lexical filename order.
 * Stable IDs can be supplied by the server using: `id1 layouts/foo.json`.
 */
export function parseServerLayoutList(text: string): ServerLayoutEntry[] {
  const parsed = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = /^(id[A-Za-z0-9_-]+)\s+(.+)$/.exec(line);
      return match != undefined
        ? { id: match[1] as LayoutID, filename: match[2]!.trim() }
        : { filename: line, id: undefined };
    });

  const hasExplicitIds = parsed.some((entry) => entry.id != undefined);
  if (hasExplicitIds) {
    if (parsed.some((entry) => entry.id == undefined)) {
      throw new Error("layouts.list must not mix entries with and without explicit IDs");
    }
    const ids = parsed.map((entry) => entry.id!);
    if (new Set(ids).size !== ids.length) {
      throw new Error("layouts.list contains duplicate IDs");
    }
    return parsed as ServerLayoutEntry[];
  }

  return parsed
    .sort((a, b) => (a.filename < b.filename ? -1 : a.filename > b.filename ? 1 : 0))
    .map((entry, index) => ({ filename: entry.filename, id: `id${index + 1}` as LayoutID }));
}
