import { type DOMElement, measureElement } from "ink";
import { useEffect, useRef, useState } from "react";

export function useMeasuredSize(
  width: number | string,
  height: number | string,
) {
  const containerRef = useRef<DOMElement | null>(null);
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const [measuredHeight, setMeasuredHeight] = useState(0);

  const needsMeasure = typeof width === "string" || typeof height === "string";
  useEffect(() => {
    if (!needsMeasure) return;
    if (!containerRef.current) return;

    const { width: w, height: h } = measureElement(containerRef.current);
    if (w > 0) setMeasuredWidth(w);
    if (h > 0) setMeasuredHeight(h);
  });

  return {
    containerRef,
    resolvedWidth: typeof width === "number" ? width : measuredWidth,
    resolvedHeight: typeof height === "number" ? height : measuredHeight,
  };
}
