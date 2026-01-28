"use client";

import dynamic from "next/dynamic";
import { useReducedMotion } from "./hooks/useReducedMotion";

const LoadingLotusCanvas = dynamic(
  () => import("./LoadingLotusCanvas").then((mod) => mod.LoadingLotusCanvas),
  {
    ssr: false,
    loading: () => <span className="animate-think">Seeking...</span>,
  }
);

export function LoadingLotus() {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <span className="animate-think">Seeking...</span>;
  }

  return <LoadingLotusCanvas />;
}
