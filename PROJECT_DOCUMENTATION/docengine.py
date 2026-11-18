"""Shared document model, diagram drawing, and DOCX/HTML renderers."""

from __future__ import annotations

import html
import os
from dataclasses import dataclass, field

from PIL import Image, ImageDraw, ImageFont
from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Inches, Pt, RGBColor

META = {
    "title": "Indian Road Damage and Pothole Detection System Using Deep Learning",
    "product": "RoadScan AI",
    "student": "Tushar Ravidas Jarwal",
    "roll": "19",
    "guide": "Professor Ajay Patil",
    "program": "Master of Computer Applications (MCA) — Final Year",
    "year": "2026–2027",
    "month": "November 2026",
    "college_line": "College / Institute: ________________________________",
    "university_line": "University: ________________________________",
}


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    path = r"C:\Windows\Fonts\timesbd.ttf" if bold else r"C:\Windows\Fonts\times.ttf"
    if not os.path.exists(path):
        path = r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf"
    return ImageFont.truetype(path, size)


def wrap(draw: ImageDraw.ImageDraw, text: str, fnt, max_w: int) -> list[str]:
    lines: list[str] = []
    for paragraph in text.split("\n"):
        words = paragraph.split()
        if not words:
            lines.append("")
            continue
        current = words[0]
        for word in words[1:]:
            trial = current + " " + word
            if draw.textlength(trial, font=fnt) <= max_w:
                current = trial
            else:
                lines.append(current)
                current = word
        lines.append(current)
    return lines


def canvas(w: int, h: int, title: str) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    im = Image.new("RGB", (w, h), "#f8fafc")
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, w - 1, h - 1], outline="#0f2744", width=4)
    d.rectangle([0, 0, w, 72], fill="#0f2744")
    d.text((28, 18), title, fill="white", font=font(30, True))
    return im, d


def rounded_box(d, box, text, fill, outline="#1e3a5f", fg="#0f172a", size=20, title_size=None):
    d.rounded_rectangle(box, radius=16, fill=fill, outline=outline, width=3)
    x1, y1, x2, y2 = box
    fnt = font(title_size or size, True)
    lines = wrap(d, text, fnt, (x2 - x1) - 28)
    total_h = len(lines) * (fnt.size + 6)
    y = y1 + ((y2 - y1) - total_h) / 2
    for line in lines:
        tw = d.textlength(line, font=fnt)
        d.text((x1 + ((x2 - x1) - tw) / 2, y), line, fill=fg, font=fnt)
        y += fnt.size + 6


def arrow(d, start, end, color="#334155"):
    d.line([start, end], fill=color, width=4)
    ex, ey = end
    sx, sy = start
    if abs(ex - sx) >= abs(ey - sy):
        sign = 1 if ex >= sx else -1
        head = [(ex, ey), (ex - 14 * sign, ey - 8), (ex - 14 * sign, ey + 8)]
    else:
        sign = 1 if ey >= sy else -1
        head = [(ex, ey), (ex - 8, ey - 14 * sign), (ex + 8, ey - 14 * sign)]
    d.polygon(head, fill=color)


def save_diagram(im: Image.Image, folder: str, name: str) -> str:
    path = os.path.join(folder, name)
    im.save(path, "PNG")
    return path


def build_diagrams(folder: str) -> dict[str, str]:
    os.makedirs(folder, exist_ok=True)
    paths = {}
    paths["architecture"] = architecture(folder)
    paths["usecase"] = usecase(folder)
    paths["sequence"] = sequence(folder)
    paths["activity"] = activity(folder)
    paths["class"] = class_diagram(folder)
    paths["erd"] = erd(folder)
    paths["component"] = component(folder)
    paths["deployment"] = deployment(folder)
    paths["dfd0"] = dfd0(folder)
    paths["dfd1"] = dfd1(folder)
    paths["state"] = state_diagram(folder)
    return paths


