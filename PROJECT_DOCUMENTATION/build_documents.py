"""Narrative content for the MCA document set. Facts follow the RoadScan AI source."""

from docengine import META, Doc


def front_common(doc: Doc):
    doc.h1("Certificate")
    doc.p(
        f"This is to certify that {META['student']} (Roll Number {META['roll']}) has completed the project "
        f"titled “{META['title']}” ({META['product']}) under the guidance of {META['guide']} in partial "
        f"fulfilment of the requirements of {META['program']} for the academic year {META['year']}."
    )
    doc.p(
        "The work is a full-stack demonstration system. Detection results shown by the application come from "
        "the loaded YOLOv8 weight file. Severity and risk values are visual estimates produced by the software "
        "rules described in this document. They are not a certified civil-engineering measurement of pavement condition."
    )
    doc.p("Guide: ___________________________          Head of Department: ___________________________")
    doc.p("Date: ________________    Place: ________________")
    doc.h1("Declaration")
    doc.p(
        f"I, {META['student']}, declare that this project report and the accompanying software are my original "
        "work carried out for the MCA final-year project. Sources of tools, libraries, and published research "
        "are acknowledged. I have not copied another student’s project."
    )
    doc.p(f"Signature of the student: ___________________________     Roll No. {META['roll']}")
    doc.h1("Acknowledgement")
    doc.p(
        f"I thank {META['guide']} for guidance during analysis, design, and demonstration of this project. "
        "I also thank the department for the opportunity to present a practical system that combines a web "
        "dashboard with a deep-learning inference service. Open-source projects used in the implementation "
        "include React, Vite, Flask, OpenCV, Ultralytics YOLOv8, SQLite, Leaflet, and Recharts."
    )


