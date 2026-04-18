import { clsx } from "clsx";

interface StatCardProps {
  label: string; value: string | number;
  sub?: string; progress?: number; accent?: boolean;
}

export function StatCard({ label, value, sub, progress, accent }: StatCardProps) {
  return (
    <div className={clsx("stat-card", accent && "border-green-300")}>
      <p className="text-[10px] font-semibold text-gray-400 tracking-[0.08em] uppercase mb-2">{label}</p>
      <p className="font-display text-[28px] text-gray-900 leading-none mb-1.5">{value}</p>
      {sub && <p className="text-[11px] text-gray-400">{sub}</p>}
      {progress != null && (
        <div className="flex items-center gap-2 mt-1.5">
          <div className="progress-bar flex-1">
            <div className="progress-fill transition-all duration-700" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
          </div>
          <span className="text-[11px] text-gray-400 font-mono flex-shrink-0">{Math.round(progress)}%</span>
        </div>
      )}
    </div>
  );
}
