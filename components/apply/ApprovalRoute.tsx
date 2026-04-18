interface Approver { initials: string; name: string; role: string; }

export function ApprovalRoute({ approvers }: { approvers: Approver[] }) {
  return (
    <div className="flex items-center overflow-x-auto gap-0 pb-1">
      {approvers.map((approver, i) => (
        <div key={i} className="flex items-center flex-shrink-0">
          <div className="text-center min-w-[70px]">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-bold font-mono mx-auto mb-2 ${
              i === 0
                ? "bg-green-600 text-white shadow-sm"
                : "bg-green-50 border-2 border-green-200 text-green-600"
            }`}>
              {approver.initials}
            </div>
            <p className={`text-[11px] font-semibold ${i === 0 ? "text-gray-900" : "text-gray-500"}`}>{approver.name}</p>
            <p className={`text-[9px] mt-0.5 ${i === 0 ? "text-green-600" : "text-gray-400"}`}>{approver.role}</p>
          </div>
          {i < approvers.length - 1 && (
            <div className={`flex-1 h-px min-w-[20px] mx-2 ${
              i === 0 ? "bg-gradient-to-r from-green-400 to-green-200" : "bg-green-100"
            }`} />
          )}
        </div>
      ))}
    </div>
  );
}