def architecture(folder: str) -> str:
    im, d = canvas(1600, 980, "Figure 1 — Three-tier system architecture (RoadScan AI)")
    rounded_box(d, (80, 130, 1520, 250), "Presentation tier\nReact 19 + TypeScript + Vite + Tailwind CSS  |  Browser at http://localhost:5173", "#dbeafe")
    rounded_box(d, (80, 390, 1520, 560), "Application tier\nFlask REST API at http://localhost:5000  |  Ultralytics YOLOv8  |  OpenCV  |  FFmpeg (H.264)", "#dcfce7")
    rounded_box(d, (80, 700, 1520, 860), "Data tier\nSQLite detections.db  |  uploads/  |  outputs/  |  weight file YOLOv8_Small_RDD.pt (fallback best.pt)", "#ffedd5")
    arrow(d, (800, 250), (800, 390))
    arrow(d, (800, 560), (800, 700))
    d.text((860, 300), "JSON / multipart HTTP", fill="#0f172a", font=font(22, True))
    d.text((860, 620), "SQL and filesystem", fill="#0f172a", font=font(22, True))
    return save_diagram(im, folder, "01_architecture.png")


def usecase(folder: str) -> str:
    im, d = canvas(1600, 1180, "Figure 2 — Use case diagram")
    d.rounded_rectangle((430, 100, 1180, 1080), radius=18, outline="#1e3a5f", width=3)
    d.text((470, 112), "RoadScan AI", fill="#0f2744", font=font(22, True))
    d.ellipse((40, 500, 250, 680), fill="#e2e8f0", outline="#0f2744", width=3)
    label = "Surveyor\n/ Citizen"
    d.multiline_text((78, 555), label, fill="#0f172a", font=font(22, True), align="center")
    d.ellipse((1280, 180, 1520, 360), fill="#e2e8f0", outline="#0f2744", width=3)
    d.multiline_text((1335, 235), "YOLOv8\nModel", fill="#0f172a", font=font(22, True), align="center")
    cases = [
        "Register and login",
        "Detect image",
        "Detect video",
        "Live camera frame",
        "View history and analytics",
        "Map tracker and heatmap",
        "Update repair status",
        "Submit citizen complaint",
        "Print inspection report",
        "Check model health",
    ]
    model_linked = {"Detect image", "Detect video", "Live camera frame"}
    for i, name in enumerate(cases):
        y = 160 + i * 90
        d.rounded_rectangle((500, y, 1100, y + 68), radius=34, fill="#eff6ff", outline="#1d4ed8", width=3)
        tw = d.textlength(name, font=font(22, True))
        d.text((500 + (600 - tw) / 2, y + 18), name, fill="#0f172a", font=font(22, True))
        d.line([(250, y + 34), (500, y + 34)], fill="#64748b", width=3)
        if name in model_linked:
            arrow(d, (1100, y + 34), (1280, 270))
    return save_diagram(im, folder, "02_usecase.png")


def sequence(folder: str) -> str:
    im, d = canvas(1600, 980, "Figure 3 — Sequence: image detection")
    actors = [("User", 80), ("React UI", 480), ("Flask API", 880), ("YOLOv8", 1280)]
    centers = []
    for name, x in actors:
        rounded_box(d, (x, 110, x + 240, 190), name, "#dbeafe", size=22)
        cx = x + 120
        centers.append(cx)
        d.line([(cx, 190), (cx, 900)], fill="#94a3b8", width=2)
    steps = [
        (0, 1, "1. Choose image and options"),
        (1, 2, "2. POST /api/detect/image"),
        (2, 3, "3. predict (imgsz 640)"),
        (3, 2, "4. Boxes and scores"),
        (2, 1, "5. JSON and annotated JPEG"),
        (1, 0, "6. Show severity and risk"),
    ]
    y = 260
    label_font = font(20, True)
    for a, b, label in steps:
        arrow(d, (centers[a], y), (centers[b], y))
        tw = d.textlength(label, font=label_font)
        left = min(centers[a], centers[b])
        right = max(centers[a], centers[b])
        d.text((left + (right - left - tw) / 2, y - 34), label, fill="#0f172a", font=label_font)
        y += 100
    d.text((80, 920), "The API also inserts one row into the history table and writes the annotated JPEG under outputs/.", fill="#334155", font=font(20))
    return save_diagram(im, folder, "03_sequence_image.png")


