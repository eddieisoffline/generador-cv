"""Streamlit entry point for the local CV generator."""

from __future__ import annotations

import copy
from dataclasses import dataclass
import hashlib
import json
from typing import Any, Callable
import unicodedata

import streamlit as st

from generators.docx_generator import DocxGenerationError, generate_docx_bytes
from generators.formatting import date_range
from generators.latex_generator import LatexGenerator
from generators.pdf_generator import PdfGenerationError, generate_pdf, pdflatex_path
from models.cv_model import (
    Award, Bullet, Certification, CVProfile, Education, Experience,
    LeadershipActivity, Project, Publication, SkillGroup, VolunteerExperience,
)
from utils import ui
from utils.file_utils import (
    ROOT,
    delete_profile,
    list_profiles,
    load_profile,
    safe_filename,
    save_profile,
)
from utils.logging_config import logger
from utils.localization import t
from validators.bullet_validator import validate_bullet, validate_profile


EDITOR_PREFIX = "editor_"
BULLET_LIMIT = 240


@dataclass(frozen=True)
class Section:
    key: str
    icon: str
    visibility: tuple[str, ...] = ()


# The rail follows the export order so the editor and the sheet line up.
HEADER_SECTION = Section("personal", "badge")
CV_SECTIONS = (
    Section("education", "school", ("education",)),
    Section("experience", "work", ("experience",)),
    Section("leadership_activities", "groups", ("leadership_activities",)),
    Section("skills", "psychology", ("skills", "languages", "interests")),
    Section("projects", "rocket_launch", ("projects",)),
    Section("volunteer_experience", "volunteer_activism", ("volunteer_experience",)),
    Section("certifications", "verified", ("certifications",)),
    Section("awards", "emoji_events", ("awards",)),
    Section("publications", "menu_book", ("publications",)),
)
ADVANCED_SECTION = Section("advanced", "data_object")
ALL_SECTIONS = (HEADER_SECTION, *CV_SECTIONS, ADVANCED_SECTION)
SECTION_LABELS = {
    "personal": "personal",
    "skills": "skills_interests",
    "volunteer_experience": "volunteering",
    "advanced": "advanced_json",
}
VISIBILITY_KEYS = (
    "summary", "experience", "education", "skills", "interests", "projects",
    "leadership_activities", "certifications", "awards", "publications",
    "volunteer_experience", "languages",
)
VALIDATOR_MESSAGES = {
    "Bullet is empty.": "v_empty",
    "Bullet is longer than 240 characters.": "v_long",
    "Prefer an action-led bullet without first person.": "v_first_person",
    "Consider starting with a specific action verb.": "v_verb",
    "Use consistent punctuation across bullets.": "v_punctuation",
}


@dataclass(frozen=True)
class EntrySpec:
    """How one repeatable section is edited: rows of (attribute, label, kind)."""

    factory: Callable[[], Any]
    rows: tuple[tuple[tuple[str, str, str], ...], ...]
    title: str
    subtitle: tuple[str, ...] = ()
    bullets: bool = False


_DATES = (("location", "f_location", "text"), ("start_date", "f_start", "text"),
          ("end_date", "f_end", "text"))
ENTRY_SPECS = {
    "education": EntrySpec(Education, (
        (("institution", "f_institution", "text"), ("degree", "f_degree", "text")),
        _DATES,
        (("details", "f_details", "lines"),),
    ), "degree", ("institution",)),
    "experience": EntrySpec(Experience, (
        (("role", "f_role", "text"), ("company", "f_company", "text")),
        _DATES,
    ), "role", ("company", "location"), bullets=True),
    "leadership_activities": EntrySpec(LeadershipActivity, (
        (("title", "f_title_role", "text"), ("organization", "f_organization", "text")),
        _DATES,
        (("description", "f_description", "area"),),
    ), "title", ("organization", "location"), bullets=True),
    "skills": EntrySpec(SkillGroup, (
        (("category", "f_category", "text"),),
        (("items", "f_skill_items", "lines"),),
    ), "category"),
    "projects": EntrySpec(Project, (
        (("name", "f_name", "text"), ("url", "f_url", "text")),
        (("description", "f_description", "area"),),
        (("technologies", "f_technologies", "lines"),),
    ), "name", ("url",), bullets=True),
    "volunteer_experience": EntrySpec(VolunteerExperience, (
        (("role", "f_role", "text"), ("organization", "f_organization", "text")),
        _DATES,
        (("description", "f_description", "area"),),
    ), "role", ("organization", "location"), bullets=True),
    "certifications": EntrySpec(Certification, (
        (("name", "f_name", "text"), ("issuer", "f_issuer", "text")),
        (("date", "f_date", "text"), ("expiry_date", "f_expiry", "text"),
         ("credential_id", "f_credential_id", "text")),
        (("url", "f_url", "text"),),
        (("description", "f_description", "area"),),
        (("details", "f_details", "lines"),),
    ), "name", ("issuer",)),
    "awards": EntrySpec(Award, (
        (("name", "f_name", "text"), ("issuer", "f_issuer", "text")),
        (("date", "f_date", "text"), ("url", "f_url", "text")),
        (("description", "f_description", "area"),),
        (("details", "f_details", "lines"),),
    ), "name", ("issuer",)),
    "publications": EntrySpec(Publication, (
        (("title", "f_title", "text"), ("authors", "f_authors", "text")),
        (("publisher", "f_publisher", "text"), ("date", "f_date", "text")),
        (("url", "f_url", "text"),),
        (("description", "f_description", "area"),),
    ), "title", ("publisher",)),
}


