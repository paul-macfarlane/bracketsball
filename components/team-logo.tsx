"use client";

import { useState } from "react";
import { useTheme } from "next-themes";

interface TeamLogoProps {
  logoUrl: string | null;
  darkLogoUrl: string | null;
  alt: string;
  className?: string;
}

export function TeamLogo({
  logoUrl,
  darkLogoUrl,
  alt,
  className,
}: TeamLogoProps) {
  const { resolvedTheme } = useTheme();
  const [useFallback, setUseFallback] = useState(false);

  const src =
    resolvedTheme === "dark" && darkLogoUrl && !useFallback
      ? darkLogoUrl
      : logoUrl;

  if (!src) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setUseFallback(true)}
    />
  );
}
