"""PDF export through the locally installed pdflatex executable."""

from __future__ import annotations

from pathlib import Path
import shutil
import subprocess

from generators.latex_generator import LatexGenerator
from models.cv_model import CVProfile


class PdfGenerationError(RuntimeError):
    pass


def pdflatex_path() -> str | None:
    return shutil.which("pdflatex")


def generate_pdf(
    profile: CVProfile,
    output_path: Path,
    latex_generator: LatexGenerator | None = None,
) -> Path:
    executable = pdflatex_path()
    if not executable:
        raise PdfGenerationError("pdflatex is not installed or not on PATH.")
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    work_dir = output_path.parent / f".{output_path.stem}_latex"
    work_dir.mkdir(parents=True, exist_ok=True)
    tex_path = work_dir / f"{output_path.stem}.tex"
    tex_path.write_text(
        (latex_generator or LatexGenerator()).generate(profile), encoding="utf-8"
    )
    try:
        command = [executable, "-interaction=nonstopmode", "-halt-on-error", tex_path.name]
        completed = subprocess.run(command, cwd=work_dir, capture_output=True, text=True, timeout=90)
        if completed.returncode != 0 or not (work_dir / f"{tex_path.stem}.pdf").exists():
            detail = (completed.stdout + "\n" + completed.stderr)[-2000:]
            raise PdfGenerationError(f"pdflatex failed:\n{detail}")
        shutil.copy2(work_dir / f"{tex_path.stem}.pdf", output_path)
        return output_path
    finally:
        shutil.rmtree(work_dir, ignore_errors=True)


class PdfGenerator:
    """Object-oriented facade matching the other generators."""

    def __init__(self, latex_generator: LatexGenerator | None = None) -> None:
        self.latex_generator = latex_generator

    def generate(self, profile: CVProfile, output_path: Path) -> Path:
        return generate_pdf(profile, output_path, self.latex_generator)