# ── State ────────────────────────────────────────────────────────────────────

def empty_profile(profile_id: str = "new_profile") -> CVProfile:
    return CVProfile(id=profile_id)


def _default_language() -> str:
    locale = (st.context.locale or "").lower()
    return "es" if locale.startswith("es") else "en"


def initialize_state() -> None:
    if "logging_initialized" not in st.session_state:
        st.session_state.logging_initialized = True
        logger.info("Application session started")
    defaults = {
        "language": _default_language(),
        "selected_profile": "",
        "section": "personal",
        "cv_editor_version": 0,
    }
    for key, value in defaults.items():
        st.session_state.setdefault(key, value)
    if "profile_json" not in st.session_state:
        st.session_state.profile_json = empty_profile().to_json()
        st.session_state.saved_json = ""


def _clear_editor_state() -> None:
    for key in list(st.session_state):
        if str(key).startswith(EDITOR_PREFIX):
            del st.session_state[key]
    st.session_state.cv_editor_version += 1


def select_profile(profile_id: str) -> None:
    if profile_id:
        try:
            profile = load_profile(profile_id)
        except (OSError, ValueError, json.JSONDecodeError) as exc:
            st.session_state.flash = ("error", f"{profile_id}: {exc}")
            return
    else:
        profile = empty_profile()
    logger.info("Profile selected: %s", profile_id or "<new>")
    st.session_state.selected_profile = profile_id
    st.session_state.profile_json = profile.to_json()
    st.session_state.saved_json = st.session_state.profile_json if profile_id else ""
    st.session_state.open_entry = None
    st.session_state.confirm_delete = False
    st.session_state.pop("pdf_export", None)
    _clear_editor_state()


def current_profile() -> CVProfile | None:
    try:
        return CVProfile.from_json(st.session_state.profile_json)
    except (ValueError, json.JSONDecodeError):
        return None


def _flash(kind: str, message: str) -> None:
    st.session_state.flash = (kind, message)


def _show_flash() -> None:
    flash = st.session_state.pop("flash", None)
    if flash:
        kind, message = flash
        icons = {"success": ":material/check_circle:", "error": ":material/error:"}
        st.toast(message, icon=icons.get(kind, ":material/info:"))


# ── Actions (run after every field of the open section has been read) ────────

def _queue(action: tuple) -> None:
    st.session_state.setdefault("cv_actions", []).append(action)


def _go_to(section: str) -> None:
    st.session_state.section = section
    st.session_state.open_entry = None


def _visible_keys(profile: CVProfile) -> set[str]:
    return {key for key in VISIBILITY_KEYS if profile.section_is_active(key)}


def _section_visible(profile: CVProfile, section: Section) -> bool:
    return any(profile.section_is_active(key) for key in section.visibility)


def _set_visibility(keys: tuple[str, ...], visible: bool) -> None:
    profile = current_profile()
    if profile is None:
        return
    active = _visible_keys(profile)
    active = active | set(keys) if visible else active - set(keys)
    profile.active_sections = (
        [] if active == set(VISIBILITY_KEYS) else [key for key in VISIBILITY_KEYS if key in active]
    )
    st.session_state.profile_json = profile.to_json()


def _apply_actions(profile: CVProfile) -> None:
    actions = st.session_state.pop("cv_actions", [])
    if not actions:
        return
    structural = False
    for action in actions:
        kind, section = action[0], action[1]
        items = getattr(profile, section)
        if kind == "add_entry":
            items.append(ENTRY_SPECS[section].factory())
            st.session_state.open_entry = (section, len(items) - 1)
            structural = True
            continue
        index = action[2]
        if not 0 <= index < len(items):
            continue
        structural = True
        if kind == "remove_entry":
            items.pop(index)
            st.session_state.open_entry = None
        elif kind == "move_entry":
            target = index + action[3]
            if 0 <= target < len(items):
                items[index], items[target] = items[target], items[index]
                st.session_state.open_entry = (section, target)
        elif kind == "duplicate_entry":
            items.insert(index + 1, copy.deepcopy(items[index]))
            st.session_state.open_entry = (section, index + 1)
        elif kind == "add_bullet":
            items[index].bullets.append(Bullet(""))
            st.session_state.open_entry = (section, index)
        elif kind in ("remove_bullet", "move_bullet"):
            bullets = items[index].bullets
            bullet = action[3]
            st.session_state.open_entry = (section, index)
            if not 0 <= bullet < len(bullets):
                continue
            if kind == "remove_bullet":
                bullets.pop(bullet)
            else:
                target = bullet + action[4]
                if 0 <= target < len(bullets):
                    bullets[bullet], bullets[target] = bullets[target], bullets[bullet]
    st.session_state.profile_json = profile.to_json()
    if structural:
        _clear_editor_state()
    st.rerun()


