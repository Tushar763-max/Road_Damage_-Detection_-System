import type { HistoryRecord } from "@/types";
import { absoluteMediaUrl } from "@/services/api";

export function openInspectionReport(record: HistoryRecord) {
  const image = absoluteMediaUrl(record.result_url || record.photo_url);

  const rows = (record.detections || [])
    .map(
      (d, idx) => `
      <tr>
        <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 500; color: #1e293b;">#${idx + 1} ${escapeHtml(d.class_name)}</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #475569;">${(d.confidence * 100).toFixed(1)}%</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0;">
          <span style="display: inline-block; padding: 3px 10px; border-radius: 9999px; font-size: 11px; font-weight: 600; text-transform: uppercase; ${getSeverityBadgeStyle(d.severity)}">
            ${d.severity}
          </span>
        </td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 12px;">
          ${typeof d.timestamp === "number" ? `t = ${d.timestamp}s` : d.bbox ? formatBbox(d.bbox) : "N/A"}
        </td>
      </tr>`,
    )
    .join("");

  const riskScore = record.risk_score ?? "N/A";
  const riskCategory = record.risk_category || "Low";
  const repairStatus = (record.repair_status || "reported").replace("_", " ").toUpperCase();
  const hasGps = record.latitude != null && record.longitude != null;
  const gpsCoord = hasGps ? `${record.latitude?.toFixed(6)}, ${record.longitude?.toFixed(6)}` : "Not Available";
  const mapLink = hasGps ? `https://www.google.com/maps?q=${record.latitude},${record.longitude}` : null;

  const popup = window.open("", "_blank", "noopener,noreferrer,width=960,height=800");
  if (!popup) {
    alert("Please allow popups to view and print the inspection report.");
    return;
  }

  popup.document.write(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Road Inspection Report — ${escapeHtml(record.filename || record.id)}</title>
  <style>
    @page {
      size: A4;
      margin: 16mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #f8fafc;
      margin: 0;
      padding: 24px;
      line-height: 1.5;
    }
    .report-card {
      max-width: 860px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }
    .report-header {
      background: linear-gradient(135deg, #0b1329 0%, #1e293b 100%);
      color: #ffffff;
      padding: 32px 36px;
      border-bottom: 3px solid #3b82f6;
    }
    .report-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      background: rgba(59, 130, 246, 0.2);
      border: 1px solid rgba(59, 130, 246, 0.4);
      color: #93c5fd;
      margin-bottom: 12px;
    }
    .demo-tag {
      background: rgba(234, 179, 8, 0.2);
      border-color: rgba(234, 179, 8, 0.4);
      color: #fde047;
    }
    .report-title {
      margin: 0 0 6px 0;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .report-subtitle {
      margin: 0;
      color: #94a3b8;
      font-size: 13px;
    }
    .content-body {
      padding: 32px 36px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 28px;
    }
    @media (max-width: 680px) {
      .summary-grid { grid-template-columns: 1fr; }
    }
    .summary-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px 16px;
    }
    .summary-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      margin-bottom: 4px;
      font-weight: 600;
    }
    .summary-value {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
    }
    .gauge-container {
      margin-top: 6px;
      background: #e2e8f0;
      border-radius: 9999px;
      height: 6px;
      overflow: hidden;
    }
    .gauge-fill {
      height: 100%;
      background: linear-gradient(90deg, #22c55e, #eab308, #ef4444);
    }
    .section-title {
      font-size: 16px;
      font-weight: 700;
      color: #1e293b;
      margin: 28px 0 12px 0;
      display: flex;
      align-items: center;
      gap: 8px;
      border-bottom: 2px solid #f1f5f9;
      padding-bottom: 8px;
    }
    table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      margin-top: 12px;
    }
    th {
      background: #f1f5f9;
      color: #475569;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 12px 14px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }
    .image-preview-container {
      margin-top: 16px;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      overflow: hidden;
      background: #090d16;
      text-align: center;
    }
    .image-preview-container img {
      max-width: 100%;
      max-height: 480px;
      object-fit: contain;
      display: block;
      margin: 0 auto;
    }
    .disclaimer-box {
      margin-top: 32px;
      padding: 16px;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 12px;
      font-size: 12px;
      color: #1e40af;
      line-height: 1.6;
    }
    .toolbar {
      max-width: 860px;
      margin: 0 auto 16px auto;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
    .btn {
      padding: 8px 18px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }
    .btn-primary {
      background: #2563eb;
      color: white;
    }
    .btn-primary:hover {
      background: #1d4ed8;
    }
    .btn-secondary {
      background: #ffffff;
      color: #475569;
      border: 1px solid #cbd5e1;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .toolbar {
        display: none !important;
      }
      .report-card {
        border: none;
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <button class="btn btn-secondary" onclick="window.close()">Close Window</button>
    <button class="btn btn-primary" onclick="window.print()">Print / Save as PDF</button>
  </div>

  <div class="report-card">
    <div class="report-header">
      <span class="report-badge ${record.source === "demo" ? "demo-tag" : ""}">
        ${record.source === "demo" ? "DEMO DATASET RECORD" : "OFFICIAL AI INFERENCE REPORT"}
      </span>
      <h1 class="report-title">Indian Road Damage & Pothole Detection System</h1>
      <p class="report-subtitle">Automated Civil Infrastructure Inspection · YOLOv8 Computer Vision Pipeline</p>
    </div>

    <div class="content-body">
      <div class="summary-grid">
        <div class="summary-box">
          <div class="summary-label">Inspection Date</div>
          <div class="summary-value" style="font-size: 13px;">${new Date(record.created_at).toLocaleString()}</div>
        </div>
        <div class="summary-box">
          <div class="summary-label">Target File / Media</div>
          <div class="summary-value" style="font-size: 13px; word-break: break-all;">${escapeHtml(record.filename)}</div>
        </div>
        <div class="summary-box">
          <div class="summary-label">Media Type</div>
          <div class="summary-value" style="text-transform: uppercase;">${record.type}</div>
        </div>
        <div class="summary-box">
          <div class="summary-label">Location / Area</div>
          <div class="summary-value">${escapeHtml(record.location_name || "Unspecified Area")}</div>
        </div>
        <div class="summary-box">
          <div class="summary-label">GPS Coordinates</div>
          <div class="summary-value" style="font-size: 13px;">
            ${
              mapLink
                ? `<a href="${mapLink}" target="_blank" style="color: #2563eb; text-decoration: none;">${gpsCoord} ↗</a>`
                : gpsCoord
            }
          </div>
        </div>
        <div class="summary-box">
          <div class="summary-label">Repair Status</div>
          <div class="summary-value">
            <span style="display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; ${getRepairBadgeStyle(record.repair_status)}">
              ${repairStatus}
            </span>
          </div>
        </div>
        <div class="summary-box">
          <div class="summary-label">Total Damages Detected</div>
          <div class="summary-value" style="font-size: 20px; color: ${record.total > 0 ? "#dc2626" : "#16a34a"};">
            ${record.total}
          </div>
        </div>
        <div class="summary-box">
          <div class="summary-label">Overall Severity</div>
          <div class="summary-value">
            <span style="display: inline-block; padding: 3px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; ${getSeverityBadgeStyle(record.severity)}">
              ${record.severity || "None"}
            </span>
          </div>
        </div>
        <div class="summary-box">
          <div class="summary-label">Road Risk Score (0–100)</div>
          <div class="summary-value" style="display: flex; align-items: baseline; gap: 6px;">
            <span style="font-size: 20px; font-weight: 800;">${riskScore}</span>
            <span style="font-size: 12px; font-weight: 600; color: #64748b;">/ 100 (${escapeHtml(riskCategory)})</span>
          </div>
          <div class="gauge-container">
            <div class="gauge-fill" style="width: ${typeof record.risk_score === "number" ? Math.min(100, record.risk_score) : 0}%;"></div>
          </div>
        </div>
      </div>

      <div class="section-title">
        <span>Detected Damage Catalog (${record.detections?.length || 0})</span>
      </div>
      ${
        rows
          ? `<table>
              <thead>
                <tr>
                  <th>Damage Class / Type</th>
                  <th>Model Confidence</th>
                  <th>Severity Level</th>
                  <th>Metadata / Bounds</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>`
          : `<div style="padding: 20px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; text-align: center; color: #64748b; font-size: 13px;">
              No road damages detected in this scan. The surface evaluated clear within model confidence thresholds.
            </div>`
      }

      ${
        image
          ? `<div class="section-title">
              <span>Annotated Inspection Imagery</span>
            </div>
            <div class="image-preview-container">
              <img src="${image}" alt="Processed inspection image" />
            </div>`
          : ""
      }

      <div class="disclaimer-box">
        <strong>Technical & Safety Disclaimer:</strong> This inspection document was generated programmatically by the
        Indian Road Damage & Pothole Detection System utilizing a YOLOv8 deep learning architecture. Risk scores and severity
        levels are software-approximated metrics derived from object detection counts, class weights, and bounding-box dimensions.
        This report is designed for civic road monitoring and maintenance prioritization and does not constitute a certified
        structural engineering assessment.
      </div>
    </div>
  </div>
</body>
</html>`);

  popup.document.close();
  popup.focus();
}

function escapeHtml(str?: string | null): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatBbox(bbox: any): string {
  if (Array.isArray(bbox) && bbox.length >= 4) {
    return `[${bbox.map((n) => Math.round(Number(n))).join(", ")}]`;
  }
  if (typeof bbox === "object" && bbox !== null && "x1" in bbox) {
    return `[${Math.round(bbox.x1)}, ${Math.round(bbox.y1)}, ${Math.round(bbox.x2)}, ${Math.round(bbox.y2)}]`;
  }
  return "N/A";
}

function getSeverityBadgeStyle(sev?: string | null): string {
  switch (sev?.toLowerCase()) {
    case "high":
      return "background: #fee2e2; color: #991b1b; border: 1px solid #f87171;";
    case "medium":
      return "background: #fef3c7; color: #92400e; border: 1px solid #fbbf24;";
    case "low":
      return "background: #dcfce7; color: #166534; border: 1px solid #86efac;";
    default:
      return "background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1;";
  }
}

function getRepairBadgeStyle(status?: string | null): string {
  switch (status?.toLowerCase()) {
    case "repaired":
      return "background: #dcfce7; color: #15803d; border: 1px solid #86efac;";
    case "in_progress":
      return "background: #ede9fe; color: #6d28d9; border: 1px solid #c4b5fd;";
    case "assigned":
      return "background: #dbeafe; color: #1d4ed8; border: 1px solid #93c5fd;";
    case "reported":
    default:
      return "background: #fef3c7; color: #b45309; border: 1px solid #fcd34d;";
  }
}
