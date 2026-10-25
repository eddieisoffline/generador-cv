import { useEffect, useReducer, useRef, useState } from "react";
import { ConfirmDialog, ExportDialog, PrivacyDialog, SettingsDialog, type Theme } from "./components/Dialogs";
import { Editor } from "./components/Editor";
import { Icon } from "./components/icons";
import { Preview } from "./components/Preview";
import { Rail } from "./components/Rail";
import { TopBar } from "./components/TopBar";
import { Welcome } from "./components/Welcome";
import { browserLocale, t, type MessageKey } from "./i18n";
import { fileStem } from "./lib/format";
import { VISIBILITY_KEYS, emptyProfile, hasContent, sectionIsActive, type Locale, type Profile } from "./model/profile";
import { initialState, reducer } from "./state";

type Confirm = { kind: "new" } | { kind: "replace"; profile: Profile } | null;

const errorText = (error: unknown) => (error instanceof Error ? error.message : String(error));

export function App() {
  const [locale, setLocale] = useState<Locale>(browserLocale);
  const [theme, setTheme] = useState<Theme>("system");
  const [state, dispatch] = useReducer(reducer, locale, (initial: Locale) => initialState(emptyProfile(initial)));
  const [dialog, setDialog] = useState<"settings" | "privacy" | "export" | null>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [railOpen, setRailOpen] = useState(false);
  const [busy, setBusy] = useState<"pdf" | "docx" | null>(null);
  const [exportError, setExportError] = useState("");
  const [openError, setOpenError] = useState("");
  const [toast, setToast] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const { profile } = state;

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = t(locale, "doc_title");
  }, [locale]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") delete root.dataset.theme;
    else root.dataset.theme = theme;
  }, [theme]);

  // Closing or reloading the tab erases the CV, so ask first when the latest
  // changes have not been downloaded.
  const unsaved = state.screen === "editor" && state.dirty && hasContent(profile);
  useEffect(() => {
    if (!unsaved) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [unsaved]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!railOpen) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && setRailOpen(false);
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [railOpen]);

  const start = (next: Profile, fromFile: boolean) => {
    dispatch({ type: "start", profile: next, fromFile });
    setOpenError("");
    setConfirm(null);
    if (fromFile) setToast(t(locale, "imported"));
  };

  const openFile = async (file: File) => {
    setOpenError("");
    try {
      const { readCvFile } = await import("./export/files");
      const loaded = await readCvFile(file);
      if (state.screen === "editor" && unsaved) setConfirm({ kind: "replace", profile: loaded });
      else start(loaded, true);
    } catch (error) {
      const code = (error as { code?: string }).code;
      const key: MessageKey =
        code === "not_docx" ? "import_not_docx"
        : code === "too_big" ? "import_too_big"
        : code === "no_data" ? "import_no_data"
        : code === "newer" ? "import_newer"
        : "import_broken";
      const message = t(locale, key, { error: errorText(error) });
      if (state.screen === "welcome") setOpenError(message);
      else setToast(message);
    }
  };

  const download = async (kind: "pdf" | "docx") => {
    setBusy(kind);
    setExportError("");
    try {
      const files = await import("./export/files");
      if (kind === "pdf") {
        const { buildPdf } = await import("./export/pdf-browser");
        files.saveFile(await buildPdf(profile), `${fileStem(profile.name)}.pdf`, files.PDF_MIME);
      } else {
        const { buildDocx } = await import("./export/docx");
        files.saveFile(await buildDocx(profile), `${fileStem(profile.name)}.docx`, files.DOCX_MIME);
        dispatch({ type: "downloaded" });
      }
    } catch (error) {
      setExportError(t(locale, "export_error", { error: errorText(error) }));
    } finally {
      setBusy(null);
    }
  };

  const hasHidden = VISIBILITY_KEYS.some(
    (key) => !sectionIsActive(profile, key) && (profile[key] as unknown[]).length > 0,
  );

  return (
    <>
      <input
        ref={fileInput}
        type="file"
        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void openFile(file);
        }}
      />

      {state.screen === "welcome" ? (
        <Welcome
          locale={locale}
          error={openError}
          onStart={() => start(emptyProfile(locale), false)}
          onOpen={() => fileInput.current?.click()}
          onFile={(file) => void openFile(file)}
          onPrivacy={() => setDialog("privacy")}
          onSettings={() => setDialog("settings")}
        />
      ) : (
        <div className="cv-app">
          <a className="cv-skip" href="#editor">{t(locale, "skip_to_editor")}</a>
          <TopBar
            locale={locale}
            name={profile.name.trim()}
            dirty={state.dirty}
            downloaded={state.downloaded}
            onSections={() => setRailOpen(true)}
            onPrivacy={() => setDialog("privacy")}
            onSettings={() => setDialog("settings")}
            onNew={() => (unsaved ? setConfirm({ kind: "new" }) : start(emptyProfile(locale), false))}
            onOpen={() => fileInput.current?.click()}
            onExport={() => {
              setExportError("");
              setDialog("export");
            }}
          />
          <div className="cv-workspace">
            <button
              type="button"
              className="cv-drawer-scrim"
              data-open={railOpen}
              aria-label={t(locale, "close")}
              tabIndex={-1}
              onClick={() => setRailOpen(false)}
            />
            <div className="cv-rail-panel cv-sticky" data-open={railOpen}>
              <Rail
                state={state}
                dispatch={dispatch}
                locale={locale}
                onNavigate={() => {
                  setRailOpen(false);
                  document.getElementById("editor")?.focus({ preventScroll: true });
                  window.scrollTo({ top: 0 });
                }}
                onPrivacy={() => setDialog("privacy")}
              />
            </div>
            <Editor state={state} dispatch={dispatch} locale={locale} />
            <Preview profile={profile} section={state.section} locale={locale} />
          </div>
        </div>
      )}

      <SettingsDialog
        open={dialog === "settings"}
        onClose={() => setDialog(null)}
        locale={locale}
        theme={theme}
        onLocale={setLocale}
        onTheme={setTheme}
      />
      <PrivacyDialog open={dialog === "privacy"} onClose={() => setDialog(null)} locale={locale} />
      <ExportDialog
        open={dialog === "export"}
        onClose={() => setDialog(null)}
        locale={locale}
        busy={busy}
        error={exportError}
        hasHidden={hasHidden}
        onPdf={() => void download("pdf")}
        onDocx={() => void download("docx")}
      />
      <ConfirmDialog
        open={confirm !== null}
        title={t(locale, confirm?.kind === "replace" ? "confirm_open_title" : "confirm_new_title")}
        text={t(locale, confirm?.kind === "replace" ? "confirm_open_text" : "confirm_new_text")}
        confirmLabel={t(locale, confirm?.kind === "replace" ? "replace" : "start_over")}
        onConfirm={() => {
          if (confirm?.kind === "replace") start(confirm.profile, true);
          else start(emptyProfile(locale), false);
        }}
        onClose={() => setConfirm(null)}
        locale={locale}
      />

      {toast && (
        <div className="cv-toast" role="status">
          <Icon name="info" />
          {toast}
        </div>
      )}
    </>
  );
}
