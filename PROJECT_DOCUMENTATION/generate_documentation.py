"""Generate DOCX and PDF copies of the MCA document set."""

import os
import subprocess
import sys
import tempfile

from build_documents import all_documents
from docengine import build_diagrams, render_docx, render_html

ROOT = os.path.dirname(os.path.abspath(__file__))
DIAGRAMS = os.path.join(ROOT, "diagrams")
HTML_DIR = os.path.join(ROOT, "_html")
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"


def to_pdf(html_path: str, pdf_path: str):
    if os.path.exists(pdf_path):
        os.remove(pdf_path)
    profile = tempfile.mkdtemp(prefix="rdd-pdf-")
    file_url = "file:///" + html_path.replace("\\", "/")
    cmd = [
        CHROME,
        "--headless=new",
        "--disable-gpu",
        "--no-pdf-header-footer",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-extensions",
        f"--user-data-dir={profile}",
        f"--print-to-pdf={pdf_path}",
        file_url,
    ]
    completed = subprocess.run(cmd, capture_output=True, text=True, timeout=90)
    if not os.path.exists(pdf_path) or os.path.getsize(pdf_path) < 1000:
        sys.stderr.write(completed.stdout[-2000:])
        sys.stderr.write(completed.stderr[-2000:])
        raise SystemExit(f"PDF failed for {html_path} (code {completed.returncode})")


def main():
    os.makedirs(HTML_DIR, exist_ok=True)
    diagrams = build_diagrams(DIAGRAMS)
    documents = all_documents(diagrams)
    for doc in documents:
        docx_path = os.path.join(ROOT, doc.stem + ".docx")
        html_path = os.path.join(HTML_DIR, doc.stem + ".html")
        pdf_path = os.path.join(ROOT, doc.stem + ".pdf")
        render_docx(doc, docx_path)
        render_html(doc, html_path)
        to_pdf(html_path, pdf_path)
        print(f"OK {doc.stem} docx={os.path.getsize(docx_path)} pdf={os.path.getsize(pdf_path)}")


if __name__ == "__main__":
    main()
