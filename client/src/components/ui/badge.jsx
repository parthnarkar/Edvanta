import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-lg border px-3 py-1 text-xs font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-white shadow-soft hover:bg-primary-600",
        secondary:
          "border-transparent bg-primary/10 text-primary hover:bg-primary/20",
        destructive:
          "border-transparent bg-destructive text-white shadow-soft hover:bg-red-600",
        outline: "text-primary border-primary hover:bg-primary/10",
        success:
          "border-transparent bg-success text-white shadow-soft hover:bg-green-600",
        warning:
          "border-transparent bg-primary text-white shadow-soft hover:bg-primary-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
