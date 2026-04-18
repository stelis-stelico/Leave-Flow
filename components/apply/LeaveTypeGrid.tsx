"use client";
import { clsx } from "clsx";
import type { LeaveTypeName } from "@/lib/types";
import { LEAVE_TYPE_META } from "@/lib/types";

const LEAVE_TYPES: LeaveTypeName[] = ["annual", "sick", "maternity_paternity", "emergency", "casual"];

export function LeaveTypeGrid({ selected, onSelect }: {
  selected: LeaveTypeName;
  onSelect: (t: LeaveTypeName) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {LEAVE_TYPES.map((type) => {
        const meta = LEAVE_TYPE_META[type];
        const active = selected === type;
        return (
          <button
            key={type}
            type="button"
            onClick={() => onSelect(type)}
            className={clsx(
              "cursor-pointer rounded-lg border p-3 text-center transition-all duration-150",
              "hover:border-green-300 hover:bg-green-50",
              active ? "border-green-500 bg-green-50 shadow-sm ring-1 ring-green-500/20" : "border-gray-200 bg-white"
            )}
          >
            <div className="mb-1 text-base">{meta.icon}</div>
            <p className={clsx("text-[11px] font-semibold", active ? "text-green-700" : "text-gray-700")}>{meta.label}</p>
          </button>
        );
      })}
    </div>
  );
}