def report(diagrams: dict) -> Doc:
    doc = Doc("01_Complete_Project_Report", META["title"] + " — Project Report", "Complete Project Report")
    front_common(doc)
    doc.h1("Abstract")
    doc.p(
        "Indian roads accumulate potholes, longitudinal cracks, transverse cracks, and alligator cracking. "
        "Manual inspection is slow and the record of a defect often stays on paper or in a photograph without "
        "a consistent location, severity tag, or repair trail. RoadScan AI is a web system that accepts a road "
        "image, a short video, a live camera frame, or a citizen complaint, runs a YOLOv8 detector, draws "
        "bounding boxes, estimates severity from the box area and class, computes a 0–100 risk score, and "
        "stores the record in SQLite. A React dashboard then shows history, charts, a map of stored coordinates, "
        "a damage heatmap, a repair workflow, and a printable inspection report."
    )
    doc.p(
        "The frontend is React 19 with TypeScript, Vite, and Tailwind CSS. The backend is Flask with "
        "Ultralytics, OpenCV, and imageio-ffmpeg. The default weight file is backend/YOLOv8_Small_RDD.pt. "
        "If that file is absent, the server loads backend/best.pt. An environment variable MODEL_PATH overrides both. "
        "Login is a local browser session used to protect the dashboard during demonstration. It is not a server-side "
        "user directory. The project is intended for academic demonstration and municipal-style workflow practice, "
        "not as a production traffic-safety system."
    )
    doc.h1("Table of contents")
    doc.numbered([
        "Chapter 1  Introduction",
        "Chapter 2  Literature review and existing practice",
        "Chapter 3  System analysis and requirements",
        "Chapter 4  System design",
        "Chapter 5  Implementation",
        "Chapter 6  Testing summary",
        "Chapter 7  Results and discussion",
        "Chapter 8  Conclusion and future scope",
        "References",
        "Appendix A  REST API catalogue",
        "Appendix B  Screen catalogue",
    ])
    doc.page()

    doc.h1("Chapter 1 — Introduction")
    doc.h2("1.1 Background")
    doc.p(
        "Road agencies and municipal wards need a repeatable way to notice surface damage. A photograph from a "
        "phone already contains most of the visual evidence, but a folder of photographs does not answer which "
        "frame contained a pothole, how confident the detector was, whether the defect is small or large in the "
        "frame, or whether a crew has been assigned. RoadScan AI keeps that evidence attached to a detection record."
    )
    doc.h2("1.2 Problem statement")
    doc.p(
        "Design and implement a student-deployable system that detects common road-damage classes from images and "
        "videos, explains each detection with class name, confidence, and a severity band, retains history, and "
        "supports a simple reported–assigned–in progress–repaired trail. The system must show a clear error when "
        "the model service is offline instead of inventing detections."
    )
    doc.h2("1.3 Objectives")
    doc.bullets([
        "Detect road damage with a YOLOv8 model and return bounding boxes.",
        "Provide separate workflows for still images, video files, and live camera frames.",
        "Map dataset class codes such as D00, D10, D20, and D40 to readable names when those codes are present.",
        "Estimate severity from box area and class, and compute a capped risk score.",
        "Store detections and citizen complaints with optional latitude, longitude, and place name.",
        "Show dashboard counts, analytics charts, a coordinate tracker, and a heatmap built only from stored coordinates.",
        "Allow a repair status update with an audit note.",
        "Generate a browser inspection report that can be printed.",
    ])
    doc.h2("1.4 Scope")
    doc.p(
        "In scope: a single-workstation demonstration, one SQLite database, one loaded weight file, browser login "
        "for the user interface, and English labels. Out of scope: official IRC or MoRTH pavement ratings, "
        "multi-tenant production security, automatic work-order dispatch to a contractor, and measured depth of a "
        "pothole in millimetres. Depth cannot be recovered from a single ordinary photograph."
    )
    doc.h2("1.5 Users")
    doc.table(
        ["Actor", "What they do in this build"],
        [
            ["Surveyor", "Uploads images or video, reviews boxes, saves a location, updates repair status."],
            ["Citizen", "Submits a complaint with an area name, a description of at least eight characters, and an optional photo."],
            ["Guide / examiner", "Checks health, model name, history, and the difference between a live model result and sample dashboard data."],
            ["YOLO runtime", "External component loaded inside the Flask process. It is not a separate network service."],
        ],
    )
    doc.h2("1.6 Definitions")
    doc.table(
        ["Term", "Meaning in this project"],
        [
            ["Detection", "One bounding box returned by YOLOv8 with class, confidence, and severity."],
            ["Severity", "low, medium, or high. Computed from the percentage of the frame covered by the box, with class-specific rules."],
            ["Risk score", "Integer 0–100 derived from severity, confidence, and the number of boxes. Category is low, medium, or high."],
            ["Model badge", "The interface marks live Flask output as Model. Sample cards that are not inference are marked Demo."],
            ["RDD", "Road Damage Detection class codes commonly used in smartphone road-damage datasets."],
        ],
    )

    doc.h1("Chapter 2 — Literature review and existing practice")
    doc.h2("2.1 Manual inspection")
    doc.p(
        "A ward engineer walking or driving a stretch can miss defects, and two inspectors will not mark the same "
        "crack in the same way. Photographs help, but without a structured record the photograph is detached from "
        "the repair decision. The proposed system does not replace the engineer. It gives the engineer a first-pass "
        "visual list."
    )
    doc.h2("2.2 Object detection")
    doc.p(
        "Modern one-stage detectors such as the YOLO family predict boxes and classes in a single forward pass. "
        "YOLOv8, distributed through the Ultralytics library, is a practical choice for an MCA project because the "
        "same Python API trains and runs inference, and a .pt weight file can be dropped beside the Flask application. "
        "The server calls model.predict with imgsz 640, which matches the usual YOLO training resolution and helps smaller damage remain visible."
    )
    doc.h2("2.3 Road-damage datasets")
    doc.p(
        "Published smartphone datasets label damage with codes such as D00 (longitudinal crack), D10 (transverse crack), "
        "D20 (alligator crack), and D40 (pothole). Later sets also discuss markings such as blurred white lines and "
        "crosswalks. RoadScan AI does not retrain a model inside the web request. It loads a prepared weight file and "
        "translates known codes through CLASS_ALIASES. The class list actually available is whatever the loaded file "
        "exposes, and the health endpoint returns that list."
    )
    doc.h2("2.4 Limitations of typical student demos")
    doc.bullets([
        "Desktop-only scripts that print boxes in a console and keep no history.",
        "Interfaces that display sample detections when the model is down, which hides failure during a viva.",
        "No distinction between a crack and a pothole when assigning urgency.",
        "No place to record that a repair crew has started work.",
        "Video processing that attempts every frame and stalls a CPU laptop.",
    ])
    doc.h2("2.5 What this project adds")
    doc.p(
        "RoadScan AI separates the browser from the model, refuses to fabricate detections when Flask is offline, "
        "stores each successful image or video analysis, skips frames during video inference with a hard cap, encodes "
        "a browser-playable H.264 preview, and adds complaint, map, heatmap, risk, and repair screens on top of detection."
    )

    doc.h1("Chapter 3 — System analysis and requirements")
    doc.h2("3.1 Existing system")
    doc.p(
        "The baseline considered here is a manual process: capture photos in a phone gallery, describe the site in a "
        "message or register, and prioritise by memory. There is no common confidence value and no single map of open defects."
    )
    doc.h2("3.2 Proposed system")
    doc.p(
        "A React single-page application talks to a Flask API. Flask loads YOLOv8 once at startup, reads uploads with "
        "OpenCV, writes annotated media, and inserts SQLite rows. The browser polls GET /api/health and surfaces "
        "Model Online only when the process responds and a weight file is loaded."
    )
    doc.h2("3.3 Feasibility")
    doc.table(
        ["Study", "Finding"],
        [
            ["Technical", "Python, Node.js, and a CPU are sufficient. A GPU is optional. Video length must stay short because inference is capped at 90 frames."],
            ["Economic", "The stack is open source. Cost is a laptop and a weight file the student is allowed to use."],
            ["Operational", "Two terminals start the system. A surveyor needs a short briefing, which the user manual provides."],
            ["Schedule", "The modules match an MCA final-year calendar: analysis, a working detector, then maps and repair tracking."],
            ["Legal / ethical", "Users should upload road images they are permitted to use. The demo login must not be described as secure authentication."],
        ],
    )
    doc.h2("3.4 Functional requirements")
    doc.table(
        ["ID", "Requirement"],
        [
            ["FR-01", "The system shall provide login and registration that require an email and a password of at least six characters, stored only in the browser."],
            ["FR-02", "The system shall block dashboard routes until a session exists."],
            ["FR-03", "The system shall expose GET /api/health with status, model_loaded, model file name, and class names."],
            ["FR-04", "The system shall accept an image upload and return detections plus a base64 annotated JPEG."],
            ["FR-05", "The system shall accept a video upload, sample frames, and return a playable annotated MP4 when encoding succeeds."],
            ["FR-06", "The system shall accept a single camera frame and return detections without writing history."],
            ["FR-07", "The system shall persist image and video runs in the history table."],
            ["FR-08", "The system shall list, fetch, and delete history records."],
            ["FR-09", "The system shall accept a complaint with a place name and a description of at least eight characters."],
            ["FR-10", "The system shall store latitude and longitude only when both values are present and inside valid ranges. It shall not invent a coordinate."],
            ["FR-11", "The system shall list tracker points and heatmap buckets only from stored coordinates."],
            ["FR-12", "The system shall update repair status to reported, assigned, in_progress, or repaired, and append a note."],
            ["FR-13", "The system shall compute severity and risk using the published rules in Chapter 5."],
            ["FR-14", "The system shall allow the confidence threshold to be sent with the upload."],
            ["FR-15", "The system shall open a printable inspection report from a stored record."],
            ["FR-16", "The interface shall show an explicit error if the API cannot be reached, and shall not substitute fake boxes."],
        ],
    )
    doc.h2("3.5 Non-functional requirements")
    doc.table(
        ["ID", "Requirement"],
        [
            ["NFR-01", "The API and the Vite server shall run on a Windows 10 workstation for the viva."],
            ["NFR-02", "Image inference shall use imgsz 640."],
            ["NFR-03", "Video processing shall resize the long side toward 640 pixels, keep even dimensions, skip frames, and stop after 90 inferences."],
            ["NFR-04", "Annotated video shall prefer libx264, yuv420p, and faststart so Chrome and Edge can play it."],
            ["NFR-05", "CORS shall allow the local frontend to call the API during development."],
            ["NFR-06", "A missing weight file shall produce HTTP 503 on detection routes rather than a silent empty success that looks like a clean road."],
            ["NFR-07", "The interface shall remain usable on a laptop width and shall collapse the sidebar on a narrow screen."],
            ["NFR-08", "Secrets such as production passwords are out of scope because the demo account is local."],
        ],
    )
    doc.h2("3.6 Constraints")
    doc.bullets([
        "One Flask process holds the model. A second process started by a reloader would load the weights twice, so use_reloader is disabled.",
        "SQLite allows one writer at a time. That matches a demo and is not a city-scale database.",
        "Class names depend on the weight file. Documentation must not claim a measured mAP that this repository does not record.",
        "best.pt is only a fallback. Project notes record that a custom best.pt produced about one percent confidence in local checks, so the preferred file is YOLOv8_Small_RDD.pt.",
    ])

    doc.h1("Chapter 4 — System design")
    doc.h2("4.1 Architecture")
    doc.p(
        "The system has three tiers. The browser renders routes and never runs YOLO. Flask owns inference, file storage, "
        "and SQL. SQLite plus the uploads and outputs folders are the data tier. The frontend reads VITE_API_BASE_URL "
        "and defaults to http://localhost:5000."
    )
    doc.image(diagrams["architecture"], "Figure 1. Three-tier architecture of RoadScan AI.")
    doc.h2("4.2 Modules")
    doc.table(
        ["Module", "Responsibility"],
        [
            ["AuthContext", "Creates a UserProfile in localStorage under the key roadscan_auth_user."],
            ["ProtectedRoute", "Sends an anonymous visitor to /login."],
            ["services/api.ts", "Health, detection, history, complaints, repairs, tracker, heatmap, and dashboard stats."],
            ["ImageDetection", "File picker, confidence, optional location, call detectImage, show boxes."],
            ["VideoDetection", "Same pattern for video, including the server note about short clips."],
            ["LiveCamera", "Captures frames and calls /api/detect/frame. Results are not inserted into history."],
            ["History and Analytics", "Lists model records and charts counts by class, severity, and day."],
            ["Live Tracker and Heatmap", "Leaflet maps. Heatmap buckets round coordinates to two decimal places."],
            ["Repairs", "Status changes through the repair API."],
            ["Citizen Report", "Complaint form. A photo is optional and is detected when the model is loaded."],
            ["report.ts", "Opens a print view with GPS, risk, repair status, and the detection table."],
            ["app.py", "All HTTP behaviour, severity, risk, video stride, and database migration of extra columns."],
        ],
    )
    doc.h2("4.3 Use cases")
    doc.image(diagrams["usecase"], "Figure 2. Use cases for the surveyor and the loaded model.")
    doc.h2("4.4 Sequence of image detection")
    doc.image(diagrams["sequence"], "Figure 3. Sequence from the browser upload to the annotated image.")
    doc.p(
        "Video detection follows the same request shape. Flask opens the file with OpenCV, selects a stride from the "
        "frame count, runs at most 90 inferences, and encodes collected frames. Live detection stops before save()."
    )
    doc.h2("4.5 Activity")
    doc.image(diagrams["activity"], "Figure 4. Activity from opening a detection page to a result or an error.")
    doc.h2("4.6 Logical structure")
    doc.image(diagrams["class"], "Figure 5. Main modules and the detection record they share.")
    doc.h2("4.7 Data design")
    doc.image(diagrams["erd"], "Figure 6. History and complaint entities.")
    doc.p(
        "detections and status_history are JSON text. The server creates missing history columns with ALTER TABLE so an "
        "older detections.db still opens. Complaint rows live in their own table. The tracker reads both tables and "
        "keeps a row only when latitude and longitude are both present."
    )
    doc.h3("4.7.1 History columns")
    doc.table(
        ["Column", "Role"],
        [
            ["id", "UUID primary key."],
            ["type", "image or video."],
            ["filename, created_at, total, severity", "File label, timestamp, box count, worst severity."],
            ["detections", "JSON list of class_name, raw_class, confidence, bbox, severity, and video timestamp."],
            ["result_url", "Path such as /outputs/<id>.jpg or /outputs/<id>.mp4."],
            ["latitude, longitude, location_name", "Optional. Invalid numbers are dropped."],
            ["repair_status", "Defaults to reported."],
            ["risk_score, risk_category", "Computed at insert time."],
            ["status_history", "JSON list of status, time, and note."],
            ["description, owner_email, record_kind", "Optional narrative, account email, and kind flag."],
        ],
    )
    doc.h2("4.8 Components, deployment, and data flow")
    doc.image(diagrams["component"], "Figure 7. User-interface, API, inference, and storage components.")
    doc.image(diagrams["deployment"], "Figure 8. Local deployment used for demonstration.")
    doc.image(diagrams["dfd0"], "Figure 9. Context diagram.")
    doc.image(diagrams["dfd1"], "Figure 10. Level 1 data flow.")
    doc.image(diagrams["state"], "Figure 11. Allowed repair states. The API does not force them to be sequential, but the intended trail is left to right.")
    doc.h2("4.9 Interface design")
    doc.p(
        "The shell is a dark dashboard. The sidebar groups Overview, Detection, Analysis, Management, and System. "
        "Each detection page shows backend status. Sample content, where present on the dashboard for an empty "
        "project story, is labelled Demo. Numbers that come from Flask are labelled from the model path."
    )

    doc.h1("Chapter 5 — Implementation")
    doc.h2("5.1 Technology stack")
    doc.table(
        ["Layer", "Choice"],
        [
            ["Language (UI)", "TypeScript on React 19."],
            ["Build", "Vite. Tailwind CSS 4. React Router 7."],
            ["UI parts", "Radix primitives, Lucide icons, Recharts, Leaflet."],
            ["Language (API)", "Python 3."],
            ["API", "Flask and Flask-CORS. Gunicorn is listed for a Unix host; the Windows demo uses python app.py."],
            ["Vision", "ultralytics YOLO, opencv-python-headless, imageio-ffmpeg."],
            ["Database", "SQLite file backend/detections.db."],
            ["Weights", "YOLOv8_Small_RDD.pt preferred, best.pt fallback, MODEL_PATH override."],
        ],
    )
    doc.h2("5.2 Startup")
    doc.p(
        "On import, app.py creates uploads and outputs, chooses the weight path, and constructs YOLO if the file exists. "
        "Otherwise model remains None and detection routes return 503 with the message that weights must sit next to app.py. "
        "The development server binds 0.0.0.0 on PORT (default 5000) with the reloader off. FLASK_DEBUG can enable the Flask debugger without the reloader."
    )
    doc.h2("5.3 Class names")
    doc.p(
        "pretty_class maps D00 to Longitudinal Crack, D10 to Transverse Crack, D20 to Alligator Crack, D40 to Pothole, "
        "D43 to White Line Blur, D44 to Cross Walk Blur, and the same names written in snake case. Unknown names are shown unchanged. "
        "Each detection also keeps raw_class so a viva can show the code the model actually emitted."
    )
    doc.h2("5.4 Severity rule")
    doc.p(
        "Let the box be (x1, y1, x2, y2) on a frame of width w and height h. The area percentage is "
        "(x2-x1)*(y2-y1)*100/(w*h). The base band is high when the percentage is at least 8, medium when it is at least 2, "
        "and low otherwise. If the class name contains “crack” and the band would be high, it is reduced to medium, because "
        "a long crack can cover area without being a single collapse. If the class is a pothole or the raw code is D40, "
        "the band is high at 3 percent or more and medium at 1 percent or more. The record severity is the worst box: high over medium over low."
    )
    doc.note("State this rule in the viva. It is a visual estimate for sorting a list, not a pavement-management index.")
    doc.h2("5.5 Risk score")
    doc.p(
        "An empty detection list scores 0 and category low. Otherwise each box adds a weight times (0.4 + confidence), "
        "where confidence is capped at 1. Weights are 12 for low, 24 for medium, and 38 for high. Four or more boxes add 8. "
        "The total is rounded and clamped to 0–100. Category is high at 70 or above, medium at 40 or above, and low below 40."
    )
    doc.h2("5.6 Image route")
    doc.p(
        "POST /api/detect/image requires a file field. Confidence defaults to 0.15 when the form omits it. The React client "
        "sends 0.25 for image and video pages unless the user moves the control, and 0.15 for live frames. The file is saved "
        "under uploads using a UUID. OpenCV reads it. Failure returns 400. Success draws boxes with Ultralytics plot(), "
        "writes outputs/<id>.jpg, returns a data URL, and inserts history."
    )
    doc.h2("5.7 Video route")
    doc.p(
        "Stride is 5 when the frame count is above 600, 4 above 240, 3 above 120, and 2 otherwise. The loop stops after 90 "
        "inferred frames. Each inferred frame is resized to a maximum width of 640 with even width and height. Detections "
        "carry a timestamp equal to frame index divided by source frames per second. The preview image is the annotated "
        "frame that contained the most boxes. Encoding uses the ffmpeg binary from imageio-ffmpeg with libx264, yuv420p, "
        "preset veryfast, CRF 28, and faststart. If ffmpeg is missing, OpenCV mp4v is a fallback and may not play in the browser, "
        "though the file can still be downloaded. Encoding failure returns 500."
    )
    doc.h2("5.8 Location handling")
    doc.p(
        "read_geo parses latitude and longitude from the form. A missing value, a non-number, or a value outside "
        "[-90, 90] or [-180, 180] causes coordinates to be stored as null. A place name can still be stored. "
        "The heatmap groups remaining points by latitude and longitude rounded to two decimal places. A bucket is a high "
        "zone when it has two high-severity or high-risk records, or four records of any kind. Two records make a medium zone. One record is a low zone."
    )
    doc.h2("5.9 Complaints and repairs")
    doc.p(
        "A complaint requires a description of at least eight characters and a location name. An optional photo is detected "
        "when the model is loaded. Without a model, the original image is still stored. Repair updates accept a JSON body "
        "with status and an optional note. The kind path segment selects the complaints table or the history table. "
        "Any other status returns 400."
    )
    doc.h2("5.10 Frontend behaviour that matters in a viva")
    doc.bullets([
        "checkHealth aborts after four seconds and tells the user to start Flask.",
        "History rows returned by the API are tagged source model and status completed in the client.",
        "absoluteMediaUrl prefixes /outputs paths with the API origin.",
        "Dashboard stats from the server are file count, sum of detection totals, and the number of high-severity files. The client currently maps the file count into totalImages and sets totalVideos to 0. That mapping is a known limitation and is recorded in the audit.",
        "Logout removes only the localStorage session.",
    ])
    doc.h2("5.11 Repository layout")
    doc.code(
        "RoadDamageDetection/\n"
        "  frontend/          React dashboard\n"
        "  backend/app.py     Flask API\n"
        "  backend/YOLOv8_Small_RDD.pt\n"
        "  backend/best.pt    fallback weights\n"
        "  models/            extra copy of the RDD weights\n"
        "  README.md\n"
        "  CONNECT_BACKEND.md"
    )

    doc.h1("Chapter 6 — Testing summary")
    doc.p(
        "A separate Software Testing Report lists the test design. This chapter records the strategy. "
        "Tests are specified from the source so an examiner can reproduce them. This report does not invent a pass percentage "
        "from a run that was not captured. During the viva, health, one image, one short video, one complaint, and one status change "
        "should be executed and the observed result written on the test log."
    )
    doc.bullets([
        "API negative tests: missing file, unreadable image, missing model, bad repair status, short complaint text, unknown history id.",
        "API positive tests: health, image, video, frame, history list and delete, tracker, heatmap, complaint, repair.",
        "Rule tests: severity boundaries at 1, 2, 3, and 8 percent, crack downgrade, empty risk, four-box bonus, score cap.",
        "UI tests: password shorter than six characters, protected route, offline banner, model badge when health succeeds.",
        "Non-functional checks: video stride selection and the 90-frame cap, even output dimensions, no invented GPS.",
    ])

    doc.h1("Chapter 7 — Results and discussion")
    doc.h2("7.1 What the demonstration shows")
    doc.p(
        "When the weight file loads, /api/health returns model_loaded true and the class list. An image response contains "
        "pixel width and height, a detection array, an annotated image, the worst severity, the risk score and category, "
        "the repair status reported, and any coordinates the user actually supplied. A video response adds frames processed, "
        "stride, duration, and a note that short clips of about 5 to 15 seconds suit a demonstration. A live frame returns "
        "saved false."
    )
    doc.h2("7.2 What is deliberately not claimed")
    doc.p(
        "The repository does not contain a frozen precision, recall, or mAP table for the weight file. Comparing best.pt "
        "with YOLOv8_Small_RDD.pt is supported by backend/compare_models.py, and that comparison must be quoted from an actual "
        "console log rather than from this narrative. A low-confidence weight should be replaced; the server already prefers "
        "YOLOv8_Small_RDD.pt for that reason."
    )
    doc.h2("7.3 Discussion")
    doc.p(
        "Bounding-box area is a proxy. A close camera makes a small pothole look large. A distant camera does the opposite. "
        "The severity rule is still useful because it is deterministic and can be explained. Frame skipping makes video "
        "interactive on a CPU and can miss a defect that appears for only one or two frames. The cap of 90 inferences bounds "
        "waiting time. Citizen complaints without a photo have no boxes and therefore a low risk until a photo is analysed."
    )
    doc.h2("7.4 Sample interpretation")
    doc.p(
        "Suppose one pothole box covers 4 percent of the frame with confidence 0.62. The pothole rule sets severity high "
        "because 4 is at least 3. The risk contribution is 38 * (0.4 + 0.62) = 38.76, which rounds to 39 and category low, "
        "because a single box does not reach 40. A second medium box can push the same site into the medium band. This example "
        "is arithmetic from the formula, not a measured field case."
    )

    doc.h1("Chapter 8 — Conclusion and future scope")
    doc.h2("8.1 Conclusion")
    doc.p(
        "The project meets its academic objective. A surveyor can upload media, see YOLO boxes with confidence and a stated "
        "severity rule, keep a history, place real coordinates on a map, accept a citizen complaint, and move a record along "
        "a repair trail. The system fails visibly when the model is absent. That honesty is part of the design."
    )
    doc.h2("8.2 Limitations")
    doc.bullets([
        "Browser login is not authentication against the API. Any client that can reach port 5000 can call the routes.",
        "CORS is open for local development.",
        "Output files are served with a video/mp4 content type even when the file is a JPEG.",
        "Dashboard stat mapping does not split image and video counts.",
        "There is no measured depth, area in square metres, or official defect code for a work order.",
        "SQLite and a single process will not serve a city concurrently.",
    ])
    doc.h2("8.3 Future scope")
    doc.bullets([
        "Server accounts with hashed passwords and per-user history.",
        "A measured evaluation sheet: precision, recall, and mAP on a held-out Indian road set, stored in the repository.",
        "Camera calibration or a known mounting height so box size can be converted toward an approximate ground area.",
        "PostgreSQL, object storage, and a queue for video jobs.",
        "A mobile capture client that always sends GPS.",
        "Retraining when new ward photographs are labelled.",
        "Role separation so a citizen cannot change a repair status.",
    ])

    doc.h1("References")
    doc.numbered([
        "G. Jocher, A. Chaurasia, and J. Qiu, Ultralytics YOLOv8, https://github.com/ultralytics/ultralytics.",
        "J. Redmon, S. Divvala, R. Girshick, and A. Farhadi, “You Only Look Once: Unified, Real-Time Object Detection,” CVPR, 2016.",
        "H. Maeda, Y. Sekimoto, T. Seto, T. Kashiyama, and H. Omata, “Road Damage Detection and Classification Using Deep Neural Networks with Smartphone Images,” Computer-Aided Civil and Infrastructure Engineering, 2018.",
        "Pallets Projects, Flask documentation, https://flask.palletsprojects.com.",
        "OpenCV team, OpenCV documentation, https://docs.opencv.org.",
        "Meta Platforms, React documentation, https://react.dev.",
        "Leaflet contributors, Leaflet documentation, https://leafletjs.com.",
        "SQLite Consortium, SQLite documentation, https://www.sqlite.org/docs.html.",
    ])

    doc.h1("Appendix A — REST API catalogue")
    doc.table(
        ["Method and path", "Purpose", "Notable result"],
        [
            ["GET /api/health", "Liveness and weights", "model_loaded, classes"],
            ["POST /api/detect/image", "Still image", "detections, annotated_image, risk"],
            ["POST /api/detect/video", "Video file", "annotated_video, stride, frames_processed"],
            ["POST /api/detect/frame", "One camera frame", "saved is false"],
            ["GET /api/history", "All detections, newest first", "JSON array"],
            ["GET /api/history/<id>", "One detection", "404 if missing"],
            ["DELETE /api/history/<id>", "Delete a detection row", "ok true"],
            ["GET /api/tracker", "Rows that have coordinates", "history plus complaints"],
            ["GET /api/heatmap", "Coordinate buckets", "zone low, medium, or high"],
            ["PATCH /api/repairs/<kind>/<id>", "Repair status", "400 if status is not allowed"],
            ["GET /api/complaints", "Complaints, optional email filter", "JSON array"],
            ["POST /api/complaints", "New complaint", "400 if text is too short or place is empty"],
            ["GET /api/dashboard/stats", "Counts", "files, damages, high"],
            ["GET /outputs/<name>", "Annotated file", "Sent from the outputs folder"],
        ],
    )
    doc.h1("Appendix B — Screen catalogue")
    doc.table(
        ["Route", "Screen"],
        [
            ["/login, /register", "Session entry."],
            ["/dashboard", "Counts and entry points."],
            ["/detect/image", "Image analysis."],
            ["/detect/video", "Video analysis."],
            ["/live-camera", "Camera frames without history writes."],
            ["/history", "Stored model runs."],
            ["/analytics", "Charts and report opening."],
            ["/live-tracker", "Map of stored coordinates."],
            ["/heatmap", "Zone buckets."],
            ["/risk-score", "Risk explanation and scores."],
            ["/repairs", "Status updates."],
            ["/citizen-report", "Complaint form."],
            ["/about", "Project abstract shown inside the app, including the student and guide names."],
            ["/settings", "Local profile and API notes."],
        ],
    )
    return doc