# ── Editor fields ────────────────────────────────────────────────────────────

def _editor_text(
    label: str,
    value: str,
    key: str,
    area: bool = False,
    *,
    placeholder: str | None = None,
    height: int | None = None,
    label_visibility: str = "visible",
) -> str:
    if key not in st.session_state:
        st.session_state[key] = value
    if area:
        return st.text_area(
            label, key=key, placeholder=placeholder, height=height,
            label_visibility=label_visibility,
        )
    return st.text_input(label, key=key, placeholder=placeholder, label_visibility=label_visibility)


def _editor_lines(label: str, values: list[str], key: str, placeholder: str | None = None) -> list[str]:
    text = _editor_text(label, "\n".join(values), key, True, placeholder=placeholder)
    return [line.strip() for line in text.splitlines() if line.strip()]


def _field(language: str, item: Any, attribute: str, label_key: str, kind: str, key: str) -> None:
    label = t(language, label_key)
    value = getattr(item, attribute)
    if kind == "lines":
        setattr(item, attribute, _editor_lines(label, value, key, t(language, "ph_lines")))
    elif kind == "area":
        setattr(item, attribute, _editor_text(label, value, key, True))
    else:
        placeholder = {
            "start_date": t(language, "ph_date"),
            "date": t(language, "ph_date"),
            "expiry_date": t(language, "ph_date"),
            "end_date": t(language, "ph_end"),
            "url": "https://",
        }.get(attribute)
        setattr(item, attribute, _editor_text(label, value, key, placeholder=placeholder))


def _field_row(language: str, item: Any, row: tuple, key_base: str) -> None:
    with st.container(horizontal=True, gap="small"):
        for attribute, label_key, kind in row:
            _field(language, item, attribute, label_key, kind, f"{key_base}_{attribute}")


def _validator_messages(language: str, text: str, path: str) -> list[str]:
    return [
        t(language, VALIDATOR_MESSAGES[issue.message]) if issue.message in VALIDATOR_MESSAGES
        else issue.message
        for issue in validate_bullet(Bullet(text), path)
    ]


def _md(text: str) -> str:
    """Escape user text for a markdown label (expander titles)."""

    return "".join("\\" + char if char in "\\`*_{}[]()#+-.!|~<>:$" else char for char in text)


def _edit_bullets(language: str, section: str, index: int, values: list[str]) -> list[Bullet]:
    base = f"{section}_{index}"
    ui.group_title(t(language, "bullet_editor"), t(language, "bullet_editor_hint"))
    bullets: list[Bullet] = []
    for number, value in enumerate(values):
        text_key = f"{EDITOR_PREFIX}{base}_b_{number}"
        with st.container(horizontal=True, key=f"cv-bullet-{base}-{number}",
                          vertical_alignment="top", gap="small"):
            text = _editor_text(
                t(language, "bullet_n", n=number + 1), value, text_key, True,
                placeholder=t(language, "ph_bullet"), height=68, label_visibility="collapsed",
            )
            with st.popover("", icon=":material/more_horiz:", type="tertiary",
                            help=t(language, "more_actions"), key=f"cv-more-{base}-{number}"):
                st.button(t(language, "move_up"), icon=":material/arrow_upward:", type="tertiary",
                          key=f"b_up_{base}_{number}", disabled=number == 0,
                          on_click=_queue, args=(("move_bullet", section, index, number, -1),))
                st.button(t(language, "move_down"), icon=":material/arrow_downward:", type="tertiary",
                          key=f"b_down_{base}_{number}", disabled=number == len(values) - 1,
                          on_click=_queue, args=(("move_bullet", section, index, number, 1),))
                st.button(t(language, "remove_bullet"), icon=":material/delete:", type="tertiary",
                          key=f"b_remove_{base}_{number}",
                          on_click=_queue, args=(("remove_bullet", section, index, number),))
        ui.bullet_meta(
            _validator_messages(language, text, f"{section}[{index}].bullets[{number}]"),
            len(text.strip()), BULLET_LIMIT,
        )
        bullets.append(Bullet(text))
    st.button(t(language, "add_bullet"), icon=":material/add:", type="tertiary",
              key=f"cv-add-bullet-{base}", on_click=_queue, args=(("add_bullet", section, index),))
    return bullets


