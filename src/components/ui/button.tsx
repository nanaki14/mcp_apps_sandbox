import { Button as BaseButton } from "@base-ui/react/button";
import { cn } from "../../lib/utils";

type Variant = "default" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends Omit<React.ComponentProps<typeof BaseButton>, "className"> {
  variant?: Variant;
  size?: Size;
  className?: string;
}

const variantClass: Record<Variant, string> = {
  default:
    "bg-slate-900 text-white hover:bg-slate-700 active:bg-slate-800 disabled:opacity-50",
  outline:
    "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50",
  ghost:
    "text-slate-700 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-50",
};

const sizeClass: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-6 text-base",
};

export function Button({
  variant = "default",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return (
    <BaseButton
      className={cn(
        "inline-flex cursor-pointer items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900",
        variantClass[variant],
        sizeClass[size],
        className,
      )}
      {...props}
    />
  );
}
