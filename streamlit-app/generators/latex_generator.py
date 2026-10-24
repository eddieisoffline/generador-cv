"""LaTeX CV rendering with conservative escaping.

The layout mirrors the DOCX export (Harvard-style bullet resume): Carlito, a
metric clone of Calibri, at 11 pt on US Letter, a ruled header, centred
section headings, and entry lines with the location or dates flushed right.
"""

from __future__ import annotations

from pathlib import Path
from typing import Iterable

from generators.formatting import date_range, display_url
from models.cv_model import (
    Award, Certification, CVProfile, Education, Experience,
    LeadershipActivity, Project, Publication, VolunteerExperience,
)
from utils.localization import t


ESCAPES = {
    "\\": r"\textbackslash{}",
    "&": r"\&",
    "%": r"\%",
    "$": r"\$",
    "#": r"\#",
    "_": r"\_",
    "{": r"\{",
    "}": r"\}",
    "~": r"\textasciitilde{}",
    "^": r"\textasciicircum{}",
}

PREAMBLE = (
    r"\documentclass[11pt,letterpaper]{article}" "\n"
    r"\usepackage[top=0.5in,bottom=0.2in,left=0.42in,right=0.42in]{geometry}" "\n"
    r"\usepackage[T1]{fontenc}" "\n"
    r"\usepackage[sfdefault,lining]{carlito}" "\n"
    r"\DeclareUnicodeCharacter{2212}{\textminus}" "\n"
    r"\DeclareUnicodeCharacter{2192}{\textrightarrow}" "\n"
    r"\DeclareUnicodeCharacter{2248}{\ensuremath{\approx}}" "\n"
    r"\input{glyphtounicode}" "\n"
    r"\pdfgentounicode=1" "\n"
    r"\usepackage[hidelinks]{hyperref}" "\n"
    r"\usepackage{enumitem}" "\n"
    r"\setlist[itemize]{label=\textbullet,align=left,labelindent=0.33in,labelwidth=0.25in,"
    r"labelsep=0pt,leftmargin=!,noitemsep,topsep=0pt,partopsep=0pt}" "\n"
    r"\setlength{\parindent}{0pt}" "\n"
    r"\hyphenpenalty=10000" "\n"
    r"\exhyphenpenalty=10000" "\n"
    r"\raggedright" "\n"
    r"\pagestyle{empty}" "\n"
    r"\begin{document}" "\n%CV_CONTENT%\n" r"\end{document}" "\n"
)

ENTRY_GAP = "\n\\vspace{11pt}\n"


def escape_latex(value: str) -> str:
    return "".join(ESCAPES.get(char, char) for char in str(value))


def _href(url: str, text: str) -> str:
    target = "".join(char for char in url.strip() if char not in "\\{}")
    target = target.replace("#", r"\#").replace("%", r"\%")
    return f"\\href{{{target}}}{{{escape_latex(text)}}}"


def _section(title: str) -> str:
    return f"\\par\\vspace{{11pt}}{{\\centering\\textbf{{{escape_latex(title)}}}\\par}}\\nopagebreak\n"


def _entry_line(left: str, right: str = "", *, bold_left: bool = True) -> str:
    """Left text with the right text flushed to the right margin."""
    left, right = left.strip(), right.strip()
    if not (left or right):
        return ""
    result = f"\\textbf{{{escape_latex(left)}}}" if bold_left and left else escape_latex(left)
    if right:
        result += f"\\hfill {escape_latex(right)}"
    return result + "\\par\n"


def _text_line(text: str, label: str = "") -> str:
    text, label = text.strip(), label.strip()
    if not (text or label):
        return ""
    prefix = f"\\textbf{{{escape_latex(label)}:}} " if label else ""
    return prefix + escape_latex(text) + "\\par\n"


def _link_line(url: str) -> str:
    return _href(url, display_url(url)) + "\\par\n" if url.strip() else ""


def _bullets(items: Iterable[str]) -> str:
    values = [escape_latex(item.strip()) for item in items if item.strip()]
    if not values:
        return ""
    return "\\begin{itemize}\n" + "\n".join(f"  \\item {value}" for value in values) + (
        "\n\\end{itemize}\n"
    )


def _education(item: Education) -> str:
    return (
        _entry_line(item.institution, item.location)
        + _entry_line(item.degree, date_range(item.start_date, item.end_date), bold_left=False)
        + "".join(_text_line(detail) for detail in item.details)
    )


def _experience(item: Experience) -> str:
    return (
        _entry_line(item.company, item.location)
        + _entry_line(item.role, date_range(item.start_date, item.end_date))
        + _bullets(bullet.text for bullet in item.bullets)
    )