def testing(_: dict) -> Doc:
    doc = Doc("02_Software_Testing_Report", "Software Testing Report — RoadScan AI", "Software Testing Report")
    doc.h1("Document control")
    doc.table(
        ["Item", "Value"],
        [
            ["Project", META["title"]],
            ["System name", META["product"]],
            ["Student", f"{META['student']}, Roll No. {META['roll']}"],
            ["Guide", META["guide"]],
            ["Version", "1.0 — aligned with backend/app.py and frontend/src"],
            ["Test design date", META["month"]],
            ["Execution note", "Cases below are specified from the implementation. Record the actual viva run in the execution log. Do not treat this document as a claim that every case has already passed on a particular machine."],
        ],
    )
    doc.h1("1. Introduction")
    doc.h2("1.1 Purpose")
    doc.p(
        "This report defines how RoadScan AI is tested. The goal is to show that detection routes obey their contracts, "
        "that severity and risk follow the written formulas, that the interface does not invent boxes when Flask is down, "
        "and that repair and complaint validation rejects bad input."
    )
    doc.h2("1.2 Items under test")
    doc.bullets([
        "Flask routes in backend/app.py.",
        "Helper behaviour: severity, worst, compute_risk, read_geo, video stride, even_size.",
        "React route guard, login validation, and API client error handling.",
        "SQLite history and complaints tables.",
    ])
    doc.h2("1.3 Items not claimed as tested here")
    doc.bullets([
        "Accuracy of the weight file against a labelled benchmark. That needs a dataset split and a metrics table.",
        "Load testing beyond a single user.",
        "Security penetration testing. The audit report lists design exposures instead.",
    ])
    doc.h1("2. Test strategy")
    doc.table(
        ["Level", "Method", "Exit idea"],
        [
            ["Unit", "Call the pure rules with fixed boxes, or inspect them line by line if they stay inside app.py.", "Boundaries 1%, 2%, 3%, 8% match Chapter 5 of the project report."],
            ["API", "HTTP calls with curl, the browser, or a short Python script.", "Status codes match the case table."],
            ["Integration", "UI action followed by a history or map check.", "A saved image appears in history and, if GPS was sent, on the tracker."],
            ["System", "Both processes running, one image and one 5–15 second video.", "Annotated media visible, health shows the weight file name."],
            ["Negative", "Missing file, bad image, offline API, bad status.", "4xx or a visible UI error. No fake detections."],
            ["Acceptance", "Guide walks the user manual once.", "Login, detect, history, complaint, repair, print."],
        ],
    )
    doc.h2("2.1 Environment")
    doc.bullets([
        "Windows 10, Python 3.12, Node.js with npm, Chrome or Edge.",
        "Frontend: http://localhost:5173. Backend: http://localhost:5000.",
        "Weights present at backend/YOLOv8_Small_RDD.pt.",
        "A road photograph and a short MP4 that the student is allowed to use. Three sample images ship in frontend/public/samples.",
    ])
    doc.h2("2.2 Severity of a defect")
    doc.table(
        ["Level", "Meaning"],
        [
            ["S1", "Wrong boxes presented as model output, data loss, or a crash on a valid image."],
            ["S2", "A documented route returns the wrong status, or GPS is invented."],
            ["S3", "A label, chart mapping, or content-type issue that does not change the boxes."],
            ["S4", "Wording or spacing."],
        ],
    )
    doc.h1("3. Rule checks")
    doc.table(
        ["ID", "Input", "Expected"],
        [
            ["RU-01", "Box area 1.5% , class Longitudinal Crack", "low"],
            ["RU-02", "Box area 2.0% , class Longitudinal Crack", "medium"],
            ["RU-03", "Box area 9% , class name contains crack", "medium, because high is downgraded"],
            ["RU-04", "Box area 9% , class White Line Blur", "high"],
            ["RU-05", "Box area 1.0% , class Pothole", "medium"],
            ["RU-06", "Box area 3.0% , class D40", "high"],
            ["RU-07", "Box area 0.5% , class Pothole", "low"],
            ["RU-08", "No boxes", "risk 0, category low, record severity null"],
            ["RU-09", "One high box at confidence 1.0", "38 * 1.4 = 53.2, category medium"],
            ["RU-10", "Four or more boxes", "extra +8 before the 0–100 clamp"],
            ["RU-11", "Score above 100 by arithmetic", "stored score 100"],
            ["RU-12", "Latitude 95 or longitude 200", "coordinates discarded, place name may remain"],
            ["RU-13", "Frame count 100", "video stride 2"],
            ["RU-14", "Frame count 150", "stride 3"],
            ["RU-15", "Frame count 300", "stride 4"],
            ["RU-16", "Frame count 700", "stride 5"],
            ["RU-17", "Any long video", "frames_processed never above 90"],
            ["RU-18", "Width 641 after scale", "even_size reduces the odd dimension by one"],
        ],
    )
    doc.p(
        "RU-09 is included so the formula can be checked by hand: weight 38 times (0.4 + 1.0) equals 53.2, which rounds to 53. "
        "Category medium starts at 40 and high starts at 70."
    )
    doc.h1("4. API test cases")
    doc.table(
        ["ID", "Steps", "Expected"],
        [
            ["API-01", "GET /api/health with weights present", "200, status ok, model_loaded true, model_path ends with the loaded file name, classes is a list"],
            ["API-02", "Rename the weight file away and restart", "model_loaded false. POST /api/detect/image returns 503"],
            ["API-03", "POST /api/detect/image with no file", "400, error mentions no file"],
            ["API-04", "POST a text file named photo.jpg", "400, could not read image"],
            ["API-05", "POST a real road image, confidence 0.25", "200, detections is a list, annotated_image starts with data:image/jpeg, id is a UUID, repair_status reported"],
            ["API-06", "Repeat API-05 with latitude 19.0760 and longitude 72.8777", "Those coordinates echo in JSON and in GET /api/history/<id>"],
            ["API-07", "POST confidence 0.99 on a mild image", "Fewer or zero boxes than confidence 0.15. Both responses are valid"],
            ["API-08", "POST /api/detect/video with no file", "400"],
            ["API-09", "POST a 10 second road MP4", "200, frames_processed ≤ 90, stride matches the table, annotated_video starts with /outputs/ and ends with .mp4"],
            ["API-10", "Open the MP4 URL in Chrome", "Video plays when ffmpeg encoding succeeded"],
            ["API-11", "POST /api/detect/frame with a JPEG", "200, saved false, and history count does not increase"],
            ["API-12", "GET /api/history", "Array sorted by created_at descending"],
            ["API-13", "GET /api/history/not-an-id", "404"],
            ["API-14", "DELETE a real history id, then GET it", "First call ok true. Second call 404"],
            ["API-15", "POST /api/complaints with description Hi", "400"],
            ["API-16", "POST a complaint with a place and a sentence of at least eight characters", "200 body contains id and repair_status reported"],
            ["API-17", "PATCH status to scheduled", "400"],
            ["API-18", "PATCH status to in_progress with a note", "repair_status in_progress and status_history grows by one object"],
            ["API-19", "GET /api/tracker", "Only rows with both coordinates. Complaint rows have type complaint"],
            ["API-20", "GET /api/heatmap with no stored GPS", "Empty array. The server must not add a default city"],
            ["API-21", "GET /api/dashboard/stats after two image runs", "files equals the history count"],
        ],
    )
    doc.h1("5. Interface test cases")
    doc.table(
        ["ID", "Steps", "Expected"],
        [
            ["UI-01", "Open /dashboard before login", "Redirect to /login"],
            ["UI-02", "Login with password abc", "Message requiring six characters"],
            ["UI-03", "Login student@roadscan.ai / demo123", "Dashboard opens. Refresh keeps the session"],
            ["UI-04", "Register with an empty name", "Validation error"],
            ["UI-05", "Stop Flask. Open Image Detection", "Backend unavailable message. No boxes are drawn from sample data"],
            ["UI-06", "Start Flask. Header or status shows the model", "model_loaded path is visible to the user as online"],
            ["UI-07", "Analyse frontend/public/samples/sample_road_1.jpg", "Result panel shows class, confidence, and severity"],
            ["UI-08", "Open History", "The new row is listed"],
            ["UI-09", "Open the inspection report popup", "Printable page lists file name, risk, and rows. If the browser blocks popups, the page asks for permission"],
            ["UI-10", "Submit a complaint without a photo", "Record exists. Risk follows zero detections unless a photo was analysed"],
            ["UI-11", "Move a repair from reported to assigned to in_progress to repaired", "Each step is accepted"],
            ["UI-12", "Logout and open /history", "Redirect to login"],
            ["UI-13", "Narrow the window", "Sidebar becomes an overlay and can be closed"],
            ["UI-14", "Live camera permission denied", "The page reports the camera error and does not create a history row"],
        ],
    )
    doc.h1("6. Traceability")
    doc.table(
        ["Requirement", "Cases"],
        [
            ["FR-01, FR-02", "UI-01, UI-02, UI-03, UI-04, UI-12"],
            ["FR-03, FR-16", "API-01, API-02, UI-05, UI-06"],
            ["FR-04, FR-13, FR-14", "API-05, API-07, RU-01 to RU-11, UI-07"],
            ["FR-05", "API-09, API-10, RU-13 to RU-17"],
            ["FR-06", "API-11, UI-14"],
            ["FR-07, FR-08", "API-12, API-13, API-14, UI-08"],
            ["FR-09", "API-15, API-16, UI-10"],
            ["FR-10, FR-11", "API-06, API-19, API-20, RU-12"],
            ["FR-12", "API-17, API-18, UI-11"],
            ["FR-15", "UI-09"],
        ],
    )
    doc.h1("7. Defects already visible in source review")
    doc.p("These are recorded so testing does not rediscover them as surprises. The audit report rates them.")
    doc.table(
        ["ID", "Observation", "Severity"],
        [
            ["DEF-01", "fetchDashboardStats maps every file into totalImages and sets totalVideos to 0.", "S3"],
            ["DEF-02", "GET /outputs/<name> sets mimetype video/mp4 for every file, including JPEG stills.", "S3"],
            ["DEF-03", "Repair routes interpolate the table name. The value is limited to two known names, so this is not an open SQL injection, but the pattern should stay constrained.", "S4"],
            ["DEF-04", "API routes do not check the browser session.", "S2 as a product risk, accepted for the academic demo"],
        ],
    )
    doc.h1("8. Execution log")
    doc.p("Fill this table during the demonstration. Leave a row blank rather than writing Pass in advance.")
    doc.table(
        ["Case ID", "Date", "Tester", "Result (Pass/Fail)", "Notes"],
        [
            ["API-01", "", "", "", ""],
            ["API-05", "", "", "", ""],
            ["API-09", "", "", "", ""],
            ["API-11", "", "", "", ""],
            ["API-16", "", "", "", ""],
            ["API-18", "", "", "", ""],
            ["UI-03", "", "", "", ""],
            ["UI-05", "", "", "", ""],
            ["UI-07", "", "", "", ""],
            ["UI-11", "", "", "", ""],
        ],
    )
    doc.h1("9. Exit criteria for the viva build")
    doc.bullets([
        "Health shows a loaded model.",
        "One image and one short video produce annotated media.",
        "A stopped server produces an error on the detection page.",
        "A complaint and a repair update round-trip.",
        "Known S3 issues are either fixed or explained from this report.",
    ])
    return doc


