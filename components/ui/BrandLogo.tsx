import React from "react";

export function BrandLogoIcon({
  className = "w-5 h-5",
  size,
  color,
}: {
  className?: string;
  size?: number;
  color?: string;
}) {
  return (
    <img
      src="/images/logo-d-oleh2.jpg"
      alt="D OLEH2"
      className={className}
      style={size ? { width: size, height: size, objectFit: "contain" } : { objectFit: "contain" }}
      aria-hidden="true"
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
    sm: "h-7 w-7 rounded-lg",
    md: "h-8 w-8 sm:h-9 sm:w-9 rounded-xl",
    lg: "h-10 w-10 sm:h-12 sm:w-12 rounded-2xl",
  };
  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 24,
  };

  return (
    <span
      className={`inline-flex items-center justify-center bg-[#292a23] text-[#E25C00] shadow-xs shrink-0 ${sizeClasses[size]} ${className}`}
    >
      <BrandLogoIcon size={iconSizes[size]} color="#E25C00" />
    </span>
  );
}