def _entry_label(language: str, section: str, item: Any, index: int, issues: int) -> str:
    spec = ENTRY_SPECS[section]
    title = getattr(item, spec.title).strip() or f"{t(language, 'untitled')} {index + 1}"
    meta = [getattr(item, attribute).strip() for attribute in spec.subtitle
            if getattr(item, attribute).strip()]
    if hasattr(item, "start_date"):
        dates = date_range(item.start_date, item.end_date)
    else:
        dates = getattr(item, "date", "").strip()
    if dates:
        meta.append(dates)
    label = f"**{_md(title)}**"
    if meta:
        label += "  ·  " + " · ".join(_md(value) for value in meta)
    if spec.bullets and item.bullets:
        count_key = "bullet_count_one" if len(item.bullets) == 1 else "bullet_count"
        label += f" :gray-badge[{t(language, count_key, n=len(item.bullets))}]"
    if issues:
        label += f" :orange-badge[{t(language, 'to_review', n=issues)}]"
    return label


def _entry_footer(language: str, section: str, index: int, count: int) -> None:
    with st.container(horizontal=True, vertical_alignment="center", gap="small",
                      key=f"cv-entry-foot-{section}-{index}"):
        with st.container(key=f"cv-danger-remove-{section}-{index}", width="content"):
            st.button(t(language, "remove_entry"), icon=":material/delete:",
                      key=f"remove_{section}_{index}",
                      on_click=_queue, args=(("remove_entry", section, index),))
        st.space("stretch")
        st.button(t(language, "move_up"), icon=":material/arrow_upward:", type="tertiary",
                  key=f"up_{section}_{index}", disabled=index == 0,
                  on_click=_queue, args=(("move_entry", section, index, -1),))
        st.button(t(language, "move_down"), icon=":material/arrow_downward:", type="tertiary",
                  key=f"down_{section}_{index}", disabled=index == count - 1,
                  on_click=_queue, args=(("move_entry", section, index, 1),))
        st.button(t(language, "duplicate_entry"), icon=":material/content_copy:", type="tertiary",
                  key=f"duplicate_{section}_{index}",
                  on_click=_queue, args=(("duplicate_entry", section, index),))


def _issue_counts(profile: CVProfile) -> dict[str, int]:
    counts: dict[str, int] = {}
    for issue in validate_profile(profile).issues:
        prefix = issue.path.split(".bullets", 1)[0]
        counts[prefix] = counts.get(prefix, 0) + 1
        section = prefix.split("[", 1)[0]
        counts[section] = counts.get(section, 0) + 1
    return counts


def _entries(language: str, profile: CVProfile, section: str) -> None:
    spec = ENTRY_SPECS[section]
    items = getattr(profile, section)
    if not items:
        ui.empty_state(
            next(item.icon for item in ALL_SECTIONS if item.key == section),
            t(language, f"empty_{section}"),
            t(language, f"empty_{section}_text"),
            t(language, f"example_{section}"),
            t(language, "example"),
        )
        with st.container(key="cv-empty-actions"):
            st.button(t(language, f"add_{section}"), type="primary", icon=":material/add:",
                      key=f"empty_add_{section}", on_click=_queue, args=(("add_entry", section),))
        return
    issues = _issue_counts(profile)
    open_entry = st.session_state.get("open_entry")
    version = st.session_state.cv_editor_version
    for index, item in enumerate(items):
        label = _entry_label(language, section, item, index, issues.get(f"{section}[{index}]", 0))
        expanded = open_entry == (section, index) or len(items) == 1
        with st.expander(label, expanded=expanded, key=f"cv-entry-{section}-{index}-{version}"):
            for row in spec.rows:
                _field_row(language, item, row, f"{EDITOR_PREFIX}{section}_{index}")
            if spec.bullets:
                item.bullets = _edit_bullets(
                    language, section, index, [bullet.text for bullet in item.bullets]
                )
            _entry_footer(language, section, index, len(items))
    st.button(t(language, f"add_{section}"), icon=":material/add:", key=f"cv-add-{section}",
              on_click=_queue, args=(("add_entry", section),))


def _visibility_toggle(language: str, profile: CVProfile, keys: tuple[str, ...], label: str) -> None:
    visible = any(profile.section_is_active(key) for key in keys)
    st.toggle(
        label, value=visible,
        key=f"cv-visible-{'-'.join(keys)}-{int(visible)}-{st.session_state.cv_editor_version}",
        on_change=_set_visibility, args=(keys, not visible),
    )


