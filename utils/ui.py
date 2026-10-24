"""Shared visual language for the Streamlit CV workspace.

Colours, type, spacing and radii follow the "Generador local de CV" design
system. `.streamlit/config.toml` themes Streamlit's own widgets for the light
(Papel) and dark (Tinta) themes; the CSS below styles the custom parts and
follows the active theme through CSS ``light-dark()``, because Streamlit sets
``color-scheme`` on the app container.
"""

from __future__ import annotations

import html
from typing import Iterable

import streamlit as st

from generators.formatting import date_range, display_url
from models.cv_model import CVProfile
from utils.localization import t


APP_CSS = r"""
:root {
    --canvas: light-dark(#f3f1ec, #131312);
    --surface: light-dark(#ffffff, #1c1b19);
    --surface-sunken: light-dark(#eae7df, #0e0e0d);
    --line: light-dark(#e2dfd6, #2e2c28);
    --line-strong: light-dark(#8a8478, #7a7468);
    --ink: light-dark(#1a1916, #f1eee7);
    --ink-muted: light-dark(#5b574e, #aaa498);
    --ink-inverse: light-dark(#fbfaf7, #161513);
    --pen: light-dark(#2346d1, #93aaff);
    --pen-soft: light-dark(#e5eafc, #1f2748);
    --on-pen: light-dark(#ffffff, #0b1233);
    --success: light-dark(#1c7443, #72d39c);
    --success-soft: light-dark(#e2f2e7, #11301f);
    --warning: light-dark(#97480a, #f2a65f);
    --warning-soft: light-dark(#fcecdc, #3a2511);
    --danger: light-dark(#bf2a20, #ff8b80);
    --danger-soft: light-dark(#fce7e4, #3d1614);
    --paper: #ffffff;
    --paper-ink: #000000;
    --focus-ring: 0 0 0 2px var(--canvas), 0 0 0 4px var(--pen);
    --shadow-xs: 0 1px 2px light-dark(#1a19160f, #00000066);
    --shadow-md: 0 1px 2px light-dark(#1a19160a, #00000080), 0 8px 24px -6px light-dark(#1a191624, #000000b3);
    --shadow-paper: 0 1px 2px light-dark(#1a19161a, #00000000), 0 16px 40px -12px light-dark(#1a19162e, #000000cc);
    --font-sans: "Instrument Sans", ui-sans-serif, system-ui, "Segoe UI", sans-serif;
    --font-display: "Instrument Serif", "Iowan Old Style", Georgia, serif;
    --font-mono: "JetBrains Mono", ui-monospace, "Cascadia Code", Consolas, monospace;
    --font-doc: Carlito, Calibri, "Segoe UI", sans-serif;
}

/* ── Shell ─────────────────────────────────────────── */
[data-testid="stHeader"] { background: transparent; }
[data-testid="stMainBlockContainer"] {
    max-width: 1680px;
    padding: 3.25rem 1.75rem 3rem;
}
[data-testid="stSidebar"] { border-right: 1px solid var(--line); }
[data-testid="stSidebarUserContent"] { padding-top: 0.5rem; }
[data-testid="stSidebar"] [data-testid="stVerticalBlock"] { gap: 2px; }

.cv-icon {
    font-family: "Material Symbols Rounded";
    font-weight: normal;
    font-style: normal;
    font-size: 20px;
    line-height: 1;
    letter-spacing: normal;
    text-transform: none;
    white-space: nowrap;
    font-variation-settings: "FILL" 0, "wght" 400, "GRAD" 0, "opsz" 20;
    user-select: none;
}

.cv-overline {
    margin: 0;
    color: var(--ink-muted);
    font-size: 11px;
    line-height: 16px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

/* ── Buttons ───────────────────────────────────────── */
[data-testid="stBaseButton-primary"] {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--ink-inverse);
}
[data-testid="stBaseButton-primary"]:hover:not(:disabled),
[data-testid="stBaseButton-primary"]:active:not(:disabled) {
    border-color: color-mix(in oklab, var(--ink) 84%, var(--canvas));
    background: color-mix(in oklab, var(--ink) 84%, var(--canvas));
    color: var(--ink-inverse);
}
[data-testid="stBaseButton-primary"]:disabled {
    border-color: var(--line);
    background: var(--surface-sunken);
    color: var(--ink-muted);
}
button:focus-visible,
summary:focus-visible { outline: 2px solid transparent; box-shadow: var(--focus-ring); }

[class*="st-key-cv-danger-"] button {
    border-color: color-mix(in oklab, var(--danger) 45%, transparent);
    background: transparent;
    color: var(--danger);
}
[class*="st-key-cv-danger-"] button:hover:not(:disabled) {
    border-color: var(--danger);
    background: var(--danger-soft);
    color: var(--danger);
}

/* ── Fields: control borders need 3:1, so they use line-strong ── */
.react-aria-TextField > div,
.react-aria-ComboBox [role="group"] {
    border-color: var(--line-strong) !important;
}
.react-aria-TextField > div:focus-within,
.react-aria-ComboBox [role="group"]:focus-within {
    border-color: var(--pen) !important;
}
[data-testid="stWidgetLabel"] p { font-weight: 600; font-size: 13px; }

/* ── Top bar ───────────────────────────────────────── */
.st-key-cv-topbar {
    position: sticky;
    top: 0.75rem;
    z-index: 90;
    min-height: 64px;
    margin-bottom: 0.5rem;
    padding: 0.5rem 0.75rem 0.5rem 1.25rem;
    border: 1px solid var(--line);
    border-radius: 20px;
    background: var(--surface);
    box-shadow: var(--shadow-md);
}
.cv-brand {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--ink);
    font-size: 14px;
    line-height: 20px;
    font-weight: 600;
    white-space: nowrap;
}
.cv-brand .cv-icon { color: var(--pen); }
.cv-sep { width: 1px; height: 24px; background: var(--line); }
.st-key-cv-profile-menu button {
    font-family: var(--font-display);
    font-size: 22px;
    font-weight: 400;
}
.st-key-cv-profile-menu button p {
    font-family: var(--font-display);
    font-size: 22px;
    line-height: 28px;
    max-width: 18rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* ── Badges ────────────────────────────────────────── */
.cv-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 24px;
    padding: 0 10px;
    border-radius: 9999px;
    background: var(--surface-sunken);
    color: var(--ink-muted);
    font-size: 12px;
    line-height: 16px;
    font-weight: 600;
    white-space: nowrap;
}
.cv-badge .cv-icon { font-size: 14px; margin-left: -2px; }
.cv-badge__dot { width: 6px; height: 6px; border-radius: 9999px; background: currentColor; }
.cv-badge--success { background: var(--success-soft); color: var(--success); }
.cv-badge--warning { background: var(--warning-soft); color: var(--warning); }
.cv-badge--danger { background: var(--danger-soft); color: var(--danger); }
.cv-badge--pen { background: var(--pen-soft); color: var(--pen); }
.cv-badge--outline { background: transparent; box-shadow: inset 0 0 0 1px var(--line-strong); }

/* ── Section rail (sidebar) ────────────────────────── */
.cv-rail-overline { padding: 16px 12px 6px; }
.cv-rail-overline--first { padding-top: 4px; }
[class*="st-key-cv-rail-"] {
    position: relative;
    min-height: 40px;
    border-radius: 8px;
    gap: 0 !important;
}
[class*="st-key-cv-rail-"]:hover { background: var(--surface-sunken); }
[class*="st-key-cv-rail-"] [data-testid="stBaseButton-tertiary"] {
    justify-content: flex-start;
    width: 100%;
    min-height: 40px;
    padding: 0 8px 0 12px;
    color: var(--ink);
}
[class*="st-key-cv-rail-"] [data-testid="stBaseButton-tertiary"] > div {
    justify-content: flex-start;
    width: 100%;
    min-width: 0;
}
[class*="st-key-cv-rail-"] [data-testid="stBaseButton-tertiary"] > div > span {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
}
[class*="st-key-cv-rail-"] [data-testid="stBaseButton-tertiary"] p {
    font-size: 14px;
    font-weight: 500;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
[class*="st-key-cv-rail-"] [data-testid="stBaseButton-tertiary"] span[data-testid="stIconMaterial"] {
    color: var(--ink-muted);
    font-size: 18px;
}
[class*="st-key-cv-rail-"] .cv-rail-count {
    display: inline-block;
    min-width: 22px;
    height: 20px;
    margin-right: 6px;
    padding: 0 6px;
    border-radius: 9999px;
    color: var(--ink-muted);
    font-size: 12px;
    line-height: 20px;
    font-weight: 600;
    text-align: center;
    font-variant-numeric: tabular-nums;
}
.cv-rail-count--warn { background: var(--warning-soft); color: var(--warning) !important; }
[class*="st-key-cv-rail-"] [class*="st-key-cv-eye-"] {
    position: absolute;
    top: 4px;
    right: 4px;
    width: auto;
    opacity: 0;
}
[class*="st-key-cv-rail-"]:hover [class*="st-key-cv-eye-"],
[class*="st-key-cv-rail-"]:focus-within [class*="st-key-cv-eye-"] { opacity: 1; }
[class*="st-key-cv-rail-"]:hover .cv-rail-count,
[class*="st-key-cv-rail-"]:focus-within .cv-rail-count { visibility: hidden; }
[class*="st-key-cv-eye-"] button {
    min-height: 32px;
    padding: 0 6px;
    color: var(--ink-muted);
}
[class*="st-key-cv-eye-"] button:hover { color: var(--ink); background: var(--surface); }
.cv-rail-progress {
    margin: 16px 0 8px;
    padding: 16px 12px 0;
    border-top: 1px solid var(--line);
}

/* ── Progress ──────────────────────────────────────── */
.cv-progress { display: grid; gap: 8px; }
.cv-progress__head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
.cv-progress__label { color: var(--ink); font-size: 13px; line-height: 16px; font-weight: 600; }
.cv-progress__value { color: var(--ink-muted); font-size: 13px; line-height: 16px; font-variant-numeric: tabular-nums; }
.cv-progress__track { display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; gap: 3px; height: 6px; }
.cv-progress__step { border-radius: 9999px; background: var(--line); }
.cv-progress__step[data-done="true"] { background: var(--pen); }
.cv-progress__hint { margin: 0; color: var(--ink-muted); font-size: 13px; line-height: 18px; }
.cv-progress__hint strong { color: var(--ink); font-weight: 600; }

/* ── Editor panel ──────────────────────────────────── */
.st-key-cv-editor {
    padding: 2rem 2rem 1.5rem;
    border: 1px solid var(--line);
    border-radius: 24px;
    background: var(--surface);
}
.cv-section-head { display: grid; gap: 4px; }
.cv-section-head h2 {
    margin: 0;
    padding: 0;
    color: var(--ink);
    font-family: var(--font-display);
    font-size: 32px;
    line-height: 36px;
    font-weight: 400;
    letter-spacing: -0.01em;
}
.cv-section-head p.cv-section-desc { margin: 4px 0 0; color: var(--ink-muted); font-size: 14px; line-height: 20px; }
.cv-group-title { margin: 8px 0 0; color: var(--ink); font-size: 15px; line-height: 22px; font-weight: 600; }
.cv-group-hint { margin: 0; color: var(--ink-muted); font-size: 13px; line-height: 18px; }

/* Entry cards are Streamlit expanders. */
.st-key-cv-editor [data-testid="stExpander"] details {
    border: 1px solid var(--line);
    border-radius: 16px;
    background: var(--surface);
}
.st-key-cv-editor [data-testid="stExpander"] details[open] { box-shadow: var(--shadow-md); }
.st-key-cv-editor [data-testid="stExpander"] summary { padding-top: 14px; padding-bottom: 14px; }
.st-key-cv-editor [data-testid="stExpander"] summary p { font-size: 15px; }

/* Bullet rows: the text area keeps its own border; tools sit beside it. */
[class*="st-key-cv-bullet-"] { align-items: flex-start; }
[class*="st-key-cv-bullet-"] [data-testid="stPopoverButton"] { min-height: 36px; margin-top: 2px; }
.cv-bullet-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 12px;
    margin: -10px 0 2px 4px;
    color: var(--ink-muted);
    font-size: 12px;
    line-height: 16px;
}
.cv-bullet-meta .cv-issue { display: inline-flex; align-items: center; gap: 4px; color: var(--warning); font-weight: 500; }
.cv-bullet-meta .cv-issue .cv-icon { font-size: 14px; }
.cv-bullet-meta .cv-count--over { color: var(--warning); font-weight: 600; }

/* ── Notices ───────────────────────────────────────── */
.cv-callout {
    display: grid;
    grid-template-columns: 20px minmax(0, 1fr);
    gap: 12px;
    padding: 12px 16px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--surface);
    color: var(--ink);
}
.cv-callout > .cv-icon { margin-top: 1px; color: var(--ink-muted); }
.cv-callout__title { margin: 0; font-size: 15px; line-height: 22px; font-weight: 600; }
.cv-callout__text { margin: 0; font-size: 13px; line-height: 18px; }
.cv-callout--info { border-color: color-mix(in oklab, var(--pen) 30%, transparent); background: var(--pen-soft); }
.cv-callout--info > .cv-icon { color: var(--pen); }
.cv-callout--success { border-color: color-mix(in oklab, var(--success) 30%, transparent); background: var(--success-soft); }
.cv-callout--success > .cv-icon { color: var(--success); }
.cv-callout--warning { border-color: color-mix(in oklab, var(--warning) 30%, transparent); background: var(--warning-soft); }
.cv-callout--warning > .cv-icon { color: var(--warning); }
.cv-callout--danger { border-color: color-mix(in oklab, var(--danger) 30%, transparent); background: var(--danger-soft); }
.cv-callout--danger > .cv-icon { color: var(--danger); }

.cv-empty {
    display: grid;
    justify-items: start;
    gap: 12px;
    padding: 32px 24px 12px;
    border: 1.5px dashed var(--line-strong);
    border-bottom: 0;
    border-radius: 16px 16px 0 0;
}
.st-key-cv-empty-actions {
    margin-top: -1rem;
    padding: 4px 24px 28px;
    border: 1.5px dashed var(--line-strong);
    border-top: 0;
    border-radius: 0 0 16px 16px;
}
.cv-empty__icon { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 9999px; background: var(--surface-sunken); color: var(--ink-muted); }
.cv-empty__title { margin: 0; color: var(--ink); font-family: var(--font-display); font-size: 22px; line-height: 28px; font-weight: 400; }
.cv-empty__text { margin: 0; max-width: 46ch; color: var(--ink-muted); font-size: 14px; line-height: 20px; }
.cv-empty__example { margin: 0; padding: 8px 12px; border-radius: 8px; background: var(--surface-sunken); color: var(--ink); font-size: 13px; line-height: 18px; }
.cv-empty__example span { color: var(--ink-muted); }

/* ── Export cards ──────────────────────────────────── */
.cv-export-head { display: grid; gap: 10px; }
.cv-export-head__top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.cv-export-format {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: var(--surface-sunken);
    color: var(--ink);
    font-family: var(--font-mono);
    font-size: 12px;
    font-weight: 500;
}
.cv-export-format--strong { background: var(--ink); color: var(--ink-inverse); }
.cv-export-title { margin: 0; color: var(--ink); font-size: 15px; line-height: 22px; font-weight: 600; }
.cv-export-desc { margin: 0; min-height: 36px; color: var(--ink-muted); font-size: 13px; line-height: 18px; }

/* ── Live preview ──────────────────────────────────── */
[data-testid="stColumn"]:has(.st-key-cv-preview) {
    position: sticky;
    top: 6.25rem;
    align-self: flex-start;
}
.cv-preview-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 4px 0 2px; }
.cv-preview-meta { color: var(--ink-muted); font-size: 13px; line-height: 18px; }
.cv-well {
    container-type: inline-size;
    padding: 24px;
    border-radius: 24px;
    background: var(--surface-sunken);
}
.cv-paper {
    box-sizing: border-box;
    width: 100%;
    min-height: calc(100cqw * 11 / 8.5);
    padding: 3.27em 2.73em 1.36em;
    background: var(--paper);
    color: var(--paper-ink);
    font-family: var(--font-doc);
    font-size: calc(100cqw * 14.67 / 816);
    line-height: 1.227;
    box-shadow: var(--shadow-paper);
    border-radius: 2px;
}
.cv-paper p { margin: 0; color: var(--paper-ink); font-size: 1em; line-height: 1.227; }
.cv-paper b { font-weight: 700; }
.cv-paper a { color: var(--paper-ink); text-decoration: none; }
.cv-paper__name { text-align: center; font-weight: 700; }
.cv-paper__rule { height: 0.09em; margin: 0.18em 0 0.45em; background: var(--paper-ink); }
.cv-paper__contact { text-align: center; }
.cv-paper__section { margin-top: 1em !important; text-align: center; font-weight: 700; }
.cv-paper__entry + .cv-paper__entry { margin-top: 1em; }
.cv-paper__line { display: flex; justify-content: space-between; gap: 1em; }
.cv-paper ul { margin: 0 !important; padding: 0 0 0 3.82em !important; list-style: none; font-size: 1em !important; }
.cv-paper li { position: relative; margin: 0 !important; padding: 0 !important; font-size: 1em !important; line-height: 1.227 !important; }
.cv-paper li::before { content: "•"; position: absolute; left: -1.64em; }
.cv-paper [data-live="true"] {
    border-radius: 2px;
    background: color-mix(in oklab, #2346d1 9%, transparent);
    outline: 1.5px solid #2346d1;
    outline-offset: 0.25em;
}
.cv-paper-empty { display: grid; place-items: center; min-height: 12em; padding: 0 3em; color: #5b574e; text-align: center; font-family: var(--font-sans); font-size: 1.5em; line-height: 1.4; }

@media (max-width: 700px) {
    [data-testid="stMainBlockContainer"] { padding: 3.25rem 0.75rem 2rem; }
    .st-key-cv-editor { padding: 1.25rem 1rem 1rem; }
    [data-testid="stColumn"]:has(.st-key-cv-preview) { position: static; }
}

@media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
        scroll-behavior: auto !important;
        transition-duration: 0.01ms !important;
        animation-duration: 0.01ms !important;
    }
}
"""

