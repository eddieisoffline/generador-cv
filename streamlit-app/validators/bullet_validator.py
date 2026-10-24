"""Structural validation for CV bullets.

This validator never claims that a bullet is truthful; it only checks shape
and flags common quality problems for the author to review.
"""

from __future__ import annotations

from dataclasses import dataclass, field
import re
from typing import List

from models.cv_model import Bullet, CVProfile


@dataclass
class ValidationIssue:
    path: str
    message: str
    severity: str = "warning"


@dataclass
class ValidationResult:
    issues: List[ValidationIssue] = field(default_factory=list)

    @property
    def valid(self) -> bool:
        return not any(issue.severity == "error" for issue in self.issues)


ACTION_WORDS = {
    "built", "created", "designed", "developed", "delivered", "drove",
    "improved", "increased", "launched", "led", "managed", "reduced",
    "automated", "analyzed", "implemented", "optimized", "owned",
    "construí", "creé", "diseñé", "desarrollé", "entregué", "lideré",
    "gestioné", "reduje", "automaticé", "analicé", "implementé",
    "optimicé",
}


def validate_bullet(bullet: Bullet, path: str = "bullet") -> List[ValidationIssue]:
    text = bullet.text.strip()
    if not text:
        return [ValidationIssue(path, "Bullet is empty.", "error")]
    issues: List[ValidationIssue] = []
    if len(text) > 240:
        issues.append(ValidationIssue(path, "Bullet is longer than 240 characters."))
    if re.match(r"^(i|yo|me|my|mi|mis)\b", text, re.IGNORECASE):
        issues.append(ValidationIssue(path, "Prefer an action-led bullet without first person."))
    first_word = re.sub(r"^[^A-Za-zÀ-ÿ]+", "", text).split(" ", 1)[0].lower()
    if first_word not in ACTION_WORDS:
        issues.append(ValidationIssue(path, "Consider starting with a specific action verb."))
    if text.endswith(".") or text.endswith(";"):
        issues.append(ValidationIssue(path, "Use consistent punctuation across bullets."))
    return issues


def validate_profile(profile: CVProfile) -> ValidationResult:
    result = ValidationResult()
    for index, experience in enumerate(profile.experience):
        for bullet_index, bullet in enumerate(experience.bullets):
            result.issues.extend(validate_bullet(
                bullet, f"experience[{index}].bullets[{bullet_index}]"
            ))
    for index, project in enumerate(profile.projects):
        for bullet_index, bullet in enumerate(project.bullets):
            result.issues.extend(validate_bullet(
                bullet, f"projects[{index}].bullets[{bullet_index}]"
            ))
    for field_name in ("leadership_activities", "volunteer_experience"):
        for index, entry in enumerate(getattr(profile, field_name)):
            for bullet_index, bullet in enumerate(entry.bullets):
                result.issues.extend(validate_bullet(
                    bullet, f"{field_name}[{index}].bullets[{bullet_index}]"
                ))
    return result


class BulletValidator:
    """Convenience facade for validating individual bullets or profiles."""

    def validate_bullet(self, bullet: Bullet, path: str = "bullet") -> List[ValidationIssue]:
        return validate_bullet(bullet, path)

    def validate_profile(self, profile: CVProfile) -> ValidationResult:
        return validate_profile(profile)