def activity(folder: str) -> str:
    im, d = canvas(1200, 1100, "Figure 4 — Activity: analyse media")
    steps = [
        (360, 110, 840, 180, "Start: user opens Image, Video, or Live Camera"),
        (360, 220, 840, 290, "Backend health check"),
        (360, 330, 840, 400, "Model loaded?"),
        (360, 450, 840, 530, "Upload file / capture frame and optional location"),
        (360, 570, 840, 650, "Inference, severity heuristic, risk score"),
        (360, 690, 840, 760, "Save history? Live frames are not saved"),
        (360, 810, 840, 880, "Show annotated result, or a clear error"),
        (360, 930, 840, 1000, "End"),
    ]
    for i, (x1, y1, x2, y2, text) in enumerate(steps):
        fill = "#dcfce7" if i in (0, 7) else "#eff6ff"
        rounded_box(d, (x1, y1, x2, y2), text, fill, size=22)
        if i < len(steps) - 1:
            arrow(d, ((x1 + x2) // 2, y2), ((x1 + x2) // 2, steps[i + 1][1]))
    return save_diagram(im, folder, "04_activity.png")


def class_diagram(folder: str) -> str:
    im, d = canvas(1600, 980, "Figure 5 — Logical class / module diagram")
    boxes = [
        (40, 120, 500, 360, "AuthContext\nuser, login(), register()\nlogout(), updateProfile()\nstorage: roadscan_auth_user"),
        (540, 120, 1060, 360, "Api client (services/api.ts)\ndetectImage, detectVideo\ndetectFrame, fetchHistory\ncomplaints, repairs, heatmap"),
        (1100, 120, 1560, 360, "Flask app.py\nhealth, detect_*, history\ntracker, heatmap, repairs\ncomplaints, dashboard stats"),
        (40, 460, 500, 760, "Detection\nclass_name, confidence\nbbox, severity, timestamp"),
        (540, 460, 1060, 760, "HistoryRecord\nid, type, filename, total\nrisk_score, repair_status\nlatitude, longitude"),
        (1100, 460, 1560, 760, "YOLO runtime\nmodel.predict\npretty_class aliases\nseverity() and compute_risk()"),
        (420, 810, 1180, 930, "SQLite tables: history, complaints"),
    ]
    colors = ["#dbeafe", "#dbeafe", "#dcfce7", "#f1f5f9", "#f1f5f9", "#ffedd5", "#fef9c3"]
    for box, color in zip(boxes, colors):
        rounded_box(d, box[:4], box[4], color, size=22)
    return save_diagram(im, folder, "05_class.png")


def erd(folder: str) -> str:
    im, d = canvas(1600, 900, "Figure 6 — Entity-relationship diagram")
    rounded_box(
        d,
        (60, 180, 760, 760),
        "HISTORY\nPK id\ntype, filename, created_at\ntotal, severity, detections (JSON)\nresult_url\nlatitude, longitude, location_name\nrepair_status, risk_score, risk_category\nstatus_history, description\nowner_email, record_kind",
        "#dbeafe",
        size=22,
    )
    rounded_box(
        d,
        (860, 180, 1540, 760),
        "COMPLAINTS\nPK id\ncreated_at, owner_email\nfilename, photo_url\ndescription, location_name\nlatitude, longitude\nseverity, risk_score, risk_category\ndetections (JSON)\nrepair_status, status_history",
        "#ffedd5",
        size=22,
    )
    d.text((620, 820), "Both entities are independent. The tracker API unions rows that have valid coordinates.", fill="#334155", font=font(20))
    return save_diagram(im, folder, "06_erd.png")


def component(folder: str) -> str:
    im, d = canvas(1600, 860, "Figure 7 — Component diagram")
    items = [
        (40, 140, 480, 320, "UI shell\nAppLayout, Sidebar\nProtectedRoute"),
        (540, 140, 1040, 320, "Feature pages\nDashboard, Detect, Maps\nRepairs, Citizen, Analytics"),
        (1100, 140, 1560, 320, "Shared widgets\nDamageMap, SeverityBadge\nLocationFields, report.ts"),
        (40, 460, 480, 700, "Flask routes"),
        (540, 460, 1040, 700, "Inference pipeline\nOpenCV + YOLO + FFmpeg"),
        (1100, 460, 1560, 700, "Persistence\nSQLite + uploads + outputs"),
    ]
    for box in items:
        rounded_box(d, box[:4], box[4], "#eef2ff", size=24)
    return save_diagram(im, folder, "07_component.png")


def deployment(folder: str) -> str:
    im, d = canvas(1500, 820, "Figure 8 — Deployment diagram (local Windows demonstration)")
    rounded_box(d, (80, 180, 680, 640), "Developer workstation\nWindows 10\nNode.js + npm\nPython 3.12 virtual environment\nChrome or Edge", "#dbeafe", size=26)
    rounded_box(d, (820, 160, 1420, 360), "Vite dev server\nport 5173", "#dcfce7", size=26)
    rounded_box(d, (820, 440, 1420, 680), "Flask server\nhost 0.0.0.0 port 5000\nweights loaded in process", "#ffedd5", size=26)
    arrow(d, (680, 300), (820, 260))
    arrow(d, (680, 500), (820, 540))
    return save_diagram(im, folder, "08_deployment.png")


def dfd0(folder: str) -> str:
    im, d = canvas(1400, 700, "Figure 9 — Context diagram (DFD Level 0)")
    d.ellipse((80, 250, 320, 430), fill="#e2e8f0", outline="#0f2744", width=3)
    d.text((130, 310), "User", fill="#0f172a", font=font(28, True))
    rounded_box(d, (460, 220, 980, 470), "0\nRoadScan AI\nRoad damage detection system", "#dbeafe", size=28)
    d.ellipse((1080, 250, 1320, 430), fill="#e2e8f0", outline="#0f2744", width=3)
    d.text((1110, 310), "Weight file", fill="#0f172a", font=font(26, True))
    arrow(d, (320, 310), (460, 310))
    arrow(d, (460, 370), (320, 370))
    arrow(d, (980, 320), (1080, 320))
    d.text((330, 250), "media, complaint, status", fill="#0f172a", font=font(18))
    d.text((300, 400), "boxes, maps, reports", fill="#0f172a", font=font(18))
    d.text((980, 270), "class predictions", fill="#0f172a", font=font(18))
    return save_diagram(im, folder, "09_dfd0.png")


def dfd1(folder: str) -> str:
    im, d = canvas(1600, 980, "Figure 10 — DFD Level 1")
    nodes = [
        (80, 140, 460, 280, "1. Authenticate session"),
        (560, 140, 1040, 280, "2. Accept media"),
        (1120, 140, 1520, 280, "3. Run YOLOv8"),
        (80, 420, 460, 560, "4. Score severity and risk"),
        (560, 420, 1040, 560, "5. Persist history / complaint"),
        (1120, 420, 1520, 560, "6. Publish maps and analytics"),
        (420, 720, 1180, 880, "Data store D1: detections.db, uploads, outputs"),
    ]
    for box in nodes:
        rounded_box(d, box[:4], box[4], "#eff6ff", size=24)
    return save_diagram(im, folder, "10_dfd1.png")


def state_diagram(folder: str) -> str:
    im, d = canvas(1500, 520, "Figure 11 — Repair-status state diagram")
    states = ["reported", "assigned", "in_progress", "repaired"]
    x = 60
    for name in states:
        rounded_box(d, (x, 180, x + 280, 300), name, "#dcfce7", size=26)
        if x < 1100:
            arrow(d, (x + 280, 240), (x + 360, 240))
        x += 360
    d.text((80, 380), "PATCH /api/repairs/<detection|complaint>/<id> accepts only these four statuses and appends status_history.", fill="#0f172a", font=font(22))
    return save_diagram(im, folder, "11_state_repair.png")


@dataclass
class Block:
    kind: str
    text: str = ""
    items: list[str] = field(default_factory=list)
    headers: list[str] = field(default_factory=list)
    rows: list[list[str]] = field(default_factory=list)
    path: str = ""
    caption: str = ""


class Doc:
    def __init__(self, stem: str, doc_title: str, doc_kind: str):
        self.stem = stem
        self.doc_title = doc_title
        self.doc_kind = doc_kind
        self.blocks: list[Block] = []

    def h1(self, text: str):
        self.blocks.append(Block("h1", text))

    def h2(self, text: str):
        self.blocks.append(Block("h2", text))

    def h3(self, text: str):
        self.blocks.append(Block("h3", text))

    def p(self, text: str):
        self.blocks.append(Block("p", text.strip()))

    def bullets(self, items: list[str]):
        self.blocks.append(Block("bullets", items=items))

    def numbered(self, items: list[str]):
        self.blocks.append(Block("numbered", items=items))

    def table(self, headers: list[str], rows: list[list[str]]):
        self.blocks.append(Block("table", headers=headers, rows=rows))

    def image(self, path: str, caption: str):
        self.blocks.append(Block("image", path=path, caption=caption))

    def page(self):
        self.blocks.append(Block("page"))

    def note(self, text: str):
        self.blocks.append(Block("note", text.strip()))

    def code(self, text: str):
        self.blocks.append(Block("code", text.rstrip()))


def shade_cell(cell, hex_color: str):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), hex_color)
    shd.set(qn("w:val"), "clear")
    tcPr.append(shd)