def _e(value: object) -> str:
    return html.escape(str(value), quote=True)


def icon(name: str) -> str:
    return f'<span class="cv-icon" aria-hidden="true">{_e(name)}</span>'


def apply_theme(color_scheme: str | None = None) -> None:
    """Inject the design-system stylesheet; the theme itself is Streamlit's.

    Fonts come from `.streamlit/config.toml` (served from static/fonts), and
    `.cv-icon` reuses the Material Symbols font that Streamlit bundles, so no
    stylesheet or font is fetched from another host.

    Dialogs and popovers render outside the app container, so the root also
    gets the active ``color-scheme`` for ``light-dark()`` to resolve there.
    """

    scheme = color_scheme if color_scheme in ("light", "dark") else "light"
    st.html(f"<style>\n{APP_CSS}\n:root {{ color-scheme: {scheme}; }}\n</style>")


def inject_css(css: str) -> None:
    """Add per-run rules, such as the active row of the section rail."""

    if css.strip():
        st.html(f"<style>\n{css}\n</style>")


def brand(app_name: str) -> None:
    st.html(f'<div class="cv-brand">{icon("description")}{_e(app_name)}</div>', width="content")


def separator() -> None:
    st.html('<div class="cv-sep" aria-hidden="true"></div>', width="content")


