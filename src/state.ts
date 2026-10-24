/** The whole app state lives here, in memory only. Nothing is persisted. */

import { ENTRY_FACTORIES, type AnyEntry, type EntryKey, type Profile, type VisibilityKey, setVisibility } from "./model/profile";
import type { SectionKey } from "./model/sections";

export interface OpenEntry {
  section: EntryKey;
  index: number;
}

export interface State {
  screen: "welcome" | "editor";
  profile: Profile;
  section: SectionKey;
  openEntry: OpenEntry | null;
  /** True when the CV changed since the last Word download (or import). */
  dirty: boolean;
  /** True once a Word file with the current content has been downloaded. */
  downloaded: boolean;
}

export type Action =
  | { type: "start"; profile: Profile; fromFile: boolean }
  | { type: "edit"; profile: Profile }
  | { type: "go"; section: SectionKey }
  | { type: "open"; entry: OpenEntry | null }
  | { type: "visibility"; keys: readonly VisibilityKey[]; visible: boolean }
  | { type: "add-entry"; section: EntryKey }
  | { type: "remove-entry"; section: EntryKey; index: number }
  | { type: "move-entry"; section: EntryKey; index: number; offset: -1 | 1 }
  | { type: "duplicate-entry"; section: EntryKey; index: number }
  | { type: "downloaded" };

export const initialState = (profile: Profile): State => ({
  screen: "welcome",
  profile,
  section: "personal",
  openEntry: null,
  dirty: false,
  downloaded: false,
});

function withEntries(profile: Profile, section: EntryKey, entries: AnyEntry[]): Profile {
  return { ...profile, [section]: entries };
}

function edited(state: State, profile: Profile, openEntry = state.openEntry): State {
  return { ...state, profile, openEntry, dirty: true, downloaded: false };
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "start":
      return {
        screen: "editor",
        profile: action.profile,
        section: "personal",
        openEntry: null,
        dirty: false,
        downloaded: action.fromFile,
      };
    case "edit":
      return edited(state, action.profile);
    case "go": {
      // A section with a single entry opens it, so there is something to type in.
      const single = action.section !== "personal" && state.profile[action.section].length === 1;
      return { ...state, section: action.section, openEntry: single ? { section: action.section as EntryKey, index: 0 } : null };
    }
    case "open":
      return { ...state, openEntry: action.entry };
    case "visibility":
      return edited(state, setVisibility(state.profile, action.keys, action.visible));
    case "add-entry": {
      const entries = [...(state.profile[action.section] as AnyEntry[]), ENTRY_FACTORIES[action.section]()];
      return edited(state, withEntries(state.profile, action.section, entries), {
        section: action.section,
        index: entries.length - 1,
      });
    }
    case "remove-entry": {
      const entries = (state.profile[action.section] as AnyEntry[]).filter((_, index) => index !== action.index);
      return edited(state, withEntries(state.profile, action.section, entries), null);
    }
    case "move-entry": {
      const entries = [...(state.profile[action.section] as AnyEntry[])];
      const target = action.index + action.offset;
      if (target < 0 || target >= entries.length) return state;
      [entries[action.index], entries[target]] = [entries[target], entries[action.index]];
      return edited(state, withEntries(state.profile, action.section, entries), { section: action.section, index: target });
    }
    case "duplicate-entry": {
      const entries = [...(state.profile[action.section] as AnyEntry[])];
      entries.splice(action.index + 1, 0, structuredClone(entries[action.index]));
      return edited(state, withEntries(state.profile, action.section, entries), {
        section: action.section,
        index: action.index + 1,
      });
    }
    case "downloaded":
      return { ...state, dirty: false, downloaded: true };
  }
}