def _dated_heading(title: str, organization: str, location: str,
                   start: str, end: str, description: str = "",
                   bullets: Iterable[str] = ()) -> str:
    return (
        _entry_line(organization, location)
        + _entry_line(title, date_range(start, end))
        + _text_line(description)
        + _bullets(bullets)
    )


def _project(item: Project) -> str:
    return (
        _entry_line(item.name)
        + _text_line(item.description)
        + _text_line(", ".join(item.technologies))
        + _link_line(item.url)
        + _bullets(bullet.text for bullet in item.bullets)
    )


def _certification(item: Certification) -> str:
    issuer = " \\textbullet{} ".join(
        escape_latex(part.strip()) for part in (item.issuer, item.credential_id) if part.strip()
    )
    return (
        _entry_line(item.name, date_range(item.date, item.expiry_date))
        + (issuer + "\\par\n" if issuer else "")
        + _text_line(item.description)
        + _link_line(item.url)
        + _bullets(item.details)
    )


def _award(item: Award) -> str:
    return (
        _entry_line(item.name, item.date)
        + _text_line(item.issuer)
        + _text_line(item.description)
        + _link_line(item.url)
        + _bullets(item.details)
    )


def _publication(item: Publication) -> str:
    byline = " \\textbullet{} ".join(
        escape_latex(part.strip()) for part in (item.authors, item.publisher) if part.strip()
    )
    return (
        _entry_line(item.title, item.date)
        + (byline + "\\par\n" if byline else "")
        + _text_line(item.description)
        + _link_line(item.url)
    )


def _skills_interests(profile: CVProfile) -> str:
    lines = []
    if profile.section_is_active("skills"):
        lines += [(group.category, ", ".join(group.items))
                  for group in profile.skills if group.category or group.items]
    extra = []
    if profile.languages and profile.section_is_active("languages"):
        extra.append((t(profile.locale, "languages"), ", ".join(profile.languages)))
    if profile.interests and profile.section_is_active("interests"):
        extra.append((t(profile.locale, "interests"), ", ".join(profile.interests)))
    if not lines and not extra:
        return ""
    return _section(t(profile.locale, "skills_interests" if extra else "skills")) + "".join(
        _text_line(text, label) for label, text in lines + extra
    )


def _header(profile: CVProfile) -> str:
    contact = profile.contact
    values = [
        escape_latex(contact.location.strip()),
        _href(f"mailto:{contact.email.strip()}", contact.email.strip()) if contact.email.strip() else "",
        escape_latex(contact.phone.strip()),
        *(_href(url, display_url(url)) if url.strip() else "" for url in (
            contact.website, contact.linkedin, contact.github
        )),
    ]
    header = (
        f"{{\\centering\\textbf{{{escape_latex(profile.name.strip() or 'CV')}}}\\par}}\n"
        "\\vspace{2pt}\\hrule height 1pt\\vspace{5pt}\n"
    )
    contact_line = " \\textbullet{} ".join(value for value in values if value)
    if contact_line:
        header += f"{{\\centering {contact_line}\\par}}\n"
    return header


def render_latex(profile: CVProfile, template_path: Path | None = None) -> str:
    """Render a standalone document; an optional template can override the preamble."""
    sections: list[str] = []

    def entries(key: str, items: list, render) -> None:
        if items and profile.section_is_active(key):
            sections.append(_section(t(profile.locale, key)) + ENTRY_GAP.join(
                render(item) for item in items
            ))

    # Section order follows the DOCX template; title and summary are not exported.
    entries("education", profile.education, _education)
    entries("experience", profile.experience, _experience)
    entries("leadership_activities", profile.leadership_activities, lambda item: _dated_heading(
        item.title, item.organization, item.location, item.start_date, item.end_date,
        item.description, (bullet.text for bullet in item.bullets),
    ))
    sections.append(_skills_interests(profile))
    entries("projects", profile.projects, _project)
    entries("volunteer_experience", profile.volunteer_experience, lambda item: _dated_heading(
        item.role, item.organization, item.location, item.start_date, item.end_date,
        item.description, (bullet.text for bullet in item.bullets),
    ))
    entries("certifications", profile.certifications, _certification)
    entries("awards", profile.awards, _award)
    entries("publications", profile.publications, _publication)
    template = ""
    if template_path and template_path.exists():
        template = template_path.read_text(encoding="utf-8")
    if not template or "%CV_CONTENT%" not in template:
        template = PREAMBLE
    return template.replace("%CV_CONTENT%", _header(profile) + "\n".join(sections))


class LatexGenerator:
    def __init__(self, template_path: Path | None = None) -> None:
        self.template_path = template_path

    def generate(self, profile: CVProfile) -> str:
        return render_latex(profile, self.template_path)