def abstract(_: dict) -> Doc:
    doc = Doc("03_Project_Abstract", "Project Abstract — RoadScan AI", "Project Abstract")
    doc.h1("Title")
    doc.p(META["title"])
    doc.p(f"Working name: {META['product']}")
    doc.h1("Student and guide")
    doc.table(
        ["Field", "Detail"],
        [
            ["Student", META["student"]],
            ["Roll number", META["roll"]],
            ["Guide", META["guide"]],
            ["Programme", META["program"]],
            ["Academic year", META["year"]],
            ["College", "To be written on the cover before submission"],
        ],
    )
    doc.h1("Abstract")
    doc.p(
        "Road surface distress on Indian roads is still recorded largely by inspection visits and loose photograph collections. "
        "That practice is slow, and it does not attach a class label, a confidence value, or a repair trail to the picture. "
        "This project presents RoadScan AI, a web application that detects road damage from images, short videos, and live camera frames using YOLOv8."
    )
    doc.p(
        "The browser interface is built with React, TypeScript, Vite, and Tailwind CSS. The inference service is a Flask application. "
        "It loads YOLOv8_Small_RDD.pt when that file is present, otherwise best.pt, unless MODEL_PATH is set. OpenCV reads media. "
        "The model runs at image size 640. Each box is labelled with a friendly class name when the model emits a known road-damage code: "
        "longitudinal crack, transverse crack, alligator crack, pothole, white line blur, or crosswalk blur. The original class code is retained."
    )
    doc.p(
        "Severity is a visual estimate from the percentage of the frame covered by the box, with a stricter rule for potholes and a cap "
        "so that a wide crack is not automatically marked as the highest band. A risk score from 0 to 100 combines severity, confidence, "
        "and the number of boxes. Image and video analyses are stored in SQLite together with an optional latitude, longitude, and place name. "
        "The server never fills in a coordinate the client did not send. Live frames are answered and then discarded so a camera loop does not flood history."
    )
    doc.p(
        "Around the detector, the dashboard adds history, charts, a map tracker, a heatmap of coordinate buckets, a repair status trail "
        "(reported, assigned, in progress, repaired), citizen complaints, and a printable inspection report. If Flask is offline or the "
        "weight file is missing, the interface reports the failure. It does not substitute sample boxes."
    )
    doc.p(
        "The system is an MCA demonstration. Login protects the screens on that browser only. Severity is not an official pavement index, "
        "and this abstract does not claim a benchmark mAP because the repository does not store one. Video analysis skips frames and stops "
        "after 90 inferences so a CPU laptop can finish a short clip."
    )
    doc.h1("Keywords")
    doc.p("Road damage detection, pothole, YOLOv8, Flask, React, SQLite, severity estimate, Indian roads, MCA project.")
    doc.h1("Tools")
    doc.p("React 19, TypeScript, Vite, Tailwind CSS, Leaflet, Recharts, Python, Flask, OpenCV, Ultralytics YOLOv8, FFmpeg, SQLite.")
    return doc


