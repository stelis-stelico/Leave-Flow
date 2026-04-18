// ─── EMAIL TEMPLATES ─────────────────────────────────────────────
// Clean, professional HTML emails matching the green/white brand

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const baseStyles = `
  body { margin:0; padding:0; background:#f0faf1; font-family:'Helvetica Neue',Helvetica,Arial,sans-serif; }
  .wrapper { max-width:560px; margin:32px auto; background:#ffffff; border-radius:12px; border:1px solid #dcf2de; overflow:hidden; }
  .header { background:#16a34a; padding:28px 32px 24px; }
  .header h1 { margin:0; font-size:20px; color:#ffffff; font-weight:600; letter-spacing:-0.3px; }
  .header p { margin:4px 0 0; font-size:13px; color:rgba(255,255,255,0.8); }
  .body { padding:28px 32px; }
  .label { font-size:11px; font-weight:600; color:#6b7280; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:4px; }
  .value { font-size:14px; color:#111827; margin-bottom:16px; }
  .row { display:flex; gap:24px; margin-bottom:4px; }
  .detail-box { background:#f0faf1; border:1px solid #b8e5bc; border-radius:8px; padding:16px 20px; margin:16px 0; }
  .detail-row { display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #dcf2de; font-size:13px; }
  .detail-row:last-child { border-bottom:none; }
  .detail-key { color:#6b7280; }
  .detail-val { color:#111827; font-weight:500; text-align:right; }
  .btn { display:inline-block; background:#16a34a; color:#ffffff !important; text-decoration:none; padding:11px 24px; border-radius:8px; font-size:13px; font-weight:600; margin:8px 0; }
  .btn-outline { display:inline-block; background:#ffffff; color:#16a34a !important; text-decoration:none; padding:10px 22px; border-radius:8px; font-size:13px; font-weight:600; margin:8px 0; border:1.5px solid #16a34a; }
  .status-badge { display:inline-block; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:600; }
  .status-pending  { background:#fef3c7; color:#92400e; }
  .status-approved { background:#dcfce7; color:#166534; }
  .status-rejected { background:#fee2e2; color:#991b1b; }
  .footer { background:#f9fafb; border-top:1px solid #e5e7eb; padding:16px 32px; font-size:11px; color:#9ca3af; text-align:center; }
  .footer a { color:#16a34a; text-decoration:none; }
`;

function wrap(headerTitle: string, headerSub: string, body: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><style>${baseStyles}</style></head>
<body><div class="wrapper">
  <div class="header"><h1>🌿 ${headerTitle}</h1><p>${headerSub}</p></div>
  <div class="body">${body}</div>
  <div class="footer">LeaveFlow · Paperless Leave Management &nbsp;|&nbsp; <a href="${BASE_URL}">Open app</a><br/>This is an automated notification — please do not reply directly to this email.</div>
</div></body></html>`;
}

export interface LeaveEmailData {
  staffName:    string;
  staffEmail:   string;
  leaveType:    string;
  leaveIcon:    string;
  startDate:    string;
  endDate:      string;
  workingDays:  number;
  reason:       string;
  reference:    string;
  handover?:    string;
  approverName?: string;
  comment?:     string;
  requestUrl:   string;
}

// ── 1. Staff: request submitted ───────────────────────────────────
export function emailRequestSubmitted(d: LeaveEmailData) {
  return {
    subject: `Leave request submitted — ${d.reference}`,
    html: wrap(
      "Request Submitted",
      `Your leave request has been received and is awaiting approval`,
      `<p style="font-size:14px;color:#374151;margin:0 0 20px">Hi <strong>${d.staffName}</strong>,</p>
       <p style="font-size:14px;color:#374151;margin:0 0 20px">Your leave request has been submitted and is now with the <strong>Head of Department</strong> for review.</p>
       <div class="detail-box">
         <div class="detail-row"><span class="detail-key">Reference</span><span class="detail-val" style="font-family:monospace;color:#16a34a">${d.reference}</span></div>
         <div class="detail-row"><span class="detail-key">Leave type</span><span class="detail-val">${d.leaveIcon} ${d.leaveType}</span></div>
         <div class="detail-row"><span class="detail-key">Dates</span><span class="detail-val">${d.startDate} – ${d.endDate}</span></div>
         <div class="detail-row"><span class="detail-key">Duration</span><span class="detail-val">${d.workingDays} working day${d.workingDays !== 1 ? "s" : ""}</span></div>
         ${d.handover ? `<div class="detail-row"><span class="detail-key">Handover</span><span class="detail-val">${d.handover}</span></div>` : ""}
       </div>
       <p style="margin:20px 0 8px"><a href="${d.requestUrl}" class="btn">Track your request →</a></p>
       <p style="font-size:12px;color:#9ca3af;margin:12px 0 0">You'll receive an email at each approval stage.</p>`
    ),
  };
}

