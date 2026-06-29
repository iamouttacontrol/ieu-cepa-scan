"""
Build the offline PDF bundle for the web app.

Compresses every PDF in ``backend/documents/`` into ``mobile/public/pdfs/``
(preserving the folder structure) and writes a manifest to
``mobile/lib/documentManifest.json`` that the app uses to list/open documents
without contacting the backend.

Compression strategy (first available wins, per file):
  1. Ghostscript            -- best size reduction (downsamples images)
  2. PyMuPDF (fitz)         -- lossless clean + deflate, optional image downscale
  3. pypdf                  -- lossless content-stream recompression
  4. plain copy             -- last resort (no size reduction)

Usage:
    python -m scripts.build_offline_pdfs            # from backend/
    python backend/scripts/build_offline_pdfs.py    # from repo root

Options:
    --downscale       Re-encode large raster images (PyMuPDF only, lossy).
    --dpi N           Target DPI for downscaling (default 120).
    --quality N       JPEG quality for downscaled images (default 70).
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
import urllib.parse
from pathlib import Path

_BACKEND_DIR = Path(__file__).resolve().parent.parent
_REPO_ROOT = _BACKEND_DIR.parent

DOCUMENTS_DIR = _BACKEND_DIR / "documents"
OUT_DIR = _REPO_ROOT / "mobile" / "public" / "pdfs"
MANIFEST_PATH = _REPO_ROOT / "mobile" / "lib" / "documentManifest.json"


# --------------------------------------------------------------------------- #
# Compression backends
# --------------------------------------------------------------------------- #

def _find_ghostscript() -> str | None:
    for exe in ("gs", "gswin64c", "gswin32c"):
        if shutil.which(exe):
            return exe
    return None


def _compress_ghostscript(gs: str, src: Path, dst: Path) -> bool:
    try:
        subprocess.run(
            [
                gs, "-q", "-dNOPAUSE", "-dBATCH", "-dSAFER",
                "-sDEVICE=pdfwrite",
                "-dCompatibilityLevel=1.5",
                "-dPDFSETTINGS=/ebook",
                "-dDownsampleColorImages=true",
                "-dDownsampleGrayImages=true",
                "-dDownsampleMonoImages=true",
                f"-sOutputFile={dst}",
                str(src),
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        return dst.exists() and dst.stat().st_size > 0
    except Exception:
        return False


def _compress_pymupdf(src: Path, dst: Path, downscale: bool, dpi: int, quality: int) -> bool:
    try:
        import fitz  # PyMuPDF
    except ImportError:
        return False

    try:
        doc = fitz.open(str(src))
        if downscale:
            _downscale_images_pymupdf(fitz, doc, dpi, quality)
        doc.save(
            str(dst),
            garbage=4,
            deflate=True,
            deflate_images=True,
            deflate_fonts=True,
            clean=True,
        )
        doc.close()
        return dst.exists() and dst.stat().st_size > 0
    except Exception as exc:  # noqa: BLE001
        print(f"    [pymupdf failed: {exc}]", end=" ")
        return False


def _downscale_images_pymupdf(fitz, doc, target_dpi: int, quality: int) -> None:
    """Re-encode raster images that are rendered far above ``target_dpi``.

    Best-effort and lossy: each image failure is swallowed so the original
    image is kept. Skips images with an alpha channel / mask to avoid breaking
    transparency.
    """
    for page in doc:
        for img in page.get_images(full=True):
            xref = img[0]
            try:
                # Displayed size on the page (points -> inches via /72)
                rects = page.get_image_rects(xref)
                if not rects:
                    continue
                rect = rects[0]
                disp_w_in = rect.width / 72.0
                if disp_w_in <= 0:
                    continue

                base = doc.extract_image(xref)
                pix = fitz.Pixmap(doc, xref)
                if pix.alpha or pix.colorspace is None:
                    pix = None
                    continue

                cur_dpi = pix.width / disp_w_in
                if cur_dpi <= target_dpi * 1.15:
                    pix = None
                    continue

                scale = target_dpi / cur_dpi
                new_w = max(1, int(pix.width * scale))
                new_h = max(1, int(pix.height * scale))

                # Convert to RGB if needed, then shrink + JPEG re-encode
                if pix.n - pix.alpha >= 4:  # CMYK etc.
                    pix = fitz.Pixmap(fitz.csRGB, pix)
                factor = max(1, min(pix.width // new_w, pix.height // new_h))
                if factor > 1:
                    pix.shrink(factor.bit_length() - 1)
                img_bytes = pix.tobytes(output="jpg", jpg_quality=quality)
                pix = None
                if len(img_bytes) < len(base["image"]):
                    page.replace_image(xref, stream=img_bytes)
            except Exception:
                continue


def _compress_pypdf(src: Path, dst: Path) -> bool:
    try:
        from pypdf import PdfReader, PdfWriter
    except ImportError:
        return False
    try:
        reader = PdfReader(str(src))
        writer = PdfWriter()
        for page in reader.pages:
            writer.add_page(page)
        for page in writer.pages:
            try:
                page.compress_content_streams()
            except Exception:
                pass
        try:
            writer.compress_identical_objects(remove_identicals=True, remove_orphans=True)
        except Exception:
            pass
        with open(dst, "wb") as fh:
            writer.write(fh)
        return dst.exists() and dst.stat().st_size > 0
    except Exception:
        return False


# --------------------------------------------------------------------------- #
# Manifest helpers
# --------------------------------------------------------------------------- #

def _display_name(pdf_path: Path) -> str:
    decoded = urllib.parse.unquote(pdf_path.stem)
    return decoded.replace("_", " ").strip()


def _web_url(rel_path: str) -> str:
    encoded = "/".join(urllib.parse.quote(seg) for seg in rel_path.split("/"))
    return f"/pdfs/{encoded}"


# --------------------------------------------------------------------------- #
# Main
# --------------------------------------------------------------------------- #

def main() -> None:
    parser = argparse.ArgumentParser(description="Build the offline PDF bundle.")
    parser.add_argument("--downscale", action="store_true",
                        help="Re-encode large raster images (PyMuPDF only, lossy).")
    parser.add_argument("--dpi", type=int, default=120, help="Target DPI for downscaling.")
    parser.add_argument("--quality", type=int, default=70, help="JPEG quality for downscaled images.")
    args = parser.parse_args()

    if not DOCUMENTS_DIR.exists():
        print(f"ERROR: {DOCUMENTS_DIR} not found.")
        sys.exit(1)

    pdf_files = sorted(DOCUMENTS_DIR.rglob("*.pdf"))
    if not pdf_files:
        print(f"No PDFs found in {DOCUMENTS_DIR}.")
        sys.exit(1)

    gs = _find_ghostscript()
    try:
        import fitz  # noqa: F401
        has_pymupdf = True
    except ImportError:
        has_pymupdf = False

    print(f"Documents : {DOCUMENTS_DIR}")
    print(f"Output    : {OUT_DIR}")
    print(f"Backends  : ghostscript={'yes' if gs else 'no'}  "
          f"pymupdf={'yes' if has_pymupdf else 'no'}  downscale={'yes' if args.downscale else 'no'}")
    print(f"Files     : {len(pdf_files)}\n")

    # Fresh output directory so removed source files don't linger
    if OUT_DIR.exists():
        shutil.rmtree(OUT_DIR)
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    manifest: list[dict] = []
    total_src = 0
    total_out = 0

    for pdf_path in pdf_files:
        rel = pdf_path.relative_to(DOCUMENTS_DIR)
        rel_str = str(rel).replace("\\", "/")
        dst = OUT_DIR / rel
        dst.parent.mkdir(parents=True, exist_ok=True)

        src_size = pdf_path.stat().st_size
        total_src += src_size
        print(f"  {rel_str} ...", end=" ", flush=True)

        ok = False
        backend = "copy"
        if gs and _compress_ghostscript(gs, pdf_path, dst):
            ok, backend = True, "gs"
        if not ok and has_pymupdf and _compress_pymupdf(pdf_path, dst, args.downscale, args.dpi, args.quality):
            ok, backend = True, "pymupdf"
        if not ok and _compress_pypdf(pdf_path, dst):
            ok, backend = True, "pypdf"
        if not ok:
            shutil.copy2(pdf_path, dst)
            backend = "copy"

        # Never ship a file larger than the original
        out_size = dst.stat().st_size
        if out_size >= src_size:
            shutil.copy2(pdf_path, dst)
            out_size = dst.stat().st_size
            backend = f"{backend}->copy"

        total_out += out_size
        manifest.append({
            "filename": rel_str,
            "name": _display_name(pdf_path),
            "size_kb": max(1, round(out_size / 1024)),
            "url": _web_url(rel_str),
        })
        print(f"{backend}  {src_size // 1024} -> {out_size // 1024} KB")

    manifest.sort(key=lambda d: d["filename"])
    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"\nManifest  : {MANIFEST_PATH} ({len(manifest)} entries)")
    print(f"Total     : {total_src // (1024 * 1024)} MB -> {total_out // (1024 * 1024)} MB "
          f"({100 * total_out // max(1, total_src)}% of original)")


if __name__ == "__main__":
    main()
