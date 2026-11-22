import React from "react";

export function BrandLogoIcon({
  className = "w-full h-full object-contain",
  size,
  color,
}: {
  className?: string;
  size?: number;
  color?: string;
}) {
  return (
    <img
      src="/images/logo-d-oleh2.png"
      alt="D OLEH2"
      className={className}
      style={
        size
          ? { width: size, height: "auto", maxHeight: size, objectFit: "contain" }
          : { objectFit: "contain" }
      }
    />
  );
}

export function BrandLogoBadge({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClasses = {
    sm: "h-8 w-8 rounded-lg",
    md: "h-10 w-10 sm:h-11 sm:w-11 rounded-xl",
    lg: "h-12 w-12 sm:h-14 sm:w-14 rounded-2xl",
  };
  const iconSizes = {
    sm: 24,
    md: 32,
    lg: 42,
  };

  return (
    <span
      className={`inline-flex items-center justify-center bg-white border border-[#e8e5dc] shadow-xs shrink-0 p-1 overflow-hidden ${sizeClasses[size]} ${className}`}
    >
      <BrandLogoIcon size={iconSizes[size]} />
    </span>
  );
}