def _section_header(language: str, profile: CVProfile, section: Section) -> None:
    sections = [HEADER_SECTION, *CV_SECTIONS]
    if section in sections:
        overline = t(language, "section_of", n=sections.index(section) + 1, total=len(sections))
    else:
        overline = t(language, "rail_tools")
    ui.section_head(overline, t(language, SECTION_LABELS.get(section.key, section.key)),
                    t(language, f"desc_{section.key}"))
    if not section.visibility:
        return
    with st.container(horizontal=True, vertical_alignment="center", gap="medium",
                      key="cv-section-actions"):
        _visibility_toggle(language, profile, section.visibility, t(language, "show_in_cv"))
        if getattr(profile, section.key):
            st.button(t(language, f"add_{section.key}"), icon=":material/add:",
                      key=f"cv-head-add-{section.key}",
                      on_click=_queue, args=(("add_entry", section.key),))


def _personal(language: str, profile: CVProfile) -> None:
    key = EDITOR_PREFIX + "personal_"
    profile.name = _editor_text(t(language, "f_full_name"), profile.name, key + "name",
                                placeholder=t(language, "ph_name"))
    contact = profile.contact
    for row in (("email", "phone"), ("location", "website"), ("linkedin", "github")):
        with st.container(horizontal=True, gap="small"):
            for field in row:
                setattr(contact, field, _editor_text(
                    t(language, f"f_{field}"), getattr(contact, field), key + field,
                    placeholder=t(language, f"ph_{field}"),
                ))
    locale_key = key + "locale"
    if locale_key not in st.session_state:
        st.session_state[locale_key] = profile.locale if profile.locale in ("en", "es") else "en"
    profile.locale = st.segmented_control(
        t(language, "cv_language"), ["es", "en"], key=locale_key, required=True,
        format_func=lambda value: t(language, "spanish" if value == "es" else "english"),
    ) or "en"
    st.space("small")
    ui.group_title(t(language, "app_only"), t(language, "app_only_hint"))
    profile.title = _editor_text(t(language, "f_headline"), profile.title, key + "title",
                                 placeholder=t(language, "ph_headline"))
    profile.summary = _editor_text(t(language, "summary"), profile.summary, key + "summary", True,
                                   placeholder=t(language, "ph_summary"))
    st.space("small")
    ui.group_title(t(language, "file_title"), t(language, "file_hint"))
    profile.id = _editor_text(t(language, "f_file_name"), profile.id, key + "id")


def _skills(language: str, profile: CVProfile) -> None:
    _entries(language, profile, "skills")
    for attribute in ("languages", "interests"):
        st.space("small")
        with st.container(horizontal=True, vertical_alignment="center", gap="medium"):
            ui.group_title(t(language, attribute))
            st.space("stretch")
            _visibility_toggle(language, profile, (attribute,), t(language, "show_in_cv"))
        setattr(profile, attribute, _editor_lines(
            t(language, f"f_{attribute}"), getattr(profile, attribute),
            EDITOR_PREFIX + attribute, t(language, f"ph_{attribute}"),
        ))


def _apply_json() -> None:
    try:
        advanced_profile = CVProfile.from_json(st.session_state.profile_editor)
    except (ValueError, json.JSONDecodeError) as exc:
        st.session_state.json_error = str(exc)
        return
    st.session_state.profile_json = advanced_profile.to_json()
    st.session_state.pop("profile_editor", None)
    _clear_editor_state()


def _reset_json() -> None:
    st.session_state.pop("profile_editor", None)
    st.session_state.pop("json_error", None)


def _advanced(language: str, profile: CVProfile) -> None:
    if "profile_editor" not in st.session_state:
        st.session_state.profile_editor = profile.to_json()
    st.text_area(t(language, "json_editor"), height=420, key="profile_editor")
    error = st.session_state.pop("json_error", None)
    if error:
        ui.callout("danger", "error", t(language, "invalid_json", error=error))
    with st.container(horizontal=True, gap="small"):
        st.button(t(language, "apply_json"), key="apply_profile_json", type="primary",
                  on_click=_apply_json)
        st.button(t(language, "reset_json"), key="reset_profile_json", type="tertiary",
                  on_click=_reset_json)


def editor(language: str) -> CVProfile | None:
    profile = current_profile()
    if profile is None:
        ui.callout("danger", "error", t(language, "invalid_json", error="syntax error"))
        return None
    section = next((item for item in ALL_SECTIONS if item.key == st.session_state.section),
                   HEADER_SECTION)
    _section_header(language, profile, section)
    if section.key == "personal":
        _personal(language, profile)
    elif section.key == "skills":
        _skills(language, profile)
    elif section.key == "advanced":
        _advanced(language, profile)
    else:
        _entries(language, profile, section.key)
    _apply_actions(profile)
    st.session_state.profile_json = profile.to_json()
    return profile


# ── Section rail (sidebar) ───────────────────────────────────────────────────

def _section_count(profile: CVProfile, section: Section) -> int:
    if section.key == "personal":
        return int(bool(profile.name.strip()))
    if section.key == "skills":
        return len(profile.skills) + len(profile.languages) + len(profile.interests)
    return len(getattr(profile, section.key))


