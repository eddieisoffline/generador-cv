"""Plain-text formatting shared by the DOCX and LaTeX exports."""

from __future__ import annotations


def date_range(start: str, end: str) -> str:
    return " – ".join(value.strip() for value in (start, end) if value.strip())


def display_url(url: str) -> str:
    """Shorten a URL for display; the link target keeps the full address."""
    text = url.strip()
    for prefix in ("https://", "http://"):
        if text.lower().startswith(prefix):
            text = text[len(prefix):]
    if text.lower().startswith("www."):
        text = text[len("www."):]
    return text.rstrip("/")