def uml(diagrams: dict) -> Doc:
    doc = Doc(
        "04_System_Architecture_and_UML",
        "System Architecture and UML Diagrams — RoadScan AI",
        "System Architecture and UML Diagrams",
    )
    doc.h1("1. Purpose")
    doc.p(
        "This volume collects the architecture and UML-style diagrams for RoadScan AI. The diagrams match the running design: "
        "a React client, a Flask and YOLOv8 server, and a SQLite file. They are implementation diagrams for the viva, drawn from the modules that exist in the repository."
    )
    doc.h1("2. Architectural style")
    doc.p(
        "The style is a three-tier client-server. The presentation tier is a single-page application. The application tier is stateless "
        "apart from the loaded model and the SQLite file on disk. There is no separate message queue. Video work happens inside the request, "
        "which is acceptable only because stride and a frame cap bound the work."
    )
    doc.image(diagrams["architecture"], "Figure 1. Three-tier architecture.")
    doc.h2("2.1 Why the model stays behind Flask")
    doc.p(
        "Loading YOLOv8 in the browser would publish the weight file and would be heavy on a student laptop’s GPU drivers. "
        "Keeping inference in Python matches the Ultralytics API and lets OpenCV and FFmpeg share one pipeline."
    )
    doc.h1("3. Use case diagram")
    doc.p(
        "The human actor is a surveyor who may also file a citizen-style complaint. The model is shown as a supporting actor because "
        "detection use cases cannot complete without it. Login is local. Health is a separate use case so the examiner can prove the model is loaded before trusting a screenshot."
    )
    doc.image(diagrams["usecase"], "Figure 2. Use case diagram.")
    doc.h2("3.1 Use case narrative — detect image")
    doc.table(
        ["Field", "Description"],
        [
            ["Name", "Detect image"],
            ["Actor", "Surveyor, with YOLOv8"],
            ["Precondition", "Session exists in the browser. Flask is running. A weight file loaded."],
            ["Main flow", "User selects a JPEG or PNG, optional confidence and GPS, and starts analysis. The client posts multipart form data. Flask runs prediction, stores the row, and returns JSON."],
            ["Alternate flow", "Unreadable file returns 400. Missing model returns 503. Network failure is shown by the client and nothing is stored."],
            ["Postcondition", "A history row exists for a successful call. outputs contains the annotated JPEG."],
        ],
    )
    doc.h1("4. Sequence diagram")
    doc.image(diagrams["sequence"], "Figure 3. Image-detection sequence.")
    doc.p(
        "The video sequence inserts a loop between steps 3 and 4: read a frame, skip according to stride, predict, keep the annotated frame, "
        "stop at 90 inferences or end of file, then encode. The live-camera sequence omits the database insert."
    )
    doc.h1("5. Activity diagram")
    doc.image(diagrams["activity"], "Figure 4. Activity for analysis.")
    doc.h1("6. Class diagram")
    doc.p(
        "The browser does not use a classical inheritance hierarchy for domain objects. The diagram shows the modules and the two records they pass. "
        "Detection is the box. HistoryRecord is the stored job. The Flask module owns the functions severity, compute_risk, save, and the route handlers."
    )
    doc.image(diagrams["class"], "Figure 5. Module and record diagram.")
    doc.h1("7. State diagram")
    doc.image(diagrams["state"], "Figure 11. Repair-status states.")
    doc.p(
        "The implementation accepts any of the four statuses from any of the others. A stricter state machine that forbids moving from repaired back to reported would be a future rule. The diagram shows the intended operational order."
    )
    doc.h1("8. Component diagram")
    doc.image(diagrams["component"], "Figure 7. Components.")
    doc.h1("9. Deployment diagram")
    doc.image(diagrams["deployment"], "Figure 8. Deployment on one Windows workstation. Port 5173 serves the interface. Port 5000 serves the API and the annotated files.")
    doc.h1("10. Data-flow diagrams")
    doc.image(diagrams["dfd0"], "Figure 9. Context diagram.")
    doc.image(diagrams["dfd1"], "Figure 10. Level 1 diagram. Process 3 is the only step that reads the weight file.")
    doc.h1("11. Entity-relationship diagram")
    doc.image(diagrams["erd"], "Figure 6. Logical data model.")
    doc.p(
        "There is no foreign key between complaints and history. A complaint photo that is analysed does not also insert a history row in the current code. "
        "Maps union the two tables at read time. That is why source_table is added in the tracker response and is not a stored column."
    )
    doc.h1("12. Route map")
    doc.table(
        ["Path", "Guard", "Primary component"],
        [
            ["/login", "Public", "LoginPage"],
            ["/register", "Public", "RegisterPage"],
            ["/dashboard", "Protected", "DashboardPage"],
            ["/detect/image", "Protected", "ImageDetectionPage"],
            ["/detect/video", "Protected", "VideoDetectionPage"],
            ["/live-camera", "Protected", "LiveCameraPage"],
            ["/history", "Protected", "HistoryPage"],
            ["/analytics", "Protected", "AnalyticsPage"],
            ["/live-tracker", "Protected", "LiveTrackerPage"],
            ["/heatmap", "Protected", "HeatmapPage"],
            ["/risk-score", "Protected", "RiskScorePage"],
            ["/repairs", "Protected", "RepairsPage"],
            ["/citizen-report", "Protected", "CitizenReportPage"],
            ["/about", "Protected", "AboutPage"],
            ["/settings", "Protected", "SettingsPage"],
        ],
    )
    return doc