def _progress(language: str, profile: CVProfile, issues: dict[str, int], saved: bool) -> None:
    steps = [
        (bool(profile.name.strip() and profile.contact.email.strip()), "step_contact"),
        (bool(profile.education), "step_education"),
        (bool(profile.experience), "step_experience"),
        (bool(profile.experience) and all(len(item.bullets) >= 3 for item in profile.experience),
         "step_bullets"),
        (any(group.items for group in profile.skills), "step_skills"),
        (not any(issues.values()), "step_review"),
        (any(getattr(profile, key) for key in (
            "projects", "leadership_activities", "volunteer_experience",
            "certifications", "awards", "publications")), "step_extra"),
        (saved, "step_saved"),
    ]
    done = sum(1 for complete, _ in steps if complete)
    pending = next((key for complete, key in steps if not complete), "")
    hint = (t(language, "progress_next", step=f"<strong>{t(language, pending)}</strong>")
            if pending else t(language, "progress_done"))
    ui.progress_meter(t(language, "progress_label"), done, len(steps),
                      t(language, "progress_value", done=done, total=len(steps)), hint)


def _rail_row(language: str, profile: CVProfile, section: Section, issues: dict[str, int]) -> None:
    with st.container(horizontal=True, vertical_alignment="center", gap=None, wrap=False,
                      key=f"cv-rail-{section.key}"):
        st.button(t(language, SECTION_LABELS.get(section.key, section.key)),
                  icon=f":material/{section.icon}:", type="tertiary", width="stretch",
                  key=f"rail_{section.key}", on_click=_go_to, args=(section.key,))
        if section is not ADVANCED_SECTION:
            warnings = issues.get(section.key, 0)
            ui.rail_count(_section_count(profile, section),
                          t(language, "to_review", n=warnings) if warnings else "")
        if section.visibility:
            visible = _section_visible(profile, section)
            with st.container(key=f"cv-eye-{section.key}", width="content"):
                st.button("", icon=":material/visibility:" if visible else ":material/visibility_off:",
                          type="tertiary", key=f"eye_{section.key}",
                          help=t(language, "hide_in_cv" if visible else "show_in_cv"),
                          on_click=_set_visibility, args=(section.visibility, not visible))


def rail(language: str, profile: CVProfile, saved: bool) -> None:
    issues = _issue_counts(profile)
    with st.sidebar:
        ui.rail_overline(t(language, "rail_header"), first=True)
        _rail_row(language, profile, HEADER_SECTION, issues)
        ui.rail_overline(t(language, "rail_sections"))
        for section in CV_SECTIONS:
            _rail_row(language, profile, section, issues)
        ui.rail_overline(t(language, "rail_tools"))
        _rail_row(language, profile, ADVANCED_SECTION, issues)
        _progress(language, profile, issues, saved)
    current = st.session_state.section
    rules = [
        f".st-key-cv-rail-{current} {{ background: var(--pen-soft) !important; }}",
        f".st-key-cv-rail-{current} [data-testid='stBaseButton-tertiary'],"
        f".st-key-cv-rail-{current} [data-testid='stBaseButton-tertiary'] p,"
        f".st-key-cv-rail-{current} [data-testid='stBaseButton-tertiary'] span"
        " { color: var(--pen) !important; font-weight: 600 !important; }",
        f".st-key-cv-rail-{current} .cv-rail-count"
        " { background: var(--pen) !important; color: var(--on-pen) !important; }",
    ]
    for section in (HEADER_SECTION, *CV_SECTIONS):
        if section.visibility and not _section_visible(profile, section):
            rules.append(
                f".st-key-cv-rail-{section.key} [data-testid='stBaseButton-tertiary'] p"
                " { text-decoration: line-through; color: var(--ink-muted); }"
                f" .st-key-cv-rail-{section.key} [class*='st-key-cv-eye-'] {{ opacity: 1; }}"
                f" .st-key-cv-rail-{section.key} .cv-rail-count {{ visibility: hidden; }}"
            )
        elif section.key != current and not _section_count(profile, section):
            rules.append(
                f".st-key-cv-rail-{section.key} [data-testid='stBaseButton-tertiary'] p"
                " { color: var(--ink-muted); }"
            )
    ui.inject_css("\n".join(rules))


# ── Top bar, dialogs and preview ─────────────────────────────────────────────

def _derive_profile_id(profile: CVProfile) -> str:
    if profile.id.strip() and profile.id != "new_profile":
        return safe_filename(profile.id)
    ascii_name = unicodedata.normalize("NFKD", profile.name).encode("ascii", "ignore").decode()
    base = safe_filename(ascii_name.lower().replace(" ", "_"), "profile")
    candidate, suffix = base, 2
    existing = set(list_profiles()) - {st.session_state.selected_profile}
    while candidate in existing:
        candidate = f"{base}_{suffix}"
        suffix += 1
    return candidate


def _new_profile() -> None:
    logger.info("Creating a new profile")
    select_profile("")
    st.session_state.section = "personal"


