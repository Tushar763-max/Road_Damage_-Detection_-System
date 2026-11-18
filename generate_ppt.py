import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

def create_deck():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    DARK_BG = RGBColor(10, 16, 28)       # #0a101c
    CARD_BG = RGBColor(15, 23, 42)       # #0f172a
    ACCENT_BLUE = RGBColor(59, 130, 246) # #3b82f6
    TEXT_WHITE = RGBColor(248, 250, 252) # #f8fafc
    TEXT_MUTED = RGBColor(148, 163, 184) # #94a3b8
    ACCENT_RED = RGBColor(239, 68, 68)   # #ef4444
    ACCENT_GREEN = RGBColor(34, 197, 94) # #22c55e

    def set_slide_background(slide):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
        bg.fill.solid()
        bg.fill.fore_color.rgb = DARK_BG
        bg.line.fill.background()
        return bg

    def add_header(slide, title_text, category_text="MCA FINAL YEAR PROJECT"):
        cat_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.5), Inches(11.7), Inches(0.4))
        tf_cat = cat_box.text_frame
        tf_cat.word_wrap = True
        p_cat = tf_cat.paragraphs[0]
        p_cat.text = category_text.upper()
        p_cat.font.size = Pt(11)
        p_cat.font.bold = True
        p_cat.font.color.rgb = ACCENT_BLUE

        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.85), Inches(11.7), Inches(0.8))
        tf_t = title_box.text_frame
        tf_t.word_wrap = True
        p_t = tf_t.paragraphs[0]
        p_t.text = title_text
        p_t.font.size = Pt(24)
        p_t.font.bold = True
        p_t.font.color.rgb = TEXT_WHITE

    # SLIDE 1: TITLE SLIDE
    s1 = prs.slides.add_slide(blank_layout)
    set_slide_background(s1)

    tag = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.2), Inches(4.2), Inches(0.45))
    tag.fill.solid()
    tag.fill.fore_color.rgb = RGBColor(30, 58, 138)
    tag.line.color.rgb = ACCENT_BLUE
    tf_tag = tag.text_frame
    p_tag = tf_tag.paragraphs[0]
    p_tag.alignment = PP_ALIGN.CENTER
    p_tag.text = "MCA FINAL YEAR MAJOR PROJECT"
    p_tag.font.size = Pt(12)
    p_tag.font.bold = True
    p_tag.font.color.rgb = RGBColor(147, 197, 253)

    tbox = s1.shapes.add_textbox(Inches(0.8), Inches(1.8), Inches(11.7), Inches(2.2))
    tf = tbox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "Indian Road Damage & Pothole Detection System Using Deep Learning"
    p.font.size = Pt(36)
    p.font.bold = True
    p.font.color.rgb = TEXT_WHITE

    p2 = tf.add_paragraph()
    p2.text = "Real-Time Computer Vision Pipeline · YOLOv8 Neural Architecture · Interactive Geospatial GIS Analytics"
    p2.font.size = Pt(16)
    p2.font.color.rgb = ACCENT_BLUE
    p2.space_before = Pt(12)

    # Student Card
    c1 = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(4.5), Inches(5.6), Inches(2.2))
    c1.fill.solid()
    c1.fill.fore_color.rgb = CARD_BG
    c1.line.color.rgb = RGBColor(30, 41, 59)
    tf1 = c1.text_frame
    tf1.word_wrap = True
    p1 = tf1.paragraphs[0]
    p1.text = "STUDENT DETAILS"
    p1.font.size = Pt(12)
    p1.font.bold = True
    p1.font.color.rgb = ACCENT_BLUE

    lines1 = [
        "Student: Tushar Ravidas Jarwal",
        "Roll No: 19",
        "Degree: Master of Computer Applications (MCA)",
        "Specialization: Deep Learning & Web Systems"
    ]
    for line in lines1:
        pl = tf1.add_paragraph()
        pl.text = line
        pl.font.size = Pt(13)
        pl.font.color.rgb = TEXT_WHITE
        pl.space_before = Pt(4)

    # Guide Card
    c2 = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.9), Inches(4.5), Inches(5.6), Inches(2.2))
    c2.fill.solid()
    c2.fill.fore_color.rgb = CARD_BG
    c2.line.color.rgb = RGBColor(30, 41, 59)
    tf2 = c2.text_frame
    tf2.word_wrap = True
    p2 = tf2.paragraphs[0]
    p2.text = "PROJECT SUPERVISION"
    p2.font.size = Pt(12)
    p2.font.bold = True
    p2.font.color.rgb = ACCENT_BLUE

    lines2 = [
        "Project Guide: Professor Ajay Patil",
        "Department: Computer Applications",
        "Academic Year: 2025 – 2026",
        "Domain: Computer Vision / Intelligent Transportation"
    ]
    for line in lines2:
        pl = tf2.add_paragraph()
        pl.text = line
        pl.font.size = Pt(13)
        pl.font.color.rgb = TEXT_WHITE
        pl.space_before = Pt(4)

    # SLIDE 2: EXECUTIVE SUMMARY & PROBLEM STATEMENT
    s2 = prs.slides.add_slide(blank_layout)
    set_slide_background(s2)
    add_header(s2, "Executive Summary & Problem Statement", "BACKGROUND & CONTEXT")

    b1 = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.8), Inches(5.6), Inches(5.0))
    b1.fill.solid()
    b1.fill.fore_color.rgb = CARD_BG
    b1.line.color.rgb = RGBColor(30, 41, 59)
    tb1 = b1.text_frame
    tb1.word_wrap = True
    p = tb1.paragraphs[0]
    p.text = "CRITICAL PROBLEM STATEMENT"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = ACCENT_RED

    problems = [
        "Road Deterioration in India: Potholes and complex crack patterns cause thousands of fatal accidents and vehicle damage annually.",
        "Manual Survey Bottlenecks: Visual road audits conducted manually by municipal corporations are slow, expensive, and subjective.",
        "Delayed Public Reporting: Citizens lack a frictionless digital mechanism to report potholes with automated AI verification and location tracking.",
        "Lack of Unified GIS & Severity Metric: Municipal engineers lack an automated risk scoring metric (0-100) to prioritize road repaving orders efficiently."
    ]
    for pr in problems:
        pt = tb1.add_paragraph()
        pt.text = "• " + pr
        pt.font.size = Pt(12)
        pt.font.color.rgb = TEXT_MUTED
        pt.space_before = Pt(12)

    b2 = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.9), Inches(1.8), Inches(5.6), Inches(5.0))
    b2.fill.solid()
    b2.fill.fore_color.rgb = CARD_BG
    b2.line.color.rgb = RGBColor(30, 41, 59)
    tb2 = b2.text_frame
    tb2.word_wrap = True
    p = tb2.paragraphs[0]
    p.text = "OUR PROPOSED SOLUTION"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = ACCENT_GREEN

    solutions = [
        "Deep Learning Vision Pipeline: Custom YOLOv8 model trained to detect potholes (D40) and Indian road crack classes (D00, D10, D20).",
        "Multi-Modal Input Support: Real-time inference across single road photographs, recorded dashcam video clips, and live camera feed.",
        "Live Geospatial GIS Tracking: Leaflet & OpenStreetMap live tracker with severity color codes (Red/Orange/Green) and density heatmap.",
        "End-to-End Governance: Complete repair lifecycle workflow (Reported -> Assigned -> In Progress -> Repaired), citizen portal, and instant PDF inspection reports."
    ]
    for sl in solutions:
        pt = tb2.add_paragraph()
        pt.text = "✓ " + sl
        pt.font.size = Pt(12)
        pt.font.color.rgb = TEXT_WHITE
        pt.space_before = Pt(12)

    # SLIDE 3: SYSTEM ARCHITECTURE
    s3 = prs.slides.add_slide(blank_layout)
    set_slide_background(s3)
    add_header(s3, "System Architecture & Data Flow", "TECHNICAL DESIGN")

    cards = [
        ("1. CLIENT TIER", "React 19 + TypeScript\nVite + Tailwind CSS v4\nLeaflet GIS Mapping\nRecharts Visualization\nBrowser Geolocation API", Inches(0.8), ACCENT_BLUE),
        ("2. API & INFERENCE", "Python Flask REST API\nGunicorn Production WSGI\nOpenCV Preprocessing\nUltralytics YOLOv8 Pipeline\nDynamic Port Binding", Inches(3.8), RGBColor(168, 85, 247)),
        ("3. MODEL ENGINE", "YOLOv8 Small RDD Weights\nBounding Box Regression\nConfidence Filtering\nHeuristic Severity Scoring\nRisk Algorithm (0-100)", Inches(6.8), ACCENT_RED),
        ("4. STORAGE & AUDIT", "SQLite Database\n(detections.db)\nRepair Audit Log\nCitizen Complaints Log\nMedia Output Storage", Inches(9.8), ACCENT_GREEN),
    ]

    for title, desc, left, col in cards:
        c = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, Inches(1.8), Inches(2.7), Inches(4.8))
        c.fill.solid()
        c.fill.fore_color.rgb = CARD_BG
        c.line.color.rgb = col
        c.line.width = Pt(1.5)
        tf = c.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(14)
        p.font.bold = True
        p.font.color.rgb = col
        
        for line in desc.split("\n"):
            pl = tf.add_paragraph()
            pl.text = "• " + line
            pl.font.size = Pt(12)
            pl.font.color.rgb = TEXT_WHITE
            pl.space_before = Pt(8)

    # SLIDE 4: DEEP LEARNING MODEL & DATASET
    s4 = prs.slides.add_slide(blank_layout)
    set_slide_background(s4)
    add_header(s4, "Deep Learning Model & Class Classification", "CORE AI ARCHITECTURE")

    left_box = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.8), Inches(5.6), Inches(5.0))
    left_box.fill.solid()
    left_box.fill.fore_color.rgb = CARD_BG
    left_box.line.color.rgb = RGBColor(30, 41, 59)
    tfl = left_box.text_frame
    tfl.word_wrap = True
    p = tfl.paragraphs[0]
    p.text = "YOLOv8 NEURAL ARCHITECTURE"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = ACCENT_BLUE

    points_l = [
        "Architecture: Ultralytics YOLOv8 (You Only Look Once - v8).",
        "Backbone & Neck: CSPDarknet with PAN-FPN feature pyramid network.",
        "Anchor-Free Detection: Direct prediction of bounding box centers and dimensions, accelerating CPU/GPU inference.",
        "Model Selected: YOLOv8_Small_RDD.pt (~89.5 MB) providing optimal balance of real-time latency (30-60 ms) and high mAP.",
        "Inference Optimizations: Dynamic stride skipping for video processing, automatic frame resizing, and non-maximum suppression (NMS)."
    ]
    for pt in points_l:
        pl = tfl.add_paragraph()
        pl.text = "• " + pt
        pl.font.size = Pt(12)
        pl.font.color.rgb = TEXT_MUTED
        pl.space_before = Pt(10)

    right_box = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.9), Inches(1.8), Inches(5.6), Inches(5.0))
    right_box.fill.solid()
    right_box.fill.fore_color.rgb = CARD_BG
    right_box.line.color.rgb = RGBColor(30, 41, 59)
    tfr = right_box.text_frame
    tfr.word_wrap = True
    p = tfr.paragraphs[0]
    p.text = "ROAD DAMAGE CLASSIFICATION SCHEMA"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = ACCENT_BLUE

    classes = [
        ("D40: Pothole", "Severe depression in road asphalt; highest risk factor for two-wheelers and passenger vehicles."),
        ("D00: Longitudinal Crack", "Linear cracks parallel to the road centerline; indicative of sub-base fatigue or joint issues."),
        ("D10: Transverse Crack", "Cracks perpendicular to pavement centerline caused by temperature contraction and shrinkage."),
        ("D20: Alligator Crack", "Interconnected polygonal fatigue cracks resembling reptile skin; indicates structural load breakdown."),
        ("D43 / D44: Blur / Wear", "Degradation of pedestrian crosswalks and painted lane markers affecting traffic navigation.")
    ]
    for c_title, c_desc in classes:
        pl = tfr.add_paragraph()
        pl.text = "▶ " + c_title
        pl.font.size = Pt(12)
        pl.font.bold = True
        pl.font.color.rgb = RGBColor(253, 224, 71)
        pl.space_before = Pt(8)
        pld = tfr.add_paragraph()
        pld.text = c_desc
        pld.font.size = Pt(11)
        pld.font.color.rgb = TEXT_MUTED

    # SLIDE 5: MODULES & CAPABILITIES
    s5 = prs.slides.add_slide(blank_layout)
    set_slide_background(s5)
    add_header(s5, "Comprehensive System Modules", "FUNCTIONAL HIGHLIGHTS")

    feats = [
        ("1. Image Detection", "Upload road photos; tunable confidence slider (0.1-0.9); side-by-side comparison; GPS tagging.", Inches(0.8), Inches(1.8)),
        ("2. Video Detection", "Processes MP4/AVI clips; OpenCV stride skipping; playable H.264 preview with downloadable output.", Inches(4.8), Inches(1.8)),
        ("3. Live Camera", "Accesses device webcams; continuous 2-sec inference interval; real-time box overlay and FPS tracking.", Inches(8.8), Inches(1.8)),
        ("4. Live GIS Tracker", "Interactive Leaflet map; OpenStreetMap layer; Red/Orange/Green severity markers; Nominatim geocoding.", Inches(0.8), Inches(4.4)),
        ("5. Heatmap Analytics", "Geographical clustering; highlights high-density pothole corridors; city & date filters.", Inches(4.8), Inches(4.4)),
        ("6. Citizen Portal & Reports", "Citizen road complaint submission with photos; repair status tracking; 1-click PDF inspection report.", Inches(8.8), Inches(4.4)),
    ]

    for title, desc, left, top in feats:
        c = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, Inches(3.7), Inches(2.3))
        c.fill.solid()
        c.fill.fore_color.rgb = CARD_BG
        c.line.color.rgb = RGBColor(30, 41, 59)
        tf = c.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = ACCENT_BLUE

        pd = tf.add_paragraph()
        pd.text = desc
        pd.font.size = Pt(11)
        pd.font.color.rgb = TEXT_MUTED
        pd.space_before = Pt(6)

    # SLIDE 6: ROAD RISK SCORING & GOVERNANCE
    s6 = prs.slides.add_slide(blank_layout)
    set_slide_background(s6)
    add_header(s6, "Road Risk Scoring & Civic Governance", "DECISION SUPPORT")

    b1 = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.8), Inches(5.6), Inches(5.0))
    b1.fill.solid()
    b1.fill.fore_color.rgb = CARD_BG
    b1.line.color.rgb = RGBColor(30, 41, 59)
    tb1 = b1.text_frame
    tb1.word_wrap = True
    p = tb1.paragraphs[0]
    p.text = "ROAD RISK SCORING ALGORITHM (0–100)"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = ACCENT_BLUE

    r_points = [
        "Mathematical Model: Risk = f(Damage Count, Class Severity Weights, Bounding Box Surface Area).",
        "Heuristic Weights: Pothole (1.5x) > Alligator Crack (1.3x) > Longitudinal/Transverse Crack (1.0x).",
        "Visual Semicircular Gauge: Custom SVG speedometer representing risk tiers:",
        "  • 0 – 25: Safe (Green)",
        "  • 26 – 50: Low Risk (Yellow)",
        "  • 51 – 75: Medium Risk (Amber)",
        "  • 76 – 100: High Risk (Red)",
        "Civic Impact: Enables PWD and municipal road engineers to allocate paving budgets based on scientific empirical risk rather than manual guesswork."
    ]
    for pt in r_points:
        pl = tb1.add_paragraph()
        pl.text = pt
        pl.font.size = Pt(11.5)
        pl.font.color.rgb = TEXT_WHITE
        pl.space_before = Pt(8)

    b2 = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.9), Inches(1.8), Inches(5.6), Inches(5.0))
    b2.fill.solid()
    b2.fill.fore_color.rgb = CARD_BG
    b2.line.color.rgb = RGBColor(30, 41, 59)
    tb2 = b2.text_frame
    tb2.word_wrap = True
    p = tb2.paragraphs[0]
    p.text = "ROAD REPAIR LIFECYCLE MANAGEMENT"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = ACCENT_BLUE

    steps = [
        ("Step 1: Reported", "Detection saved via AI camera inspection or citizen mobile upload with GPS location."),
        ("Step 2: Assigned", "Municipal road engineer or contractor is allocated work order for inspection & patch work."),
        ("Step 3: In Progress", "Paving/resurfacing crew dispatched on-site; status tracked with timestamped audit notes."),
        ("Step 4: Repaired", "Road damage closed out; verified clear upon subsequent vehicle scanner drive-by."),
        ("Urgent High-Severity Queue", "Automated priority alert section isolating unresolved high-severity potholes.")
    ]
    for s_title, s_desc in steps:
        pl = tb2.add_paragraph()
        pl.text = "▶ " + s_title
        pl.font.size = Pt(12)
        pl.font.bold = True
        pl.font.color.rgb = RGBColor(147, 197, 253)
        pl.space_before = Pt(6)
        pld = tb2.add_paragraph()
        pld.text = s_desc
        pld.font.size = Pt(11)
        pld.font.color.rgb = TEXT_MUTED

    # SLIDE 7: RESULTS, EVALUATION & CONCLUSION
    s7 = prs.slides.add_slide(blank_layout)
    set_slide_background(s7)
    add_header(s7, "Results, Evaluation & Future Scope", "CONCLUSION & VIVA HIGHLIGHTS")

    res_box = s7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.8), Inches(5.6), Inches(5.0))
    res_box.fill.solid()
    res_box.fill.fore_color.rgb = CARD_BG
    res_box.line.color.rgb = RGBColor(30, 41, 59)
    tfr = res_box.text_frame
    tfr.word_wrap = True
    p = tfr.paragraphs[0]
    p.text = "PROJECT RESULTS & PERFORMANCE"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = ACCENT_GREEN

    res_pts = [
        "Inference Speed: ~35–65 ms on GPU, ~120–250 ms on multi-threaded modern CPU.",
        "Class Detection Accuracy: High precision on prominent potholes (D40) and alligator cracks (D20).",
        "Geospatial Mapping: 100% accurate pin-drop localization with browser GPS and OpenStreetMap.",
        "Engineering Reports: Automated instant PDF inspection generation with original/annotated imagery, GPS link, and repair audit trail.",
        "Zero-Error Build: Production frontend bundle compiled cleanly with Vite + TypeScript."
    ]
    for pt in res_pts:
        pl = tfr.add_paragraph()
        pl.text = "✓ " + pt
        pl.font.size = Pt(12)
        pl.font.color.rgb = TEXT_WHITE
        pl.space_before = Pt(10)

    fut_box = s7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.9), Inches(1.8), Inches(5.6), Inches(5.0))
    fut_box.fill.solid()
    fut_box.fill.fore_color.rgb = CARD_BG
    fut_box.line.color.rgb = RGBColor(30, 41, 59)
    tff = fut_box.text_frame
    tff.word_wrap = True
    p = tff.paragraphs[0]
    p.text = "FUTURE ROADMAP & VIVA HIGHLIGHTS"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = ACCENT_BLUE

    fut_pts = [
        "Edge AI / Edge TPU Deployment: Deploying quantized YOLOv8 models onto Raspberry Pi 5 or NVIDIA Jetson mounted on municipal garbage trucks.",
        "Depth Sensor / LiDAR Integration: Combining RGB camera feeds with depth sensors to measure physical pothole volume and asphalt fill requirements.",
        "Drone (UAV) Aerial Survey: Autonomous aerial drone mapping for national highway corridors.",
        "Enterprise Multi-Tenant Backend: Migration from SQLite to distributed PostgreSQL / PostGIS with Supabase authentication."
    ]
    for pt in fut_pts:
        pl = tff.add_paragraph()
        pl.text = "• " + pt
        pl.font.size = Pt(12)
        pl.font.color.rgb = TEXT_MUTED
        pl.space_before = Pt(10)

    # SLIDE 8: THANK YOU & Q&A
    s8 = prs.slides.add_slide(blank_layout)
    set_slide_background(s8)

    tbox = s8.shapes.add_textbox(Inches(0.8), Inches(2.2), Inches(11.7), Inches(3.0))
    tf = tbox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    p.text = "THANK YOU!"
    p.font.size = Pt(44)
    p.font.bold = True
    p.font.color.rgb = TEXT_WHITE

    p2 = tf.add_paragraph()
    p2.alignment = PP_ALIGN.CENTER
    p2.text = "Indian Road Damage & Pothole Detection System Using Deep Learning"
    p2.font.size = Pt(20)
    p2.font.bold = True
    p2.font.color.rgb = ACCENT_BLUE
    p2.space_before = Pt(14)

    p3 = tf.add_paragraph()
    p3.alignment = PP_ALIGN.CENTER
    p3.text = "Student: Tushar Ravidas Jarwal (Roll No. 19)   |   Project Guide: Professor Ajay Patil"
    p3.font.size = Pt(15)
    p3.font.color.rgb = TEXT_MUTED
    p3.space_before = Pt(10)

    p4 = tf.add_paragraph()
    p4.alignment = PP_ALIGN.CENTER
    p4.text = "Open for Questions & Live Demonstration"
    p4.font.size = Pt(16)
    p4.font.bold = True
    p4.font.color.rgb = RGBColor(253, 224, 71)
    p4.space_before = Pt(16)

    output_path = os.path.join(r"C:\Users\Admin\Downloads\RoadDamageDetection\documentation", "Road_Damage_Detection_Presentation.pptx")
    prs.save(output_path)
    print("Presentation saved successfully at:", output_path)

if __name__ == "__main__":
    create_deck()
