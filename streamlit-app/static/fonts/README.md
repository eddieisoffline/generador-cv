# Local fonts

The app serves these fonts itself (`server.enableStaticServing` in
`.streamlit/config.toml`), so it works offline and sends no requests to Google
Fonts. Each family has two WOFF2 files, the `latin` and `latin-ext` subsets,
registered in `[[theme.fontFaces]]` with their `unicodeRange`.

| Family | Files | Used for | License |
| --- | --- | --- | --- |
| Instrument Sans | `InstrumentSans-normal-400-700-*` (variable weight) | Interface text | SIL OFL 1.1, `licenses/InstrumentSans-OFL.txt` |
| Instrument Serif | `InstrumentSerif-{normal,italic}-400-*` | Titles and the profile name | SIL OFL 1.1, `licenses/InstrumentSerif-OFL.txt` |
| JetBrains Mono | `JetBrainsMono-normal-400-500-*` (variable weight) | Code and the JSON editor | SIL OFL 1.1, `licenses/JetBrainsMono-OFL.txt` |
| Carlito | `Carlito-normal-{400,700}-*` | The CV preview, matching the PDF export | SIL OFL 1.1, `licenses/Carlito-OFL.txt` |

Icons in custom HTML (`.cv-icon`) use the Material Symbols Rounded font that
ships inside Streamlit, so no icon font is stored here.

The files were downloaded from the Google Fonts CSS API
(`https://fonts.googleapis.com/css2`) and the licenses from
`https://github.com/google/fonts/tree/main/ofl`. To add a script outside
Latin (for example Cyrillic or Greek), download that subset the same way and
add a `[[theme.fontFaces]]` entry with its `unicodeRange`.
