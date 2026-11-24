import React from "react";

export function BrandLogoIcon({
  className = "w-full h-full object-cover rounded-xl",
  size,
}: {
  className?: string;
  size?: number;
  color?: string;
}) {
  return (
    <img
      src="/images/logo-d-oleh2.webp"
      alt="D OLEH-OLEH"
      className={className}
      style={
        size
          ? { width: Math.round(size * 1.45), height: size, objectFit: "cover" }
          : undefined
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
    sm: "h-8 w-11 rounded-lg",
    md: "h-10 w-14 sm:h-11 sm:w-16 rounded-xl",
    lg: "h-12 w-18 sm:h-14 sm:w-20 rounded-2xl",
  };

  return (
    <span
      className={`inline-flex items-center justify-center overflow-hidden shadow-xs shrink-0 border border-[#1b3d2b]/20 ${sizeClasses[size]} ${className}`}
    >
      <img
        src="/images/logo-d-oleh2.webp"
        alt="D OLEH-OLEH"
        className="h-full w-full object-cover"
      />
    </span>
  );
}
