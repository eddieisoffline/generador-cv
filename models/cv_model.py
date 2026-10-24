"""Data model for a CV profile.

The model deliberately contains only user-provided values.  Serialisation is
kept here so the UI, generators, and profile storage all share one schema.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
import json
from typing import Any, Dict, List, Mapping


def _strings(value: Any) -> List[str]:
    if value is None:
        return []
    if isinstance(value, str):
        return [item.strip() for item in value.splitlines() if item.strip()]
    if isinstance(value, (list, tuple)):
        return [str(item).strip() for item in value if str(item).strip()]
    return [str(value).strip()] if str(value).strip() else []


def _records(value: Any) -> List[Any]:
    if isinstance(value, (list, tuple)):
        return list(value)
    if isinstance(value, Mapping):
        return [value]
    return []


def _section_values(value: Any) -> List[str]:
    """Read the old list form and the convenient mapping form."""
    if isinstance(value, Mapping):
        return [str(key) for key, enabled in value.items() if enabled]
    return _strings(value)


def _skill_groups(value: Any) -> List["SkillGroup"]:
    if isinstance(value, str):
        return [SkillGroup(items=_strings(value))]
    groups: List[SkillGroup] = []
    for item in _records(value):
        if isinstance(item, Mapping):
            groups.append(SkillGroup.from_dict(item))
        elif str(item).strip():
            groups.append(SkillGroup(items=[str(item).strip()]))
    return groups


@dataclass
class ContactInfo:
    email: str = ""
    phone: str = ""
    location: str = ""
    website: str = ""
    linkedin: str = ""
    github: str = ""

    @classmethod
    def from_dict(cls, data: Mapping[str, Any] | None) -> "ContactInfo":
        data = data if isinstance(data, Mapping) else {}
        return cls(**{key: str(data.get(key, "") or "") for key in (
            "email", "phone", "location", "website", "linkedin", "github"
        )})


@dataclass
class Bullet:
    text: str = ""

    @classmethod
    def from_value(cls, value: Any) -> "Bullet":
        return cls(str(value.get("text", "") if isinstance(value, Mapping) else value or ""))


@dataclass
class Experience:
    role: str = ""
    company: str = ""
    location: str = ""
    start_date: str = ""
    end_date: str = ""
    bullets: List[Bullet] = field(default_factory=list)

    @classmethod
    def from_dict(cls, data: Mapping[str, Any] | None) -> "Experience":
        data = data if isinstance(data, Mapping) else {}
        return cls(
            role=str(data.get("role", "") or ""),
            company=str(data.get("company", "") or ""),
            location=str(data.get("location", "") or ""),
            start_date=str(data.get("start_date", "") or ""),
            end_date=str(data.get("end_date", "") or ""),
            bullets=[Bullet.from_value(value) for value in _records(data.get("bullets"))],
        )


@dataclass
class Education:
    degree: str = ""
    institution: str = ""
    location: str = ""
    start_date: str = ""
    end_date: str = ""
    details: List[str] = field(default_factory=list)

    @classmethod
    def from_dict(cls, data: Mapping[str, Any] | None) -> "Education":
        data = data if isinstance(data, Mapping) else {}
        return cls(
            degree=str(data.get("degree", "") or ""),
            institution=str(data.get("institution", "") or ""),
            location=str(data.get("location", "") or ""),
            start_date=str(data.get("start_date", "") or ""),
            end_date=str(data.get("end_date", "") or ""),
            details=_strings(data.get("details", [])),
        )


@dataclass
class SkillGroup:
    category: str = ""
    items: List[str] = field(default_factory=list)

    @classmethod
    def from_dict(cls, data: Mapping[str, Any] | None) -> "SkillGroup":
        data = data if isinstance(data, Mapping) else {}
        return cls(
            category=str(data.get("category", "") or ""),
            items=_strings(data.get("items", [])),
        )


@dataclass
class Project:
    name: str = ""
    description: str = ""
    url: str = ""
    technologies: List[str] = field(default_factory=list)
    bullets: List[Bullet] = field(default_factory=list)

    @classmethod
    def from_dict(cls, data: Mapping[str, Any] | None) -> "Project":
        data = data if isinstance(data, Mapping) else {}
        return cls(
            name=str(data.get("name", "") or ""),
            description=str(data.get("description", "") or ""),
            url=str(data.get("url", "") or ""),
            technologies=_strings(data.get("technologies", [])),
            bullets=[Bullet.from_value(value) for value in _records(data.get("bullets"))],
        )


@dataclass
class LeadershipActivity:
    title: str = ""
    organization: str = ""
    location: str = ""
    start_date: str = ""
    end_date: str = ""
    description: str = ""
    bullets: List[Bullet] = field(default_factory=list)

    @classmethod
    def from_dict(cls, data: Mapping[str, Any] | None) -> "LeadershipActivity":
        data = data if isinstance(data, Mapping) else {}
        return cls(
            title=str(data.get("title", data.get("role", "")) or ""),
            organization=str(data.get("organization", data.get("company", "")) or ""),
            location=str(data.get("location", "") or ""),
            start_date=str(data.get("start_date", "") or ""),
            end_date=str(data.get("end_date", "") or ""),
            description=str(data.get("description", "") or ""),
            bullets=[Bullet.from_value(value) for value in _records(data.get("bullets"))],
        )


@dataclass
class Certification:
    name: str = ""
    issuer: str = ""
    date: str = ""
    expiry_date: str = ""
    credential_id: str = ""
    url: str = ""
    description: str = ""
    details: List[str] = field(default_factory=list)

    @classmethod
    def from_value(cls, value: Any) -> "Certification":
        if not isinstance(value, Mapping):
            return cls(name=str(value or ""))
        return cls(
            name=str(value.get("name", value.get("title", value.get("credential", ""))) or ""),
            issuer=str(value.get("issuer", value.get("organization", "")) or ""),
            date=str(value.get("date", value.get("issue_date", "")) or ""),
            expiry_date=str(value.get("expiry_date", "") or ""),
            credential_id=str(value.get("credential_id", value.get("id", "")) or ""),
            url=str(value.get("url", value.get("credential_url", "")) or ""),
            description=str(value.get("description", "") or ""),
            details=_strings(value.get("details", [])),
        )


@dataclass
class Award:
    name: str = ""
    issuer: str = ""
    date: str = ""
    url: str = ""
    description: str = ""
    details: List[str] = field(default_factory=list)

    @classmethod
    def from_value(cls, value: Any) -> "Award":
        if not isinstance(value, Mapping):
            return cls(name=str(value or ""))
        return cls(
            name=str(value.get("name", value.get("title", "")) or ""),
            issuer=str(value.get("issuer", value.get("organization", "")) or ""),
            date=str(value.get("date", "") or ""),
            url=str(value.get("url", "") or ""),
            description=str(value.get("description", "") or ""),
            details=_strings(value.get("details", [])),
        )


@dataclass
class Publication:
    title: str = ""
    authors: str = ""
    publisher: str = ""
    date: str = ""
    url: str = ""
    description: str = ""

    @classmethod
    def from_dict(cls, data: Mapping[str, Any] | None) -> "Publication":
        data = data if isinstance(data, Mapping) else {}
        authors = data.get("authors", "")
        if isinstance(authors, (list, tuple)):
            authors = ", ".join(str(item) for item in authors)
        return cls(
            title=str(data.get("title", data.get("name", "")) or ""),
            authors=str(authors or ""),
            publisher=str(data.get("publisher", "") or ""),
            date=str(data.get("date", "") or ""),
            url=str(data.get("url", "") or ""),
            description=str(data.get("description", "") or ""),
        )


@dataclass
class VolunteerExperience:
    role: str = ""
    organization: str = ""
    location: str = ""
    start_date: str = ""
    end_date: str = ""
    description: str = ""
    bullets: List[Bullet] = field(default_factory=list)

    @classmethod
    def from_dict(cls, data: Mapping[str, Any] | None) -> "VolunteerExperience":
        data = data if isinstance(data, Mapping) else {}
        return cls(
            role=str(data.get("role", data.get("title", "")) or ""),
            organization=str(data.get("organization", data.get("company", "")) or ""),
            location=str(data.get("location", "") or ""),
            start_date=str(data.get("start_date", "") or ""),
            end_date=str(data.get("end_date", "") or ""),
            description=str(data.get("description", "") or ""),
            bullets=[Bullet.from_value(value) for value in _records(data.get("bullets"))],
        )


@dataclass
class CVProfile:
    id: str = "profile"
    name: str = ""
    title: str = ""
    summary: str = ""
    contact: ContactInfo = field(default_factory=ContactInfo)
    experience: List[Experience] = field(default_factory=list)
    education: List[Education] = field(default_factory=list)
    skills: List[SkillGroup] = field(default_factory=list)
    projects: List[Project] = field(default_factory=list)
    languages: List[str] = field(default_factory=list)
    interests: List[str] = field(default_factory=list)
    leadership_activities: List[LeadershipActivity] = field(default_factory=list)
    certifications: List[Certification] = field(default_factory=list)
    awards: List[Award] = field(default_factory=list)
    publications: List[Publication] = field(default_factory=list)
    volunteer_experience: List[VolunteerExperience] = field(default_factory=list)
    active_sections: List[str] = field(default_factory=list)
    locale: str = "en"

    @classmethod
    def from_dict(cls, data: Mapping[str, Any] | None) -> "CVProfile":
        data = data if isinstance(data, Mapping) else {}
        return cls(
            id=str(data.get("id", "profile") or "profile"),
            name=str(data.get("name", "") or ""),
            title=str(data.get("title", "") or ""),
            summary=str(data.get("summary", "") or ""),
            contact=ContactInfo.from_dict(data.get("contact")),
            experience=[Experience.from_dict(item) for item in _records(data.get("experience"))],
            education=[Education.from_dict(item) for item in _records(data.get("education"))],
            skills=_skill_groups(data.get("skills")),
            projects=[Project.from_dict(item) for item in _records(data.get("projects"))],
            languages=_strings(data.get("languages", [])),
            interests=_strings(data.get("interests", data.get("skills_interests", []))),
            leadership_activities=[
                LeadershipActivity.from_dict(item)
                for item in _records(
                    data.get(
                        "leadership_activities",
                        data.get("leadership", data.get("leadership_and_activities",
                                                          data.get("activities"))),
                    )
                )
            ],
            certifications=[
                Certification.from_value(item) for item in _records(data.get("certifications"))
            ],
            awards=[Award.from_value(item) for item in _records(data.get("awards"))],
            publications=[
                Publication.from_dict(item) for item in _records(data.get("publications"))
            ],
            volunteer_experience=[
                VolunteerExperience.from_dict(item)
                for item in _records(data.get(
                    "volunteer_experience", data.get("volunteering", data.get("volunteer"))
                ))
            ],
            active_sections=_section_values(data.get("active_sections", [])),
            locale=str(data.get("locale", "en") or "en"),
        )

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    def to_json(self, *, indent: int = 2) -> str:
        return json.dumps(self.to_dict(), ensure_ascii=False, indent=indent)

    def section_is_active(self, section: str) -> bool:
        """An empty active_sections keeps legacy profiles fully visible."""
        if not self.active_sections:
            return True
        normalized = section.lower().replace("&", "and").replace(" ", "_")
        aliases = {
            "leadership": "leadership_activities",
            "activities": "leadership_activities",
            "leadership_and_activities": "leadership_activities",
            "volunteer": "volunteer_experience",
            "skills_and_interests": "skills",
        }
        raw_selected = {
            item.lower().replace("&", "and").replace(" ", "_")
            for item in self.active_sections
        }
        if normalized in ("skills", "interests") and "skills_and_interests" in raw_selected:
            return True
        selected = {
            aliases.get(item, item) for item in raw_selected
        }
        return aliases.get(normalized, normalized) in selected

    @classmethod
    def from_json(cls, value: str) -> "CVProfile":
        parsed = json.loads(value)
        if not isinstance(parsed, Mapping):
            raise ValueError("A profile JSON document must contain an object.")
        return cls.from_dict(parsed)