def _duplicate_profile() -> None:
    profile = current_profile()
    if profile is None:
        return
    base_id = safe_filename(profile.id or "profile")
    duplicate_id, suffix = base_id + "_copy", 2
    while duplicate_id in list_profiles():
        duplicate_id = f"{base_id}_copy_{suffix}"
        suffix += 1
    duplicate = CVProfile.from_dict(profile.to_dict())
    duplicate.id = duplicate_id
    save_profile(duplicate)
    logger.info("Profile duplicated: source=%s target=%s", profile.id, duplicate_id)
    select_profile(duplicate_id)


def _profile_changed(widget_key: str) -> None:
    select_profile(st.session_state[widget_key])


def _set_confirm_delete(value: bool) -> None:
    st.session_state.confirm_delete = value


def _delete_current_profile(message: str) -> None:
    profile = current_profile()
    st.session_state.confirm_delete = False
    if profile is None or safe_filename(profile.id) not in list_profiles():
        return
    delete_profile(profile.id)
    logger.info("Profile deleted: id=%s", profile.id)
    select_profile("")
    _flash("success", message)


def _profile_menu(language: str, profile: CVProfile, label: str) -> None:
    with st.popover(_md(label), type="tertiary", key="cv-profile-menu"):
        st.html(f'<p class="cv-overline">{t(language, "profiles")}</p>')
        profiles = list_profiles()
        options = [""] + profiles
        selected = st.session_state.selected_profile
        widget_key = f"cv-profile-select-{selected}"
        st.selectbox(
            t(language, "open_profile"), options,
            index=options.index(selected) if selected in options else 0,
            format_func=lambda value: t(language, "new_profile") if not value else value,
            key=widget_key, on_change=_profile_changed, args=(widget_key,),
        )
        st.button(t(language, "new_profile"), icon=":material/add:", type="tertiary",
                  key="menu_new", on_click=_new_profile)
        st.button(t(language, "duplicate"), icon=":material/content_copy:", type="tertiary",
                  key="menu_duplicate", on_click=_duplicate_profile)
        can_delete = bool(profile.id and safe_filename(profile.id) in profiles)
        if not (can_delete and st.session_state.get("confirm_delete")):
            st.button(t(language, "delete"), icon=":material/delete:", type="tertiary",
                      key="menu_delete", disabled=not can_delete,
                      help=None if can_delete else t(language, "save_before_delete"),
                      on_click=_set_confirm_delete, args=(True,))
            return
        # Confirmation stays inside the menu so nothing opens on top of it.
        ui.callout("danger", "delete",
                   t(language, "delete_text", name=profile.name.strip() or profile.id),
                   t(language, "delete_title"))
        with st.container(horizontal=True, gap="small", horizontal_alignment="right"):
            st.button(t(language, "cancel"), type="tertiary", key="delete_cancel",
                      on_click=_set_confirm_delete, args=(False,))
            with st.container(key="cv-danger-confirm", width="content"):
                st.button(t(language, "delete"), icon=":material/delete:", key="delete_confirm",
                          on_click=_delete_current_profile, args=(t(language, "deleted"),))


def _settings_dialog(language: str) -> None:
    @st.dialog(t(language, "settings"), width="medium")
    def body() -> None:
        ui.group_title(t(language, "interface_language"))
        interface = st.segmented_control(
            t(language, "interface_language"), ["es", "en"], default=language, required=True,
            format_func=lambda value: "Español" if value == "es" else "English",
            key="dlg_language", label_visibility="collapsed",
        )
        with st.container(horizontal=True, gap="small", horizontal_alignment="right"):
            if st.button(t(language, "cancel"), type="tertiary", key="dlg_cancel"):
                st.rerun()
            if st.button(t(language, "save_settings"), type="primary", key="dlg_save"):
                st.session_state.language = interface or language
                st.rerun()

    body()


