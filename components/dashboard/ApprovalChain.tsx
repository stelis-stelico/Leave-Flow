"use client";
import { clsx } from "clsx";
import { Check } from "lucide-react";
import type { ApprovalStep } from "@/lib/types";

export function ApprovalChain({ steps, compact }: { steps: ApprovalStep[]; compact?: boolean }) {
  return (
    <div className="flex flex-col">
      {steps.map((step, i) => (
        <div key={step.level}>
          <ApproverRow step={step} compact={compact} />
          {i < steps.length - 1 && (
            <div className={clsx("w-px h-2.5 ml-[15px] my-0.5", step.status === "done" ? "bg-green-400" : "bg-green-100")} />
          )}
        </div>
      ))}
    </div>
  );
}

function ApproverRow({ step, compact }: { step: ApprovalStep; compact?: boolean }) {
  const isDone   = step.status === "done";
  const isActive = step.status === "active";
  const isWait   = step.status === "waiting";

  return (
    <div className={clsx(
      "flex items-start gap-2.5 p-2.5 rounded-lg",
      isDone   && "bg-green-50 border border-green-200",
      isActive && "bg-green-50/50 border border-green-300",
      isWait   && "bg-gray-50 border border-gray-100"
    )}>
      <div className={clsx(
        "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold font-mono",
        isDone   && "bg-green-100 text-green-700 border border-green-300",
        isActive && "bg-green-600 text-white shadow-sm",
        isWait   && "bg-gray-100 text-gray-400 border border-gray-200"
      )}>
        {isDone ? <Check size={10} strokeWidth={2.5} /> : step.level}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-900 leading-tight">{step.approver_name ?? `Step ${step.level}`}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">{step.label}</p>
        {!compact && (
          <p className={clsx("text-[10px] mt-1",
            isDone   && "text-green-600",
            isActive && "text-green-600",
            isWait   && "text-gray-300"
          )}>
            {isDone   && step.acted_at ? `Approved · ${new Date(step.acted_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}` : isDone ? "Approved" : ""}
            {isActive ? "Notified · awaiting review" : ""}
            {isWait   ? "Not yet reached" : ""}
          </p>
        )}
        {!compact && isDone && step.comment && (
          <p className="text-[10px] text-gray-400 mt-1 italic">"{step.comment}"</p>
        )}
      </div>
    </div>
  );
}

export function MiniStepper({ steps }: { steps: ApprovalStep[] }) {
  return (
    <div className="flex items-center mt-2">
      {steps.map((step, i) => (
        <div key={step.level} className="flex items-center">
          <div className="flex items-center gap-1">
            <div className={clsx(
              "w-[18px] h-[18px] rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-bold font-mono",
              step.status === "done"    && "bg-green-100 border border-green-400 text-green-700",
              step.status === "active"  && "bg-green-600 text-white",
              step.status === "waiting" && "bg-gray-100 border border-gray-200 text-gray-400"
            )}>
              {step.status === "done" ? <Check size={9} strokeWidth={2.5} /> : step.level}
            </div>
            <span className={clsx("text-[9px] font-semibold tracking-wide uppercase",
              step.status === "done"    && "text-green-600",
              step.status === "active"  && "text-green-600",
              step.status === "waiting" && "text-gray-300"
            )}>
              {step.label.split(" ")[0]}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={clsx("w-5 h-px mx-0.5 flex-shrink-0",
              step.status === "done" ? "bg-green-300" : "bg-gray-200"
            )} />
          )}
        </div>
      ))}
    </div>
  );
}
