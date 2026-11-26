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
    "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-all active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    {
      default: "bg-[#D97706] text-white hover:bg-[#B45309] shadow-2xs",
      secondary: "bg-[#1C1917] text-white hover:bg-black shadow-2xs",
      outline: "border border-[#E6E1D6] bg-white text-[#1C1917] hover:bg-[#FAF8F5]",
      ghost: "text-[#57534E] hover:bg-stone-100 hover:text-[#1C1917]",
      destructive: "bg-[#B91C1C] text-white hover:bg-[#991B1B]",
    }[variant],
    {
      default: "min-h-[42px] px-4 py-2",
      sm: "min-h-[36px] rounded-lg px-3 text-xs",
      lg: "min-h-[48px] rounded-lg px-6 text-sm sm:text-base",
      icon: "h-10 w-10 rounded-lg",
    }[size],
    className
  )} {...props} />;
});
