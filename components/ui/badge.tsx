import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
}

const variantClasses = {
  default: "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900",
  secondary: "bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-white",
  destructive: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  outline: "border border-slate-300 text-slate-900 dark:border-slate-600 dark:text-white",
  success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