def badge(text: str, tone: str = "", *, dot: bool = False, icon_name: str = "") -> None:
    st.html(badge_html(text, tone, dot=dot, icon_name=icon_name), width="content")


def badge_html(text: str, tone: str = "", *, dot: bool = False, icon_name: str = "") -> str:
    tone_class = f" cv-badge--{tone}" if tone else ""
    lead = '<span class="cv-badge__dot"></span>' if dot else (icon(icon_name) if icon_name else "")
    return f'<span class="cv-badge{tone_class}">{lead}{_e(text)}</span>'


def rail_overline(text: str, first: bool = False) -> None:
    extra = " cv-rail-overline--first" if first else ""
    st.html(f'<p class="cv-overline cv-rail-overline{extra}">{_e(text)}</p>')


def rail_count(count: int | str, warn_label: str = "") -> None:
    if warn_label:
        st.html(
            f'<span class="cv-rail-count cv-rail-count--warn" title="{_e(warn_label)}" '
            f'aria-label="{_e(warn_label)}">{_e(count)}</span>',
            width="content",
        )
    else:
        st.html(f'<span class="cv-rail-count">{_e(count)}</span>', width="content")


def progress_meter(label: str, done: int, total: int, value_label: str, hint_html: str) -> None:
    steps = "".join(
        f'<span class="cv-progress__step" data-done="{str(index < done).lower()}"></span>'
        for index in range(total)
    )
    st.html(
        f"""
        <div class="cv-rail-progress">
          <div class="cv-progress" role="group" aria-label="{_e(label)}">
            <div class="cv-progress__head">
              <span class="cv-progress__label">{_e(label)}</span>
              <span class="cv-progress__value">{_e(value_label)}</span>
            </div>
            <div class="cv-progress__track" role="progressbar" aria-valuemin="0"
                 aria-valuemax="{total}" aria-valuenow="{done}">{steps}</div>
            <p class="cv-progress__hint">{hint_html}</p>
          </div>
        </div>
        """
    )