def _export_dialog(language: str, profile: CVProfile) -> None:
    @st.dialog(t(language, "exports"), width="large")
    def body() -> None:
        st.caption(t(language, "exports_hint"))
        profile_json = profile.to_json()
        fingerprint = hashlib.sha256(profile_json.encode("utf-8")).hexdigest()
        pdf, docx, latex_col, json_col = st.columns(4)
        with pdf, st.container(border=True, height="stretch"):
            ui.export_head("PDF", t(language, "pdf_title"), t(language, "pdf_desc"),
                           t(language, "recommended"))
            if pdflatex_path():
                cached = st.session_state.get("pdf_export")
                if cached and cached["fingerprint"] == fingerprint:
                    st.download_button(t(language, "download_pdf"), cached["data"],
                                       file_name=f"{profile.id}.pdf", mime="application/pdf",
                                       type="primary", icon=":material/download:",
                                       width="stretch", on_click="ignore")
                elif st.button(t(language, "build_pdf"), type="primary",
                               icon=":material/picture_as_pdf:", width="stretch"):
                    output = ROOT / "exports" / f"{profile.id}.pdf"
                    try:
                        with st.spinner(t(language, "building_pdf")):
                            generate_pdf(profile, output, LatexGenerator(ROOT / "templates" / "cv.tex"))
                    except PdfGenerationError as exc:
                        ui.callout("danger", "error", str(exc))
                    else:
                        logger.info("PDF generated: profile=%s", profile.id)
                        st.session_state.pdf_export = {
                            "fingerprint": fingerprint, "data": output.read_bytes(),
                        }
                        st.rerun(scope="fragment")
            else:
                ui.callout("danger", "error", t(language, "no_pdf"))
        with docx, st.container(border=True, height="stretch"):
            ui.export_head("DOCX", t(language, "docx"), t(language, "docx_desc"))
            try:
                docx_data = generate_docx_bytes(profile)
            except DocxGenerationError as exc:
                ui.callout("warning", "error", str(exc))
            else:
                logger.info("DOCX generation requested: profile=%s", profile.id)
                st.download_button(
                    t(language, "download_docx"), docx_data, file_name=f"{profile.id}.docx",
                    mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    icon=":material/download:", width="stretch", on_click="ignore",
                )
        with latex_col, st.container(border=True, height="stretch"):
            ui.export_head("TEX", t(language, "latex"), t(language, "latex_desc"))
            latex = LatexGenerator(ROOT / "templates" / "cv.tex").generate(profile)
            logger.info("LaTeX generated: profile=%s", profile.id)
            st.download_button(t(language, "download_tex"), latex, file_name=f"{profile.id}.tex",
                               mime="application/x-tex", icon=":material/download:",
                               width="stretch", on_click="ignore")
        with json_col, st.container(border=True, height="stretch"):
            ui.export_head("JSON", t(language, "json_title"), t(language, "json_desc"))
            st.download_button(t(language, "download_json"), profile_json,
                               file_name=f"{profile.id}.json", mime="application/json",
                               icon=":material/download:", width="stretch", on_click="ignore")
            logger.info("JSON export prepared: profile=%s", profile.id)

    body()


def topbar(language: str, profile: CVProfile, dirty: bool) -> None:
    selected = st.session_state.selected_profile
    ui.brand(t(language, "app_short"))
    ui.separator()
    unnamed = not selected and profile.id in ("", "new_profile")
    label = profile.name.strip() or (t(language, "new_profile") if unnamed else profile.id)
    _profile_menu(language, profile, label)
    if not selected:
        ui.badge(t(language, "status_draft"), "warning", dot=True)
    elif dirty:
        ui.badge(t(language, "status_unsaved"), "warning", dot=True)
    else:
        ui.badge(t(language, "status_saved"), "success", icon_name="check")
    st.space("stretch")
    if st.button("", icon=":material/settings:", type="tertiary", key="open_settings",
                 help=t(language, "settings")):
        _settings_dialog(language)
    if st.button(t(language, "export"), icon=":material/download:", key="open_export"):
        _export_dialog(language, profile)
    can_save = dirty or not selected
    if st.button(t(language, "save") if can_save else t(language, "status_saved"),
                 icon=":material/save:" if can_save else ":material/check:",
                 type="primary", key="save_profile", disabled=not can_save):
        profile.id = _derive_profile_id(profile)
        save_profile(profile)
        logger.info("Profile saved: id=%s", profile.id)
        st.session_state.selected_profile = profile.id
        st.session_state.profile_json = profile.to_json()
        st.session_state.saved_json = st.session_state.profile_json
        _clear_editor_state()
        _flash("success", t(language, "saved"))
        st.rerun()


def preview(language: str, profile: CVProfile) -> None:
    with st.container(key="cv-preview"):
        ui.preview_bar(t(language, "live"), t(language, "preview_meta"))
        st.html(ui.paper_html(profile, st.session_state.section, t(language, "preview_empty")))


def main() -> None:
    initialize_state()
    language = st.session_state.language
    st.set_page_config(
        page_title=t(language, "app_title"),
        # A local file: a ":material/…:" icon would be fetched from Google.
        page_icon=str(ROOT / "static" / "favicon.svg"),
        layout="wide",
        initial_sidebar_state="auto",
    )
    ui.apply_theme(st.context.theme.type)
    _show_flash()
    bar = st.container(key="cv-topbar", horizontal=True, vertical_alignment="center", gap="small")
    editor_column, preview_column = st.columns([1.1, 1], gap="large")
    with editor_column, st.container(key="cv-editor"):
        profile = editor(language)
    if profile is None:
        return
    dirty = profile.to_json() != st.session_state.saved_json
    with bar:
        topbar(language, profile, dirty)
    with preview_column:
        preview(language, profile)
    rail(language, profile, saved=bool(st.session_state.selected_profile) and not dirty)


if __name__ == "__main__":
    main()