def manual(_: dict) -> Doc:
    doc = Doc("05_User_Manual", "User Manual — RoadScan AI", "User Manual")
    doc.h1("1. Who this manual is for")
    doc.p(
        "This manual is for a surveyor, a student demonstrator, or a faculty guide using RoadScan AI on a laptop. "
        "Installation is covered in the Installation Guide. Start here after both the website and the API are running."
    )
    doc.h1("2. What you can do")
    doc.bullets([
        "Sign in and open the dashboard.",
        "Analyse a road photograph.",
        "Analyse a short road video.",
        "Watch a live camera and see boxes without saving every frame.",
        "Review history and charts.",
        "Place saved coordinates on a map and a heatmap.",
        "Read a risk score.",
        "Move a defect through a repair trail.",
        "File a citizen complaint.",
        "Print an inspection report.",
    ])
    doc.h1("3. Sign in")
    doc.numbered([
        "Open the site address given in the installation guide, normally http://localhost:5173.",
        "Choose Login, or Register if you want a display name.",
        "Enter any email address you will remember, and a password of at least six characters. A demonstration pair is student@roadscan.ai and demo123.",
        "The dashboard opens. Closing the browser does not log you out. Use Logout when you share the computer.",
    ])
    doc.note("This sign-in stays in this browser. It is a project session, not a municipal staff account. Do not use a personal password you use elsewhere.")
    doc.h1("4. How to read status")
    doc.p(
        "Before you trust a picture, look at the backend status. Model Online means Flask responded and a weight file is loaded. "
        "If the server is stopped, the detection pages show an error. They will not draw sample boxes and pretend they came from the model. "
        "Purple Demo marks are sample interface content. Green Model marks are Flask output."
    )
    doc.h1("5. Analyse a photograph")
    doc.numbered([
        "Open Image Detection.",
        "Choose a JPG or PNG of a road surface. You can start with the sample images supplied with the project.",
        "Set the confidence slider if you need fewer or more boxes. A higher value keeps only the stronger boxes. The page sends 0.25 unless you change it.",
        "Optionally type an area name. Use the location control if you want a real GPS point stored. Leave it empty if you do not have one.",
        "Start the analysis and wait. The first call can be slower while the model is warm.",
        "Read each box: class name, confidence, and severity colour.",
        "The run is stored. Open Detection History to see it again.",
    ])
    doc.h2("5.1 How to explain severity")
    doc.p(
        "Severity looks at how much of the picture the box covers. Small boxes are low. Larger boxes are medium or high. "
        "Potholes are treated more strictly than cracks. Say clearly that this is a visual estimate for sorting, not a measured depth."
    )
    doc.h1("6. Analyse a video")
    doc.numbered([
        "Open Video Detection.",
        "Choose a short clip, about 5 to 15 seconds. A long video is sampled and will still stop after 90 analysed frames.",
        "Add an optional place or GPS point for the clip as a whole. The system stores one location for the file, not a point per frame.",
        "Start the analysis. CPU inference can take a few minutes.",
        "Play the annotated video in the page. If it does not play, use the download path from history and check that FFmpeg was installed with the Python packages.",
    ])
    doc.h1("7. Live camera")
    doc.numbered([
        "Open Live Camera and allow the browser to use the camera.",
        "Point the camera at a road surface with reasonable light.",
        "Boxes update from individual frames. These frames are not written into Detection History.",
        "If you need a permanent record, take a still image on the Image Detection page or file a complaint with a photo.",
    ])
    doc.h1("8. History, analytics, and the printed report")
    doc.p(
        "Detection History lists image and video runs, newest first. You can open one record or delete it. "
        "Analytics & Reports charts the stored set. From a record, open the inspection report. Allow pop-up windows if the browser asks. "
        "Use the browser print command to save a PDF or to print. The report shows file name, risk score, repair status, GPS when it exists, and a table of boxes."
    )
    doc.h1("9. Map and heatmap")
    doc.p(
        "Live Tracker shows only records that have both a latitude and a longitude. A complaint or detection without GPS will not appear, even if it has an area name. "
        "Damage Heatmap groups nearby points. A busier or more severe group is drawn as a higher zone. If nobody has stored coordinates yet, the map is empty on purpose."
    )
    doc.h1("10. Risk score")
    doc.p(
        "Open Risk Score to read the 0–100 value. Higher means more boxes, higher severity, or higher confidence. "
        "Bands are low below 40, medium from 40 to 69, and high from 70 to 100. Use the score to order a work list, then confirm the site in person."
    )
    doc.h1("11. Road repairs")
    doc.numbered([
        "Open Road Repairs.",
        "Select a detection or a complaint.",
        "Set the status to Assigned when a crew is named, In Progress when work has started, and Repaired when the site is closed.",
        "Add a short note. The note is kept in the status history with the time.",
    ])
    doc.h1("12. Citizen report")
    doc.numbered([
        "Open Citizen Report.",
        "Enter the area name. This is required.",
        "Describe the problem in at least eight characters.",
        "Attach a photo if you have one. When the model is running, the photo is analysed and the boxes are stored on the complaint.",
        "Submit. The complaint starts as Reported.",
        "You can filter the complaint list by the email address stored with the report.",
    ])
    doc.h1("13. Settings and About")
    doc.p(
        "Settings holds the local profile. About shows the project abstract, the problem statement, and the team block: "
        f"{META['student']}, Roll No. {META['roll']}, guided by {META['guide']}."
    )
    doc.h1("14. Common situations")
    doc.table(
        ["What you see", "What to do"],
        [
            ["Backend unavailable", "Start the Flask server. See the Installation Guide."],
            ["API is up and the model is missing", "Place YOLOv8_Small_RDD.pt next to app.py and restart Flask."],
            ["No boxes on a road that clearly has damage", "Lower the confidence and try a closer, sharper photograph. The model can still miss a class it was not trained to see."],
            ["Video is slow", "Use a shorter clip. The server already skips frames."],
            ["Video file will not play", "Confirm imageio-ffmpeg installed. The mp4v fallback is less reliable in Chrome."],
            ["Map is empty", "Run a detection again and supply a real GPS point."],
            ["Popup did not open", "Allow pop-ups for the site, then open the report again."],
            ["Logged out after someone cleared site data", "Sign in again. History on the server is still there."],
        ],
    )
    doc.h1("15. Good practice while demonstrating")
    doc.bullets([
        "Show /api/health before the first image so the audience sees model_loaded true.",
        "Say the severity sentence from section 5.1.",
        "Show one failure: stop the server, attempt an upload, restart, and show recovery.",
        "Do not describe the login as a secure government login.",
    ])
    return doc


