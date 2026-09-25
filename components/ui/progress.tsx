import { cn } from "cn";

function Progress({
  value,
  className,
  barClassName,
}: {
  value: number;
  className?: string;
  barClassName?: string;
}) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("bg-muted h-1.5 w-full overflow-hidden rounded-full", className)}
    >
      <div
        className={cn("bg-primary h-full rounded-full transition-all duration-500", barClassName)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export { Progress };
