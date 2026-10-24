# Local CV Generator

A privacy-friendly Streamlit MVP for maintaining a CV locally and exporting it
to LaTeX, PDF, DOCX, or JSON. Everything runs on your machine: the app sends
your CV text to no external service.

## Run

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
streamlit run app.py
```

Profiles are saved as JSON under `profiles/` (ignored by git). Two empty,
clearly marked starter schemas are in `examples/`; copy one into `profiles/`
when desired. Replace every placeholder with your own facts.

## Visual behavior

The interface follows the "Generador local de CV" design system: a paper-toned
light theme (Papel) and an ink dark theme (Tinta), Instrument Sans for the
interface, Instrument Serif for titles, and Carlito inside the CV preview.
`.streamlit/config.toml` themes Streamlit's own widgets for both themes, and
`utils/ui.py` styles the custom parts with CSS `light-dark()`, so switching the
theme from Streamlit's menu (Settings) restyles everything. Fonts are served
from `static/fonts` (licenses and sources in its README) and icons use the
Material Symbols font bundled with Streamlit, so the interface makes no
requests to Google Fonts and looks the same offline.

The workspace has three areas:

- **Top bar**: the profile menu (open, create, duplicate, delete with inline
  confirmation), the save status (*Unsaved draft*, *Unsaved*, *Saved*),
  **Settings** (interface language), **Export**, and
  **Save profile**, which is enabled only when there are changes.
- **Section rail** (sidebar): every section in the export order with its entry
  count, a warning count from the bullet validator, and an eye button that
  shows or hides the section in the CV. A progress meter at the bottom
  suggests the next step.
- **Editor and live preview**: the editor shows only the open section; the
  right column shows the CV sheet with the same layout as the PDF and DOCX
  exports, outlining the section being edited.

Each entry is a collapsible card with its fields in pairs, its bullets, and
Move up / Move down / Duplicate / Remove actions. Each bullet is its own row
with a menu for Move and Remove; validator hints and a character count appear
under it. Title and summary are
kept in the profile but marked as not exported, matching the generators.

The layout stacks into one column on narrow screens, keeps keyboard focus
visible, and honors `prefers-reduced-motion`. States always carry a word or an
icon, never color alone.

## Terminal logging

The app writes operational logs to the terminal running Streamlit. Logs include
application startup, profile operations, exports, and errors. CV text and bullet content are
never logged.

The default level is `INFO`. To change it in PowerShell:

```powershell
$env:CV_LOG_LEVEL = "DEBUG"
streamlit run app.py
```

Supported levels include `DEBUG`, `INFO`, `WARNING`, and `ERROR`.

## Exports

- **LaTeX** is rendered with escaping for user text. `pdflatex` must be
  installed and available on `PATH` for PDF export (MiKTeX or TeX Live).
- **DOCX** is generated directly by `python-docx`; no Microsoft Office process
  is required.
- Both DOCX and PDF follow the Harvard-style bullet resume layout: US Letter,
  Calibri 11 pt (Carlito in the PDF), a ruled header, centred section headings,
  and locations/dates flushed right. Sections are ordered Education,
  Experience, Leadership & Activities, Skills & Interests, then Projects,
  Volunteer Experience, Certifications, Awards, and Publications. The
  professional title and summary are not exported.
- JSON export is the canonical portable profile format.

The `templates/cv.tex` file contains the `%CV_CONTENT%` insertion point. The
`templates/cv.docx` file is intentionally a text placeholder because DOCX is
generated programmatically, making the application usable without a binary
template.

Profiles support repeatable Leadership & Activities, Certifications, Awards,
Publications, and Volunteer Experience entries, plus independent `skills` and
`interests` fields. `active_sections` can contain section keys (or display
labels) to control which populated sections are exported; an empty list keeps
all populated sections enabled. Older profiles using certification/award
strings remain readable.

## Structure

`models/` contains typed dataclasses and JSON conversion, `generators/` contains
exporters, `validators/` performs structural bullet checks, and `utils/` contains localization and safe
profile storage. The UI supports English and Spanish labels, profile
create/load/save/delete, persistent Streamlit session state, preview, and
downloads.
