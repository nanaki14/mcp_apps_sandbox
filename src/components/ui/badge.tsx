import { cn } from "../../lib/utils";

type Variant = "default" | "secondary" | "success";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

const variantClass: Record<Variant, string> = {
  default: "bg-slate-900 text-white",
  secondary: "bg-slate-100 text-slate-700",
  success: "bg-emerald-100 text-emerald-700",
};

export function Badge({
  variant = "default",
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantClass[variant],
        className,
      )}
      {...props}
    />
  );
}
