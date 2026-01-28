"use client";

import dynamic from "next/dynamic";
import { useReducedMotion } from "./hooks/useReducedMotion";

const AmbientBackgroundCanvas = dynamic(
  () => import("./AmbientBackgroundCanvas").then((mod) => mod.AmbientBackgroundCanvas),
  { ssr: false }
);

export function AmbientBackground() {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[1]"
      aria-hidden="true"
    >
      <AmbientBackgroundCanvas />
    </div>
  );
}
