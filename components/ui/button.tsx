import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "default", size = "default", ...props }, ref
) {
  return <button ref={ref} className={cn(
    "inline-flex items-center justify-center whitespace-nowrap rounded-none text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007bff] disabled:pointer-events-none disabled:opacity-50",
    { default: "bg-[#007bff] text-white hover:bg-[#0056b3]", secondary: "bg-[#f0f0f0] text-[#292929] hover:bg-[#e0e0e0]", outline: "border border-[#dcdcdc] bg-white hover:bg-[#f8f8f8]", ghost: "hover:bg-black/5", destructive: "bg-red-600 text-white hover:bg-red-700" }[variant],
    { default: "h-11 px-5", sm: "h-9 rounded-none px-3", lg: "h-12 px-7 text-base", icon: "h-10 w-10" }[size], className
  )} {...props} />;
});
