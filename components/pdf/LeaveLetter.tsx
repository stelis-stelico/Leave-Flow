"use client";

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";

interface LeaveLetterProps {
  request: {
    reference:    string;
    leave_type:   string;
    leave_label:  string;
    start_date:   string;
    end_date:     string;
    working_days: number;
    reason:       string;
    status:       string;
    created_at:   string;
    staff?: { full_name: string; email: string; department?: string; };
    handover_person?: { full_name: string } | null;
    approvals?: { level: number; status: string; acted_at?: string; approver?: { full_name: string; role: string } }[];
  };
  orgName?: string;
}

export function LeaveLetter({ request, orgName = "Your Organisation" }: LeaveLetterProps) {
  const [loading, setLoading] = useState(false);

  async function generatePDF() {
    setLoading(true);
    try {
      // Dynamically import jsPDF to keep bundle small
      const { jsPDF } = await import("jspdf");

      const doc    = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW  = 210;
      const margin = 20;
      const contentW = pageW - margin * 2;

      // ── GREEN HEADER ─────────────────────────────────────────────
      doc.setFillColor(22, 163, 74); // green-600
      doc.rect(0, 0, pageW, 38, "F");

      // Logo area
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(margin, 9, 20, 20, 2, 2, "F");
      doc.setFontSize(14);
      doc.setTextColor(22, 163, 74);
      doc.setFont("helvetica", "bold");
      doc.text("LF", margin + 5, 22);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text("LeaveFlow", margin + 24, 19);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("Leave Management Platform", margin + 24, 25);
      doc.text(`${orgName}`, margin + 24, 30);

      // Reference badge (top right)
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(request.reference, pageW - margin, 22, { align: "right" });

      // ── DOCUMENT TITLE ────────────────────────────────────────────
      let y = 50;

      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(17, 24, 39);
      doc.text("LEAVE APPROVAL LETTER", pageW / 2, y, { align: "center" });
      y += 6;

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(107, 114, 128);
      doc.text(
        `Issued on ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`,
        pageW / 2, y, { align: "center" }
      );
      y += 10;

      // Status chip
      if (request.status === "approved") {
        doc.setFillColor(220, 252, 231);
        doc.roundedRect(pageW / 2 - 20, y - 4, 40, 8, 2, 2, "F");
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(22, 101, 52);
        doc.text("✓ APPROVED", pageW / 2, y + 1, { align: "center" });
        y += 10;
      }

      // ── SEPARATOR ─────────────────────────────────────────────────
      doc.setDrawColor(220, 242, 222);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageW - margin, y);
      y += 8;

      // ── EMPLOYEE DETAILS ─────────────────────────────────────────
      doc.setFillColor(240, 250, 241);
      doc.roundedRect(margin, y, contentW, 28, 2, 2, "F");

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(75, 85, 99);
      doc.text("EMPLOYEE DETAILS", margin + 4, y + 6);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(17, 24, 39);
      doc.setFontSize(10);
      doc.text(`Name:`, margin + 4, y + 13);
      doc.setFont("helvetica", "bold");
      doc.text(request.staff?.full_name ?? "—", margin + 30, y + 13);

      doc.setFont("helvetica", "normal");
      doc.text(`Email:`, margin + 4, y + 19);
      doc.text(request.staff?.email ?? "—", margin + 30, y + 19);

      if (request.staff?.department) {
        doc.text(`Department:`, margin + 4, y + 25);
        doc.setFont("helvetica", "bold");
        doc.text(request.staff.department, margin + 30, y + 25);
      }

      y += 34;

      // ── LEAVE DETAILS ─────────────────────────────────────────────
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(17, 24, 39);
      doc.text("LEAVE DETAILS", margin, y);
      y += 4;
      doc.setDrawColor(22, 163, 74);
      doc.setLineWidth(1);
      doc.line(margin, y, margin + 30, y);
      y += 6;

      const details: [string, string][] = [
        ["Leave type",    request.leave_label],
        ["Start date",    new Date(request.start_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })],
        ["End date",      new Date(request.end_date).toLocaleDateString("en-GB",   { day: "numeric", month: "long", year: "numeric" })],
        ["Duration",      `${request.working_days} working day${request.working_days !== 1 ? "s" : ""}`],
        ["Submitted",     new Date(request.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })],
        ...(request.handover_person ? [["Handover", request.handover_person.full_name] as [string, string]] : []),
      ];

      details.forEach(([key, val]) => {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(107, 114, 128);
        doc.setFontSize(9);
        doc.text(key, margin, y);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(17, 24, 39);
        doc.setFontSize(10);
        doc.text(val, margin + 45, y);
        y += 7;
      });

      y += 3;

      // ── REASON ───────────────────────────────────────────────────
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(17, 24, 39);
      doc.text("REASON FOR LEAVE", margin, y);
      y += 4;
      doc.setDrawColor(22, 163, 74);
      doc.line(margin, y, margin + 38, y);
      y += 5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(55, 65, 81);
      const reasonLines = doc.splitTextToSize(request.reason, contentW);
      doc.text(reasonLines, margin, y);
      y += reasonLines.length * 5 + 6;

      // ── APPROVAL CHAIN ────────────────────────────────────────────
      if (request.approvals?.length) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(17, 24, 39);
        doc.text("APPROVAL CHAIN", margin, y);
        y += 4;
        doc.setDrawColor(22, 163, 74);
        doc.line(margin, y, margin + 34, y);
        y += 5;

        request.approvals.forEach((ap, i) => {
          if (ap.status !== "approved") return;
          const levelLabel = i === 0 ? "Head of Department" : "HR Manager";
          doc.setFillColor(ap.status === "approved" ? 220 : 254, ap.status === "approved" ? 252 : 226, ap.status === "approved" ? 231 : 202);
          doc.roundedRect(margin, y - 2, contentW, 9, 1, 1, "F");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(22, 101, 52);
          doc.text(`✓ Step ${i + 1} — ${levelLabel}`, margin + 3, y + 4);
          if (ap.approver?.full_name) {
            doc.setFont("helvetica", "normal");
            doc.setTextColor(75, 85, 99);
            doc.text(`Approved by ${ap.approver.full_name}${ap.acted_at ? ` on ${new Date(ap.acted_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` : ""}`, margin + 55, y + 4);
          }
          y += 12;
        });
      }

      // ── FOOTER ───────────────────────────────────────────────────
      y = 268;
      doc.setDrawColor(220, 242, 222);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageW - margin, y);
      y += 5;

      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(156, 163, 175);
      doc.text(
        `This is an official leave approval letter generated by LeaveFlow · ${orgName} · Ref: ${request.reference}`,
        pageW / 2, y, { align: "center" }
      );
      doc.text(
        `Generated on ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}`,
        pageW / 2, y + 4, { align: "center" }
      );

      doc.save(`LeaveFlow-${request.reference}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setLoading(false);
    }
  }

  if (request.status !== "approved") return null;

  return (
    <button
      onClick={generatePDF}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-[12px] font-semibold hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50"
    >
      {loading
        ? <><Loader2 size={13} className="animate-spin" /> Generating…</>
        : <><FileDown size={13} /> Download approval letter</>
      }
    </button>
  );
}