def set_run_font(run, size=12, bold=False, color=None, name="Times New Roman"):
    run.font.name = name
    run._element.rPr.rFonts.set(qn("w:eastAsia"), name)
    run.font.size = Pt(size)
    run.bold = bold
    if color:
        run.font.color.rgb = RGBColor(*color)


def add_page_number(paragraph):
    run = paragraph.add_run()
    fld_begin = OxmlElement("w:fldChar")
    fld_begin.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = " PAGE "
    fld_end = OxmlElement("w:fldChar")
    fld_end.set(qn("w:fldCharType"), "end")
    run._r.append(fld_begin)
    run._r.append(instr)
    run._r.append(fld_end)
    set_run_font(run, 10)


def render_docx(doc: Doc, path: str):
    document = Document()
    section = document.sections[0]
    section.page_width = Cm(21.0)
    section.page_height = Cm(29.7)
    section.left_margin = Cm(1.8)
    section.right_margin = Cm(1.8)
    section.top_margin = Cm(1.8)
    section.bottom_margin = Cm(1.8)
    section.header_distance = Cm(0.6)
    section.footer_distance = Cm(0.6)
    header = section.header.paragraphs[0]
    header.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    run = header.add_run(f"{META['product']}  |  {doc.doc_kind}")
    set_run_font(run, 9, color=(71, 85, 105))
    footer = section.footer.paragraphs[0]
    footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r1 = footer.add_run(f"{META['student']}  ·  Roll No. {META['roll']}  ·  Page ")
    set_run_font(r1, 10)
    add_page_number(footer)
    normal = document.styles["Normal"]
    normal.font.name = "Times New Roman"
    normal.font.size = Pt(12)
    normal._element.rPr.rFonts.set(qn("w:eastAsia"), "Times New Roman")

    def cover_line(text, size=14, bold=False, center=True, space_before=0, space_after=6, color=None):
        p = document.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER if center else WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(space_before)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = 1.15
        run = p.add_run(text)
        set_run_font(run, size, bold, color)
        return p

    cover_line("A PROJECT REPORT", 14, True, space_before=12)
    cover_line("ON", 12, space_before=8)
    cover_line(META["title"], 18, True, space_before=10, space_after=8, color=(15, 39, 68))
    cover_line(f"({META['product']})", 14, True, space_after=10)
    cover_line(doc.doc_kind, 16, True, space_before=6, color=(30, 64, 175))
    cover_line("Submitted in partial fulfilment of the requirements for the degree of", 12, space_before=16)
    cover_line(META["program"], 13, True)
    cover_line(META["year"], 12, space_before=4)
    cover_line("Submitted by", 12, space_before=18)
    cover_line(META["student"], 14, True)
    cover_line(f"Roll Number: {META['roll']}", 12)
    cover_line("Under the guidance of", 12, space_before=14)
    cover_line(META["guide"], 14, True)
    cover_line(META["college_line"], 12, space_before=16)
    cover_line(META["university_line"], 12)
    cover_line(META["month"], 12, space_before=12)
    document.add_page_break()

    for block in doc.blocks:
        if block.kind == "page":
            document.add_page_break()
        elif block.kind in {"h1", "h2", "h3"}:
            size = {"h1": 16, "h2": 14, "h3": 13}[block.kind]
            p = document.add_paragraph()
            p.paragraph_format.space_before = Pt(14 if block.kind == "h1" else 10)
            p.paragraph_format.space_after = Pt(6)
            p.paragraph_format.keep_with_next = True
            run = p.add_run(block.text)
            set_run_font(run, size, True, (15, 39, 68))
        elif block.kind == "p":
            p = document.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            p.paragraph_format.space_after = Pt(8)
            p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.ONE_POINT_FIVE
            run = p.add_run(block.text)
            set_run_font(run, 12)
        elif block.kind == "note":
            p = document.add_paragraph()
            p.paragraph_format.space_after = Pt(8)
            run = p.add_run(block.text)
            set_run_font(run, 11, True, (30, 64, 175))
        elif block.kind in {"bullets", "numbered"}:
            style = "List Bullet" if block.kind == "bullets" else "List Number"
            for item in block.items:
                p = document.add_paragraph(style=style)
                p.paragraph_format.space_after = Pt(2)
                run = p.add_run(item)
                set_run_font(run, 12)
        elif block.kind == "table":
            table = document.add_table(rows=1, cols=len(block.headers))
            table.style = "Table Grid"
            for i, header in enumerate(block.headers):
                cell = table.rows[0].cells[i]
                cell.text = ""
                para = cell.paragraphs[0]
                run = para.add_run(header)
                set_run_font(run, 10, True, (255, 255, 255))
                shade_cell(cell, "0F2744")
            for row in block.rows:
                cells = table.add_row().cells
                for i, value in enumerate(row):
                    cells[i].text = ""
                    para = cells[i].paragraphs[0]
                    run = para.add_run(value)
                    set_run_font(run, 9)
            document.add_paragraph()
        elif block.kind == "image":
            p = document.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            run = p.add_run()
            run.add_picture(block.path, width=Inches(6.3))
            cap = document.add_paragraph()
            cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
            cap.paragraph_format.space_after = Pt(10)
            run = cap.add_run(block.caption)
            set_run_font(run, 11, True)
        elif block.kind == "code":
            p = document.add_paragraph()
            p.paragraph_format.space_after = Pt(8)
            run = p.add_run(block.text)
            set_run_font(run, 9, name="Consolas")
    document.core_properties.title = doc.doc_title
    document.core_properties.author = META["student"]
    document.core_properties.subject = META["title"]
    document.save(path)


