import { clsx } from "clsx";

export function Card({ children, className, hover }: {
  children: React.ReactNode; className?: string; hover?: boolean;
}) {
  return <div className={clsx("card", hover && "card-hover", className)}>{children}</div>;
}

export function CardHeader({ title, subtitle, right }: {
  title: string; subtitle?: string; right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-green-100 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {right && <div className="self-start sm:self-auto">{right}</div>}
    </div>
  );
}

export function CardBody({ children, className }: {
  children: React.ReactNode; className?: string;
}) {
  return <div className={clsx("px-4 py-3.5", className)}>{children}</div>;
}