def section_head(overline: str, title: str, description: str) -> None:
    st.html(
        f"""
        <div class="cv-section-head">
          <p class="cv-overline">{_e(overline)}</p>
          <h2>{_e(title)}</h2>
          <p class="cv-section-desc">{_e(description)}</p>
        </div>
        """
    )


def group_title(title: str, hint: str = "") -> None:
    hint_html = f'<p class="cv-group-hint">{_e(hint)}</p>' if hint else ""
    st.html(f'<p class="cv-group-title">{_e(title)}</p>{hint_html}')


def callout(kind: str, icon_name: str, text: str, title: str = "") -> None:
    title_html = f'<p class="cv-callout__title">{_e(title)}</p>' if title else ""
    st.html(
        f'<div class="cv-callout cv-callout--{_e(kind)}">{icon(icon_name)}'
        f'<div>{title_html}<p class="cv-callout__text">{_e(text)}</p></div></div>'
    )


def empty_state(icon_name: str, title: str, text: str, example: str, example_label: str) -> None:
    st.html(
        f"""
        <div class="cv-empty">
          <div class="cv-empty__icon">{icon(icon_name)}</div>
          <p class="cv-empty__title">{_e(title)}</p>
          <p class="cv-empty__text">{_e(text)}</p>
          <p class="cv-empty__example"><span>{_e(example_label)}</span> {_e(example)}</p>
        </div>
        """
    )


