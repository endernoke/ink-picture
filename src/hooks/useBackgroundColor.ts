import type { DOMElement } from "ink";
import { type RefObject } from "react";

/**
 * Walks up the DOMElement tree from the given ref to find the nearest
 * ancestor Box that has a background color set.
 *
 * This provides the same information as Ink's internal `backgroundContext`.
 */
export default function useBackgroundColor(
  ref: RefObject<DOMElement | null>,
): string | undefined {
  let currentNode: DOMElement | undefined = ref.current ?? undefined;
  while (currentNode) {
    if (currentNode.style?.backgroundColor) {
      return currentNode.style.backgroundColor as string;
    }
    currentNode = currentNode.parentNode;
  }

  return undefined;
}