def installation(_: dict) -> Doc:
    doc = Doc("06_Installation_Guide", "Installation Guide — RoadScan AI", "Installation Guide")
    doc.h1("1. Purpose")
    doc.p(
        "This guide installs RoadScan AI on Windows 10 for a local demonstration. The interface uses port 5173. "
        "The API uses port 5000. You need two terminals."
    )
    doc.h1("2. Hardware and software you need")
    doc.table(
        ["Item", "Requirement"],
        [
            ["OS", "Windows 10 (tested target for this project)."],
            ["CPU", "A recent laptop CPU is enough. A GPU is optional."],
            ["RAM", "8 GB minimum. 16 GB is more comfortable once PyTorch loads."],
            ["Disk", "Several gigabytes for the Python environment and PyTorch, plus the .pt weight file."],
            ["Python", "3.12 is the version observed in this workspace. Python 3.10 or newer is the practical range for current Ultralytics builds."],
            ["Node.js", "Current LTS with npm, so that Vite can run."],
            ["Browser", "Chrome or Edge."],
            ["Media", "A road image and a short MP4 you have rights to use."],
        ],
    )
    doc.h1("3. Get the project folder")
    doc.p(
        "Copy the RoadDamageDetection folder onto the machine. The important paths are frontend, backend/app.py, "
        "backend/requirements.txt, and backend/YOLOv8_Small_RDD.pt. best.pt may sit beside it as a fallback."
    )
    doc.h1("4. Install and start the API")
    doc.numbered([
        "Open PowerShell.",
        "Change directory to the backend folder.",
        "Create a virtual environment: python -m venv venv.",
        "Activate it: .\\venv\\Scripts\\activate.",
        "Install dependencies: pip install -r requirements.txt. This installs Flask, Flask-CORS, Ultralytics, OpenCV, imageio-ffmpeg, and Gunicorn. Ultralytics pulls in PyTorch.",
        "Confirm the weight file is in this same folder.",
        "Start the server: python app.py.",
        "Leave this window open. The console should print Model loaded: True and the class map.",
    ])
    doc.code(
        "cd C:\\Users\\Admin\\Downloads\\RoadDamageDetection\\backend\n"
        "python -m venv venv\n"
        ".\\venv\\Scripts\\activate\n"
        "pip install -r requirements.txt\n"
        "python app.py"
    )
    doc.h2("4.1 Check the API")
    doc.p("Open http://localhost:5000/api/health in the browser. A healthy body looks like this shape:")
    doc.code(
        '{\n  "status": "ok",\n  "model_loaded": true,\n  "model_path": "YOLOv8_Small_RDD.pt",\n  "classes": ["..."]\n}'
    )
    doc.p(
        "If model_loaded is false, the process did not find a weight file. Copy YOLOv8_Small_RDD.pt next to app.py, or set MODEL_PATH to the full path of a .pt file, and start python app.py again."
    )
    doc.h1("5. Install and start the website")
    doc.numbered([
        "Open a second PowerShell window.",
        "Change directory to the frontend folder.",
        "Install packages: npm install.",
        "Start the dev server: npm run dev.",
        "Open the URL Vite prints. It is normally http://localhost:5173.",
    ])
    doc.code(
        "cd C:\\Users\\Admin\\Downloads\\RoadDamageDetection\\frontend\n"
        "npm install\n"
        "npm run dev"
    )
    doc.h2("5.1 Point the website at a different API")
    doc.p("Create frontend/.env when the API is not on port 5000:")
    doc.code("VITE_API_BASE_URL=http://localhost:5000")
    doc.p("Restart npm run dev after changing the file. Do not put a slash at the end.")
    doc.h1("6. First login")
    doc.p(
        "Register a name, email, and a password of at least six characters, or log in with student@roadscan.ai and demo123. "
        "Then follow the User Manual. Analyse one sample image under frontend/public/samples before the viva so the weights are loaded into memory."
    )
    doc.h1("7. Optional production-style UI build")
    doc.p(
        "npm run build compiles the TypeScript and writes a static site. npm run preview serves that build locally. "
        "The Flask development server is still required for detection. Gunicorn is listed for a Unix deployment and is not the Windows start command."
    )
    doc.h1("8. Environment variables")
    doc.table(
        ["Variable", "Where", "Effect"],
        [
            ["MODEL_PATH", "Flask process", "Absolute or relative path of the .pt file to load."],
            ["PORT", "Flask process", "API port. Default 5000."],
            ["FLASK_DEBUG", "Flask process", "true, 1, or t enables the Flask debugger. The reloader stays off."],
            ["VITE_API_BASE_URL", "Frontend build / dev", "Origin of the API. Default http://localhost:5000."],
        ],
    )
    doc.h1("9. Folder roles")
    doc.table(
        ["Path", "Role"],
        [
            ["backend/uploads", "Original uploads. Created automatically."],
            ["backend/outputs", "Annotated JPEG and MP4 files. Served under /outputs/."],
            ["backend/detections.db", "SQLite database. Created on first use."],
            ["frontend/public/samples", "Three sample road photographs."],
        ],
    )
    doc.h1("10. Troubleshooting")
    doc.table(
        ["Symptom", "Action"],
        [
            ["python is not recognised", "Install Python and enable the “Add python.exe to PATH” option, then open a new terminal."],
            ["pip install fails on a torch wheel", "Upgrade pip, then retry inside the activated virtual environment. A 64-bit Python is required."],
            ["Port 5000 already in use", "Stop the other program or set PORT to a free port and match VITE_API_BASE_URL."],
            ["Port 5173 already in use", "Vite will offer the next port. Use the URL it prints."],
            ["CORS or failed fetch", "The page must call the same origin you put in VITE_API_BASE_URL. Restart both processes after a change."],
            ["Model loaded False", "The .pt file is missing or MODEL_PATH is wrong."],
            ["Very low confidence on every box", "You may be on the fallback best.pt. Prefer YOLOv8_Small_RDD.pt. The source comment records that best.pt scored about one percent confidence in a local test."],
            ["Video returns Failed to encode", "Reinstall imageio-ffmpeg inside the virtual environment."],
            ["npm install peer warnings", "Warnings alone are not a failure. A non-zero exit code is."],
        ],
    )
    doc.h1("11. Stop and start next time")
    doc.numbered([
        "Activate the backend virtual environment and run python app.py.",
        "In the frontend folder run npm run dev. You do not need npm install again unless package.json changed.",
        "Open the site and check the model status.",
    ])
    doc.h1("12. What not to delete")
    doc.bullets([
        "Do not delete the .pt files if you want detection.",
        "Deleting detections.db clears history and complaints. The file is recreated empty.",
        "Deleting the virtual environment only means you must run pip install again. It does not delete your source.",
    ])
    return doc


