"""Safe local profile and export file operations."""

from __future__ import annotations

import json
from pathlib import Path
import re
from typing import List

from models.cv_model import CVProfile
from utils.logging_config import logger

ROOT = Path(__file__).resolve().parents[1]
PROFILES_DIR = ROOT / "profiles"


def safe_filename(value: str, fallback: str = "profile") -> str:
    name = re.sub(r"[^A-Za-z0-9._-]+", "_", value.strip()).strip("._")
    return name or fallback


def ensure_profiles_dir() -> Path:
    PROFILES_DIR.mkdir(parents=True, exist_ok=True)
    return PROFILES_DIR


def list_profiles() -> List[str]:
    ensure_profiles_dir()
    return sorted(path.stem for path in PROFILES_DIR.glob("*.json"))


def profile_path(profile_id: str) -> Path:
    return ensure_profiles_dir() / f"{safe_filename(profile_id)}.json"


def save_profile(profile: CVProfile) -> Path:
    path = profile_path(profile.id)
    path.write_text(profile.to_json() + "\n", encoding="utf-8")
    logger.info("Profile file written: id=%s", profile.id)
    return path


def load_profile(profile_id: str) -> CVProfile:
    path = profile_path(profile_id)
    profile = CVProfile.from_json(path.read_text(encoding="utf-8"))
    logger.info("Profile file loaded: id=%s", profile_id)
    return profile


def delete_profile(profile_id: str) -> None:
    path = profile_path(profile_id)
    if path.exists():
        path.unlink()
        logger.info("Profile file removed: id=%s", profile_id)


def load_all_profiles() -> List[CVProfile]:
    profiles: List[CVProfile] = []
    for profile_id in list_profiles():
        try:
            profiles.append(load_profile(profile_id))
        except (OSError, ValueError, json.JSONDecodeError):
            continue
    return profiles