// ── 2. Approver: action required ─────────────────────────────────
export function emailApprovalRequired(d: LeaveEmailData & { approverName: string; stepLabel: string; approvalsUrl: string }) {
  return {
    subject: `Action required — Leave request from ${d.staffName}`,
    html: wrap(
      "Approval Required",
      `A leave request is awaiting your review as ${d.stepLabel}`,
      `<p style="font-size:14px;color:#374151;margin:0 0 20px">Hi <strong>${d.approverName}</strong>,</p>
       <p style="font-size:14px;color:#374151;margin:0 0 20px">A leave request from <strong>${d.staffName}</strong> requires your approval.</p>
       <div class="detail-box">
         <div class="detail-row"><span class="detail-key">Reference</span><span class="detail-val" style="font-family:monospace;color:#16a34a">${d.reference}</span></div>
         <div class="detail-row"><span class="detail-key">Leave type</span><span class="detail-val">${d.leaveIcon} ${d.leaveType}</span></div>
         <div class="detail-row"><span class="detail-key">Dates</span><span class="detail-val">${d.startDate} – ${d.endDate}</span></div>
         <div class="detail-row"><span class="detail-key">Duration</span><span class="detail-val">${d.workingDays} working day${d.workingDays !== 1 ? "s" : ""}</span></div>
         <div class="detail-row"><span class="detail-key">Reason</span><span class="detail-val" style="max-width:200px;text-align:right">${d.reason}</span></div>
         ${d.handover ? `<div class="detail-row"><span class="detail-key">Handover</span><span class="detail-val">${d.handover}</span></div>` : ""}
       </div>
       <p style="margin:20px 0 8px">
         <a href="${d.approvalsUrl}" class="btn">Review in LeaveFlow →</a>
       </p>
       <p style="font-size:12px;color:#9ca3af;margin:12px 0 0">Please log in to approve or reject this request with a comment.</p>`
    ),
  };
}

// ── 3. Staff: step approved (not final) ──────────────────────────
export function emailStepApproved(d: LeaveEmailData & { stepLabel: string; nextStepLabel: string }) {
  return {
    subject: `Leave update — Step approved (${d.reference})`,
    html: wrap(
      "Approval Progress",
      `Your request has passed ${d.stepLabel} review`,
      `<p style="font-size:14px;color:#374151;margin:0 0 20px">Hi <strong>${d.staffName}</strong>,</p>
       <p style="font-size:14px;color:#374151;margin:0 0 20px">Good news! Your leave request has been approved by <strong>${d.stepLabel}</strong> and has been forwarded to <strong>${d.nextStepLabel}</strong> for final approval.</p>
       <div class="detail-box">
         <div class="detail-row"><span class="detail-key">Reference</span><span class="detail-val" style="font-family:monospace;color:#16a34a">${d.reference}</span></div>
         <div class="detail-row"><span class="detail-key">Leave type</span><span class="detail-val">${d.leaveIcon} ${d.leaveType}</span></div>
         <div class="detail-row"><span class="detail-key">Dates</span><span class="detail-val">${d.startDate} – ${d.endDate}</span></div>
         <div class="detail-row"><span class="detail-key">Status</span><span class="detail-val"><span class="status-badge status-pending">With ${d.nextStepLabel}</span></span></div>
       </div>
       <p style="margin:20px 0 8px"><a href="${d.requestUrl}" class="btn-outline">Track progress →</a></p>`
    ),
  };
}

