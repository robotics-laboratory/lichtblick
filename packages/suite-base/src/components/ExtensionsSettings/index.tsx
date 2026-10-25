// SPDX-FileCopyrightText: Copyright (C) 2023-2026 Bayerische Motoren Werke Aktiengesellschaft (BMW AG)<lichtblick@bmwgroup.com>
// SPDX-License-Identifier: MPL-2.0

// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import FileUploadRoundedIcon from "@mui/icons-material/FileUploadRounded";
import { Alert, AlertTitle, Button } from "@mui/material";
import { useSnackbar } from "notistack";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { ExtensionDetails } from "@lichtblick/suite-base/components/ExtensionDetails";
import useExtensionSettings from "@lichtblick/suite-base/components/ExtensionsSettings/hooks/useExtensionSettings";
import { FocusedExtension } from "@lichtblick/suite-base/components/ExtensionsSettings/types";
import SearchBar from "@lichtblick/suite-base/components/SearchBar/SearchBar";
import Stack from "@lichtblick/suite-base/components/Stack";
import { useExtensionCatalog } from "@lichtblick/suite-base/context/ExtensionCatalogContext";

import ExtensionList from "./components/ExtensionList/ExtensionList";
import { useStyles } from "./index.style";

export default function ExtensionsSettings(): React.ReactElement {
  const { t } = useTranslation("extensionsSettings");
  const { classes } = useStyles();
  const fileInputRef = useRef<HTMLInputElement>(ReactNull);
  const [isInstalling, setIsInstalling] = useState(false);
  const installExtensions = useExtensionCatalog((state) => state.installExtensions);
  const { enqueueSnackbar } = useSnackbar();

  const [focusedExtension, setFocusedExtension] = useState<FocusedExtension | undefined>();

  const {
    setUndebouncedFilterText,
    marketplaceEntries,
    refreshMarketplaceEntries,
    undebouncedFilterText,
    namespacedData,
    groupedMarketplaceData,
    debouncedFilterText,
  } = useExtensionSettings();

  const onClear = () => {
    setUndebouncedFilterText("");
  };

  const selectFocusedExtension = useCallback(
    (newFocusedExtension: FocusedExtension) => {
      setFocusedExtension(newFocusedExtension);
    },
    [setFocusedExtension],
  );

  if (focusedExtension != undefined) {
    return (
      <ExtensionDetails
        installed={focusedExtension.installed}
        extension={focusedExtension.entry}
        onClose={() => {
          setFocusedExtension(undefined);
        }}
      />
    );
  }

  return (
    <Stack gap={1}>
      <Button
        startIcon={<FileUploadRoundedIcon />}
        disabled={isInstalling}
        onClick={() => fileInputRef.current?.click()}
      >
        {t(isInstalling ? "installing" : "installFromFile")}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".foxe"
        hidden
        onChange={async (event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          if (!file) {
            return;
          }
          setIsInstalling(true);
          try {
            const buffer = new Uint8Array(await file.arrayBuffer());
            const [result] = await installExtensions("local", [{ buffer, file }]);
            if (!result?.success) {
              throw new Error(t("installationFailed", { name: file.name }));
            }
            enqueueSnackbar(
              t("installationSucceeded", { name: result.extensionName ?? file.name }),
              { variant: "success" },
            );
          } catch (error) {
            enqueueSnackbar(error instanceof Error ? error.message : String(error), {
              variant: "error",
            });
          } finally {
            setIsInstalling(false);
          }
        }}
      />
      {marketplaceEntries.error && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" onClick={async () => await refreshMarketplaceEntries()}>
              Retry
            </Button>
          }
        >
          <AlertTitle>{t("failedToRetrieveMarketplaceExtensions")}</AlertTitle>
          {t("checkInternetConnection")}
        </Alert>
      )}
      <div className={classes.searchBarDiv}>
        <SearchBar
          data-testid="SearchBarComponent"
          className={classes.searchBarPadding}
          id="extension-filter"
          placeholder={t("searchExtensions")}
          variant="outlined"
          onChange={(event) => {
            setUndebouncedFilterText(event.target.value);
          }}
          value={undebouncedFilterText}
          showClearIcon={!!debouncedFilterText}
          onClear={onClear}
        />
      </div>
      {namespacedData.map(({ namespace, entries }) => (
        <ExtensionList
          key={namespace}
          filterText={debouncedFilterText}
          entries={entries}
          namespace={namespace}
          selectExtension={selectFocusedExtension}
        />
      ))}
      {groupedMarketplaceData.map(({ namespace, entries }) => (
        <ExtensionList
          key={namespace}
          filterText={debouncedFilterText}
          entries={entries}
          namespace={namespace}
          selectExtension={selectFocusedExtension}
        />
      ))}
    </Stack>
  );
}
