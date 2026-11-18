import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const sections = [
  {
    title: "Abstract",
    body: "Indian Road Damage & Pothole Detection System Using Deep Learning is an intelligent web application that detects potholes and damaged road surfaces from images and videos using a YOLOv8 deep learning model designed for Indian road conditions (potholes, longitudinal/transverse/alligator cracks).",
  },
  {
    title: "Problem Statement",
    body: "Manual road inspection is slow, inconsistent, and expensive. Municipal teams need a faster way to identify potholes, cracks, and broken surfaces from everyday photo and video captures.",
  },
  {
    title: "Objectives",
    body: "1) Detect multiple road-damage classes with YOLOv8. 2) Provide a web UI for image and video analysis. 3) Estimate damage severity for prioritization. 4) Maintain detection history and analytics for reporting.",
  },
  {
    title: "Existing System Limitations",
    body: "Many existing demos are desktop-only, lack severity logic, do not separate demo vs real inference, or are not designed around Indian road datasets and a student-friendly full-stack workflow.",
  },
  {
    title: "Proposed System",
    body: "A React dashboard for upload and visualization, plus a Flask REST API that loads YOLOv8 weights, runs OpenCV + Ultralytics inference, stores SQLite history, and returns annotated media with confidence scores and severity estimates.",
  },
  {
    title: "Methodology",
    body: "Dataset preparation (RDD / India-oriented damage classes) → YOLO training/fine-tuning → evaluation → Flask inference service → React UI with adjustable confidence threshold and bounding-box severity heuristics.",
  },
  {
    title: "Technology Stack",
    body: "Frontend: React, TypeScript, Tailwind CSS, Recharts. Backend: Python, Flask, OpenCV, Ultralytics YOLOv8, SQLite. Auth: local demo session (can migrate to Supabase).",
  },
  {
    title: "Future Scope",
    body: "GPS geotagging of detections, mobile capture app, PostgreSQL multi-user deployments, municipal dashboards, and continuous model retraining on new Indian city imagery.",
  },
];

export function AboutPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-50 sm:text-3xl">About Project</h1>
        <p className="mt-1 text-sm text-slate-400">
          MCA final-year project documentation for synopsis, report, and viva.
        </p>
      </div>

      <Card className="animate-fade-up border-blue-500/30 bg-blue-500/5">
        <CardHeader>
          <CardTitle>Team / Developer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-300">
          <p>
            <span className="text-slate-500">Student:</span> Tushar Ravidas Jarwal
          </p>
          <p>
            <span className="text-slate-500">Roll No:</span> 19
          </p>
          <p>
            <span className="text-slate-500">Guide:</span> Professor Ajay Patil
          </p>
          <p>
            <span className="text-slate-500">Project:</span> Indian Road Damage & Pothole Detection
            System Using Deep Learning
          </p>
          <p>
            <span className="text-slate-500">Program:</span> MCA Final Year Project
          </p>
          <p className="pt-2 text-xs text-slate-500">
            Tip: edit this card in <code>frontend/src/pages/About.tsx</code> if your college name
            should be listed too.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {sections.map((s) => (
          <Card key={s.title} className="animate-fade-up">
            <CardHeader>
              <CardTitle>{s.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-slate-300">{s.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