// ── 4. Staff: fully approved 🎉 ──────────────────────────────────
export function emailFullyApproved(d: LeaveEmailData) {
  return {
    subject: `🎉 Leave approved — ${d.reference}`,
    html: wrap(
      "Leave Approved! 🎉",
      `Your leave request has been fully approved`,
      `<p style="font-size:14px;color:#374151;margin:0 0 20px">Hi <strong>${d.staffName}</strong>,</p>
       <p style="font-size:14px;color:#374151;margin:0 0 20px">Your leave request has been <strong style="color:#16a34a">fully approved</strong> by HR. Enjoy your time off!</p>
       <div class="detail-box">
         <div class="detail-row"><span class="detail-key">Reference</span><span class="detail-val" style="font-family:monospace;color:#16a34a">${d.reference}</span></div>
         <div class="detail-row"><span class="detail-key">Leave type</span><span class="detail-val">${d.leaveIcon} ${d.leaveType}</span></div>
         <div class="detail-row"><span class="detail-key">Dates</span><span class="detail-val">${d.startDate} – ${d.endDate}</span></div>
         <div class="detail-row"><span class="detail-key">Duration</span><span class="detail-val">${d.workingDays} working day${d.workingDays !== 1 ? "s" : ""}</span></div>
         <div class="detail-row"><span class="detail-key">Status</span><span class="detail-val"><span class="status-badge status-approved">✓ Approved</span></span></div>
       </div>
       <p style="font-size:13px;color:#6b7280;margin:16px 0">A PDF approval letter is available for download in the app.</p>
       <p style="margin:8px 0"><a href="${d.requestUrl}" class="btn">View approval letter →</a></p>`
    ),
  };
}

// ── 5. Staff: rejected ────────────────────────────────────────────
export function emailRejected(d: LeaveEmailData & { rejectedBy: string }) {
  return {
    subject: `Leave request declined — ${d.reference}`,
    html: wrap(
      "Request Declined",
      `Your leave request was not approved`,
      `<p style="font-size:14px;color:#374151;margin:0 0 20px">Hi <strong>${d.staffName}</strong>,</p>
       <p style="font-size:14px;color:#374151;margin:0 0 20px">Unfortunately your leave request has been <strong style="color:#dc2626">declined</strong> by <strong>${d.rejectedBy}</strong>.</p>
       <div class="detail-box">
         <div class="detail-row"><span class="detail-key">Reference</span><span class="detail-val" style="font-family:monospace;color:#dc2626">${d.reference}</span></div>
         <div class="detail-row"><span class="detail-key">Leave type</span><span class="detail-val">${d.leaveIcon} ${d.leaveType}</span></div>
         <div class="detail-row"><span class="detail-key">Dates</span><span class="detail-val">${d.startDate} – ${d.endDate}</span></div>
         <div class="detail-row"><span class="detail-key">Status</span><span class="detail-val"><span class="status-badge status-rejected">✕ Declined</span></span></div>
         ${d.comment ? `<div class="detail-row"><span class="detail-key">Reason given</span><span class="detail-val" style="max-width:200px;text-align:right;color:#dc2626">${d.comment}</span></div>` : ""}
       </div>
       <p style="font-size:13px;color:#6b7280;margin:16px 0">You may submit a new request with adjusted dates or provide additional information for reconsideration.</p>
       <p style="margin:8px 0"><a href="${BASE_URL}/apply" class="btn-outline">Submit new request →</a></p>`
    ),
  };
}