def bullet_meta(issues: Iterable[str], count: int, limit: int = 240) -> None:
    parts = [
        f'<span class="cv-issue">{icon("error")}{_e(issue)}</span>' for issue in issues
    ]
    over = " cv-count--over" if count > limit else ""
    parts.append(f'<span class="cv-count{over}">{count}/{limit}</span>')
    st.html(f'<div class="cv-bullet-meta">{"".join(parts)}</div>')


def export_head(fmt: str, title: str, description: str, recommended: str = "") -> None:
    strong = " cv-export-format--strong" if recommended else ""
    tag = badge_html(recommended, "pen") if recommended else ""
    st.html(
        f"""
        <div class="cv-export-head">
          <div class="cv-export-head__top"><span class="cv-export-format{strong}">{_e(fmt)}</span>{tag}</div>
          <p class="cv-export-title">{_e(title)}</p>
          <p class="cv-export-desc">{_e(description)}</p>
        </div>
        """
    )


def preview_bar(live_label: str, meta: str) -> None:
    st.html(
        f'<div class="cv-preview-bar">{badge_html(live_label, "pen", dot=True)}'
        f'<span class="cv-preview-meta">{_e(meta)}</span></div>'
    )


# ── The CV sheet ─────────────────────────────────────────────────────────────
# Mirrors generators/latex_generator.py so the preview matches the export.

