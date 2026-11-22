import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, variant = "default", ...props }: React.HTMLAttributes<HTMLSpanElement> & { variant?: "default" | "secondary" | "outline" }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", { default: "bg-[#E25C00] text-white", secondary: "bg-[#f4f3ee] text-[#5f5d55]", outline: "border border-[#e7e5df] bg-white text-[#5f5d55]" }[variant], className)} {...props} />;
}
