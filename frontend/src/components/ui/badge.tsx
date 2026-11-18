import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-lg border px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "border-blue-500/30 bg-blue-500/15 text-blue-300",
        secondary: "border-slate-600 bg-slate-800 text-slate-300",
        success: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
        warning: "border-amber-500/30 bg-amber-500/15 text-amber-300",
        danger: "border-red-500/30 bg-red-500/15 text-red-300",
        demo: "border-violet-500/30 bg-violet-500/15 text-violet-300",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