def _line(left: str, right: str = "", bold: bool = True) -> str:
    left, right = left.strip(), right.strip()
    if not (left or right):
        return ""
    left_html = f"<b>{_e(left)}</b>" if bold and left else _e(left)
    return f'<p class="cv-paper__line"><span>{left_html}</span><span>{_e(right)}</span></p>'


def _text(text: str, label: str = "") -> str:
    text, label = text.strip(), label.strip()
    if not (text or label):
        return ""
    prefix = f"<b>{_e(label)}:</b> " if label else ""
    return f"<p>{prefix}{_e(text)}</p>"


def _link(url: str) -> str:
    return f"<p>{_e(display_url(url))}</p>" if url.strip() else ""


def _bullets(values: Iterable[str]) -> str:
    items = [f"<li>{_e(value.strip())}</li>" for value in values if value.strip()]
    return f"<ul>{''.join(items)}</ul>" if items else ""


def _dated(title: str, organization: str, location: str, start: str, end: str,
           description: str = "", bullets: Iterable[str] = ()) -> str:
    return (
        _line(organization, location)
        + _line(title, date_range(start, end))
        + _text(description)
        + _bullets(bullets)
    )


def paper_html(profile: CVProfile, live_section: str = "", empty_text: str = "") -> str:
    """Return the CV sheet; ``live_section`` outlines the section being edited."""

    locale = profile.locale

    def block(key: str, title: str, entries: list[str]) -> str:
        entries = [entry for entry in entries if entry]
        if not entries:
            return ""
        live = ' data-live="true"' if key == live_section else ""
        inner = "".join(f'<div class="cv-paper__entry">{entry}</div>' for entry in entries)
        return f'<div{live}><p class="cv-paper__section">{_e(title)}</p>{inner}</div>'

    def active(key: str) -> bool:
        return profile.section_is_active(key)

    contact = profile.contact
    contact_values = [
        contact.location.strip(), contact.email.strip(), contact.phone.strip(),
        *(display_url(url) for url in (contact.website, contact.linkedin, contact.github) if url.strip()),
    ]
    contact_line = " • ".join(_e(value) for value in contact_values if value)
    sections: list[str] = []
    if active("education"):
        sections.append(block("education", t(locale, "education"), [
            _line(item.institution, item.location)
            + _line(item.degree, date_range(item.start_date, item.end_date), bold=False)
            + "".join(_text(detail) for detail in item.details)
            for item in profile.education
        ]))
    if active("experience"):
        sections.append(block("experience", t(locale, "experience"), [
            _line(item.company, item.location)
            + _line(item.role, date_range(item.start_date, item.end_date))
            + _bullets(bullet.text for bullet in item.bullets)
            for item in profile.experience
        ]))
    if active("leadership_activities"):
        sections.append(block("leadership_activities", t(locale, "leadership_activities"), [
            _dated(item.title, item.organization, item.location, item.start_date,
                   item.end_date, item.description, (bullet.text for bullet in item.bullets))
            for item in profile.leadership_activities
        ]))
    skill_lines = []
    if active("skills"):
        skill_lines += [_text(", ".join(group.items), group.category)
                        for group in profile.skills if group.category or group.items]
    extra = []
    if profile.languages and active("languages"):
        extra.append(_text(", ".join(profile.languages), t(locale, "languages")))
    if profile.interests and active("interests"):
        extra.append(_text(", ".join(profile.interests), t(locale, "interests")))
    if skill_lines or extra:
        live = ' data-live="true"' if live_section == "skills" else ""
        title = t(locale, "skills_interests" if extra else "skills")
        sections.append(
            f'<div{live}><p class="cv-paper__section">{_e(title)}</p>{"".join(skill_lines + extra)}</div>'
        )
    if active("projects"):
        sections.append(block("projects", t(locale, "projects"), [
            _line(item.name) + _text(item.description) + _text(", ".join(item.technologies))
            + _link(item.url) + _bullets(bullet.text for bullet in item.bullets)
            for item in profile.projects
        ]))
    if active("volunteer_experience"):
        sections.append(block("volunteer_experience", t(locale, "volunteer_experience"), [
            _dated(item.role, item.organization, item.location, item.start_date,
                   item.end_date, item.description, (bullet.text for bullet in item.bullets))
            for item in profile.volunteer_experience
        ]))
    if active("certifications"):
        sections.append(block("certifications", t(locale, "certifications"), [
            _line(item.name, date_range(item.date, item.expiry_date))
            + _text(" • ".join(part for part in (item.issuer, item.credential_id) if part.strip()))
            + _text(item.description) + _link(item.url) + _bullets(item.details)
            for item in profile.certifications
        ]))
    if active("awards"):
        sections.append(block("awards", t(locale, "awards"), [
            _line(item.name, item.date) + _text(item.issuer) + _text(item.description)
            + _link(item.url) + _bullets(item.details)
            for item in profile.awards
        ]))
    if active("publications"):
        sections.append(block("publications", t(locale, "publications"), [
            _line(item.title, item.date)
            + _text(" • ".join(part for part in (item.authors, item.publisher) if part.strip()))
            + _text(item.description) + _link(item.url)
            for item in profile.publications
        ]))

    body = "".join(sections)
    if not (profile.name.strip() or contact_line or body):
        return (
            '<div class="cv-well"><article class="cv-paper">'
            f'<div class="cv-paper-empty">{_e(empty_text)}</div></article></div>'
        )
    live_header = ' data-live="true"' if live_section == "personal" else ""
    header = (
        f'<div{live_header}><p class="cv-paper__name">{_e(profile.name.strip() or "CV")}</p>'
        '<div class="cv-paper__rule"></div>'
        + (f'<p class="cv-paper__contact">{contact_line}</p>' if contact_line else "")
        + "</div>"
    )
    return (
        f'<div class="cv-well"><article class="cv-paper" lang="{_e(locale)}">'
        f"{header}{body}</article></div>"
    )
