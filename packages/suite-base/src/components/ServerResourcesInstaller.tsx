// SPDX-License-Identifier: MPL-2.0

// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

import { useEffect, useRef } from "react";

import Logger from "@lichtblick/log";
import { useCurrentLayoutActions } from "@lichtblick/suite-base/context/CurrentLayoutContext";
import { useExtensionCatalog } from "@lichtblick/suite-base/context/ExtensionCatalogContext";
import { useLayoutManager } from "@lichtblick/suite-base/context/LayoutManagerContext";
import { useLayoutTransfer } from "@lichtblick/suite-base/hooks/useLayoutTransfer";
import { windowAppURLState } from "@lichtblick/suite-base/util/appURLState";
import isDesktopApp from "@lichtblick/suite-base/util/isDesktopApp";
import { getServerExtensionArtifacts } from "@lichtblick/suite-base/util/serverExtensions";
import { parseServerLayoutList } from "@lichtblick/suite-base/util/serverLayouts";

const log = Logger.getLogger(__filename);

const LAYOUTS_LIST_URL = "/remote-layouts.list";
const LAYOUTS_URL_PREFIX = "/remote-layouts/";

function ExtensionsInstaller(): ReactNull {
  const downloadExtension = useExtensionCatalog((state) => state.downloadExtension);
  const installExtensions = useExtensionCatalog((state) => state.installExtensions);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) {
      return;
    }
    started.current = true;

    void (async () => {
      try {
        for (const { filename, url } of await getServerExtensionArtifacts()) {
          const buffer = await downloadExtension(url);
          const results = await installExtensions("local", [{ buffer }]);
          if (results.some((result) => !result.success)) {
            throw new Error(`installation failed for ${filename}`);
          }
        }
      } catch (error) {
        log.error("Failed to install server extensions", error);
      }
    })();
  }, [downloadExtension, installExtensions]);

  return ReactNull;
}

function LayoutsInstaller(): ReactNull {
  const { parseAndInstallLayout } = useLayoutTransfer();
  const { setSelectedLayoutId } = useCurrentLayoutActions();
  const layoutManager = useLayoutManager();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) {
      return;
    }
    started.current = true;

    void (async () => {
      try {
        const listResponse = await fetch(LAYOUTS_LIST_URL, { cache: "no-cache" });
        if (!listResponse.ok) {
          throw new Error(`status ${listResponse.status}`);
        }

        const entries = parseServerLayoutList(await listResponse.text());
        await Promise.all(
          entries.map(async ({ filename, id }) => {
            const response = await fetch(`${LAYOUTS_URL_PREFIX}${filename}`, {
              cache: "no-cache",
            });
            if (!response.ok) {
              throw new Error(`${filename}: status ${response.status}`);
            }
            const basename = filename.replace(/^.*\//, "").replace(/\.[^.]+$/, "");
            const file = new File([await response.blob()], `[Server] ${basename}.json`, {
              type: "application/json",
            });
            await parseAndInstallLayout(file, "local", {
              replaceExisting: true,
              select: false,
              id,
              from: filename,
            });
          }),
        );

        const layoutId = windowAppURLState()?.layoutId;
        const requestedLayout =
          layoutId != undefined ? await layoutManager.getLayout(layoutId) : undefined;
        if (layoutId != undefined) {
          setSelectedLayoutId(requestedLayout?.from != undefined ? layoutId : undefined, {
            saveToProfile: false,
          });
        }
      } catch (error) {
        log.error("Failed to install server layouts", error);
      }
    })();
  }, [layoutManager, parseAndInstallLayout, setSelectedLayoutId]);

  return ReactNull;
}

export function ServerResourcesInstaller(): React.JSX.Element | null {
  if (isDesktopApp()) {
    return null;
  }
  return (
    <>
      <ExtensionsInstaller />
      <LayoutsInstaller />
    </>
  );
}
