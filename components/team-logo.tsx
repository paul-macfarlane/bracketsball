"use client";

import { useState, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

const emptySubscribe = () => () => {};
const getTrue = () => true;
const getFalse = () => false;

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
  const mounted = useSyncExternalStore(emptySubscribe, getTrue, getFalse);
  const [useFallback, setUseFallback] = useState(false);

  const src =
    mounted && resolvedTheme === "dark" && darkLogoUrl && !useFallback
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
