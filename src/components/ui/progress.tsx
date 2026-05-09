import { Progress as BaseProgress } from "@base-ui/react/progress";
import { cn } from "../../lib/utils";

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  color?: string;
}

export function Progress({
  value,
  max = 100,
  className,
  color = "bg-slate-900",
}: ProgressProps) {
  return (
    <BaseProgress.Root value={value} max={max}>
      <BaseProgress.Track
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full bg-slate-100",
          className,
        )}
      >
        <BaseProgress.Indicator
          className={cn(
            "h-full rounded-full transition-all duration-500",
            color,
          )}
          style={{ width: `${Math.round((value / max) * 100)}%` }}
        />
      </BaseProgress.Track>
    </BaseProgress.Root>
  );
}