def audit(_: dict) -> Doc:
    doc = Doc("07_Final_Project_Audit_Report", "Final Project Audit Report — RoadScan AI", "Final Project Audit Report")
    doc.h1("1. Audit statement")
    doc.p(
        f"This audit reviews the RoadScan AI implementation against the objectives of the MCA project “{META['title']}”. "
        f"The review is a source and design audit of the repository as implemented for {META['student']} (Roll No. {META['roll']}), "
        f"guided by {META['guide']}. It is not a certified software-security assessment and it is not a pavement-engineering validation."
    )
    doc.p(
        "Method: read the Flask application, the React routes, the API client, the about-page scope, the README, and the connection notes; "
        "compare them with the requirements in the project report; record gaps without inventing benchmark scores."
    )
    doc.h1("2. Objective coverage")
    doc.table(
        ["Objective", "Evidence", "Result"],
        [
            ["Detect damage with YOLOv8", "app.py loads YOLO and exposes /api/detect/image, /video, and /frame.", "Met, provided a weight file is present."],
            ["Web UI for image and video", "Routes /detect/image and /detect/video.", "Met."],
            ["Live camera", "LiveCamera page and /api/detect/frame. Frames are not stored.", "Met."],
            ["Severity and risk", "severity() and compute_risk() are deterministic and documented.", "Met as a visual estimate. Not an official index."],
            ["History", "SQLite history table and History page.", "Met."],
            ["Analytics", "Analytics page and dashboard stats route.", "Met, with a stat-mapping defect noted below."],
            ["Maps only from real GPS", "read_geo rejects invalid numbers. Heatmap returns stored buckets only.", "Met."],
            ["Citizen complaint", "complaints table and Citizen Report page. Minimum text length enforced.", "Met."],
            ["Repair trail", "Four statuses and status_history.", "Met. Transitions are not strictly ordered."],
            ["Honest failure", "503 without weights. Client error when the host is down. Demo badges separated from model badges.", "Met."],
            ["Publish measured accuracy", "No precision, recall, or mAP artefact is stored in the project.", "Not met. Must not be claimed orally as if it were."],
            ["Secure multi-user accounts", "AuthContext writes localStorage only. API does not verify a user.", "Not met. Acceptable only if described as a demo session."],
        ],
    )
    doc.h1("3. Findings")
    doc.h2("Finding F-01 — Dashboard video count is not computed")
    doc.p(
        "GET /api/dashboard/stats returns files, damages, and high from the history table. It does not split image and video. "
        "The client then assigns files to totalImages and sets totalVideos to 0. A dashboard card for videos can therefore read zero even after successful video jobs. History itself still stores type video."
    )
    doc.p("Rating: minor functional defect. Recommendation: count by type in SQL and map the fields directly.")
    doc.h2("Finding F-02 — Annotated stills are served as video/mp4")
    doc.p(
        "The outputs route passes mimetype video/mp4 for every file name. JPEG results may rely on the browser sniffing the bytes. "
        "A strict client can fail to display a still."
    )
    doc.p("Rating: minor. Recommendation: choose image/jpeg or video/mp4 from the extension.")
    doc.h2("Finding F-03 — API is not tied to the login session")
    doc.p(
        "Anyone who can open port 5000 can post images, read history, delete a history row, and change a repair status. "
        "CORS does not add an authentication check. For a classroom laptop this is the intended simplicity. For any shared network it is an exposure."
    )
    doc.p("Rating: accepted limitation for the academic build. Recommendation: say this in the viva. Do not deploy the server on a public IP in this form.")
    doc.h2("Finding F-04 — No held-out accuracy sheet")
    doc.p(
        "A detector without a reported evaluation can look stronger in a demo than it is on unseen roads. compare_models.py can print counts on local images. Those counts are not a test set score."
    )
    doc.p("Rating: documentation gap. Recommendation: add a one-page evaluation when a labelled sample is available, and keep the low-confidence note about best.pt.")
    doc.h2("Finding F-05 — Video recall is bounded on purpose")
    doc.p(
        "Stride and the 90-frame cap make the demo usable and can skip a short-lived defect. The API returns frames_processed, frames_total, and stride, so the limitation is visible."
    )
    doc.p("Rating: accepted design trade-off. Recommendation: mention it whenever a video result is shown.")
    doc.h2("Finding F-06 — Upload type is enforced by decoding, not by an allow-list")
    doc.p(
        "A file that OpenCV cannot read is rejected. A very large video can still consume disk under uploads before the cap stops inference. There is no virus scan and no maximum byte check."
    )
    doc.p("Rating: acceptable on a personal demo machine. Recommendation: add a size limit before any wider use.")
    doc.h2("Finding F-07 — Repair state machine is open")
    doc.p("The API allows any permitted status from any other permitted status, including moving backward. The audit diagram shows the intended direction only.")
    doc.p("Rating: minor process gap. Recommendation: reject illegal jumps if the department wants a strict workflow.")
    doc.h2("Finding F-08 — College name is not in the source")
    doc.p(
        "About.tsx records the student, roll number, and guide. It does not record the college. Covers in this documentation set leave a blank line so the wrong institution is not printed."
    )
    doc.p("Rating: administrative. Recommendation: fill the college and university lines before binding the report.")
    doc.h1("4. Control checklist")
    doc.table(
        ["Control", "Status"],
        [
            ["Weight file is loaded once and the reloader is off", "Present"],
            ["Missing model returns 503", "Present"],
            ["Invalid GPS is dropped", "Present"],
            ["Complaint text length is checked", "Present"],
            ["Repair status is checked against a set of four values", "Present"],
            ["Live frames do not write history", "Present"],
            ["History delete is limited to the history table", "Present"],
            ["Passwords are not stored on the server", "True, because there is no server account. Also means there is no server-side control."],
            ["SQL table name is not taken from free text beyond two fixed kinds", "Present, with a caution to keep it that way"],
            ["Evaluation metrics file", "Absent"],
            ["Automated test suite with stored results", "Absent. smoke_test.py calls a local video path and a running server. It is a manual probe, not a CI suite."],
        ],
    )
    doc.h1("5. Standards of description")
    doc.p(
        "The audit accepts the project language when it says “visual estimate”. The audit would reject any slide or sentence that states a specific mAP, "
        "a percentage of Indian roads covered, or a claim that the tool is approved for official inspection, because those statements are not supported by the repository."
    )
    doc.h1("6. Readiness opinion")
    doc.p(
        "The build is ready for an MCA final-year demonstration of a deep-learning web system, on the condition that the student: "
        "(1) starts from a machine where /api/health shows the intended weight file, "
        "(2) explains severity, risk, frame skipping, and the local login in one sentence each, "
        "(3) does not quote an accuracy number that was not measured, and "
        "(4) writes the college name on the bound cover."
    )
    doc.p(
        "The build is not ready to be exposed on the public internet or to be used as the sole basis for a repair payment."
    )
    doc.h1("7. Sign-off")
    doc.table(
        ["Role", "Name", "Signature", "Date"],
        [
            ["Student", META["student"], "", ""],
            ["Guide", META["guide"], "", ""],
            ["Examiner", "", "", ""],
        ],
    )
    doc.p("Audit version 1.0. Findings F-01 through F-08 stand until the source changes and this report is revised.")
    return doc


def all_documents(diagrams: dict) -> list[Doc]:
    return [
        report(diagrams),
        testing(diagrams),
        abstract(diagrams),
        uml(diagrams),
        manual(diagrams),
        installation(diagrams),
        audit(diagrams),
    ]