HTML_SHELL = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>__TITLE__</title>
<style>
  @page { size: A4; margin: 16mm 15mm 18mm 15mm; }
  * { box-sizing: border-box; }
  body { margin: 0; color: #111827; font-family: "Times New Roman", Times, serif; font-size: 12pt; line-height: 1.45; }
  h1 { font-size: 16pt; color: #0f2744; margin: 18px 0 8px; page-break-after: avoid; }
  h2 { font-size: 14pt; color: #0f2744; margin: 14px 0 6px; page-break-after: avoid; }
  h3 { font-size: 13pt; color: #1e3a5f; margin: 12px 0 6px; page-break-after: avoid; }
  p { margin: 0 0 8px; text-align: justify; }
  ul, ol { margin: 0 0 10px 22px; }
  li { margin: 0 0 3px; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0 14px; page-break-inside: avoid; }
  th, td { border: 1px solid #334155; padding: 5px 6px; vertical-align: top; font-size: 10pt; text-align: left; }
  th { background: #0f2744; color: white; }
  img { width: 100%; height: auto; }
  figure { margin: 8px 0 14px; page-break-inside: avoid; }
  figcaption { text-align: center; font-weight: bold; font-size: 11pt; margin-top: 4px; }
  .note { color: #1e40af; font-weight: bold; }
  pre { font-family: Consolas, "Courier New", monospace; font-size: 9pt; background: #f1f5f9; border: 1px solid #cbd5e1; padding: 8px; white-space: pre-wrap; }
  .pagebreak { page-break-before: always; }
  .cover { page-break-after: always; min-height: 250mm; text-align: center; padding-top: 18mm; }
  .cover h1 { font-size: 18pt; text-align: center; }
  .muted { color: #334155; }
  .kind { color: #1e40af; font-size: 16pt; font-weight: bold; }
</style>
</head>
<body>
__BODY__
</body>
</html>
"""


def render_html(doc: Doc, path: str):
    parts = [f"""
    <section class="cover">
      <p><strong>A PROJECT REPORT</strong></p>
      <p>ON</p>
      <h1>{html.escape(META['title'])}</h1>
      <p><strong>({html.escape(META['product'])})</strong></p>
      <p class="kind">{html.escape(doc.doc_kind)}</p>
      <p>Submitted in partial fulfilment of the requirements for the degree of</p>
      <p><strong>{html.escape(META['program'])}</strong></p>
      <p>{html.escape(META['year'])}</p>
      <p style="margin-top:18px">Submitted by</p>
      <p><strong>{html.escape(META['student'])}</strong><br/>Roll Number: {html.escape(META['roll'])}</p>
      <p style="margin-top:14px">Under the guidance of</p>
      <p><strong>{html.escape(META['guide'])}</strong></p>
      <p style="margin-top:16px">{html.escape(META['college_line'])}<br/>{html.escape(META['university_line'])}</p>
      <p>{html.escape(META['month'])}</p>
    </section>
    """]
    for block in doc.blocks:
        if block.kind == "page":
            parts.append('<div class="pagebreak"></div>')
        elif block.kind in {"h1", "h2", "h3"}:
            parts.append(f"<{block.kind}>{html.escape(block.text)}</{block.kind}>")
        elif block.kind == "p":
            parts.append(f"<p>{html.escape(block.text)}</p>")
        elif block.kind == "note":
            parts.append(f"<p class='note'>{html.escape(block.text)}</p>")
        elif block.kind == "bullets":
            items = "".join(f"<li>{html.escape(i)}</li>" for i in block.items)
            parts.append(f"<ul>{items}</ul>")
        elif block.kind == "numbered":
            items = "".join(f"<li>{html.escape(i)}</li>" for i in block.items)
            parts.append(f"<ol>{items}</ol>")
        elif block.kind == "table":
            head = "".join(f"<th>{html.escape(h)}</th>" for h in block.headers)
            body = []
            for row in block.rows:
                body.append("<tr>" + "".join(f"<td>{html.escape(c)}</td>" for c in row) + "</tr>")
            parts.append(f"<table><thead><tr>{head}</tr></thead><tbody>{''.join(body)}</tbody></table>")
        elif block.kind == "image":
            src = block.path.replace("\\", "/")
            parts.append(f"<figure><img src='{html.escape(src)}'/><figcaption>{html.escape(block.caption)}</figcaption></figure>")
        elif block.kind == "code":
            parts.append(f"<pre>{html.escape(block.text)}</pre>")
    page = HTML_SHELL.replace("__TITLE__", html.escape(doc.doc_title)).replace("__BODY__", "\n".join(parts))
    with open(path, "w", encoding="utf-8") as handle:
        handle.write(page)
