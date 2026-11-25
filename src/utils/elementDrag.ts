import type { DragEvent } from "react";

/**
 * Drag & drop from the left panel onto the canvas.
 *
 * A panel tile calls `elementDragProps(add)`; while it is dragged we remember its
 * "add to canvas" function here. The canvas reads it on drop (see
 * `dropDraggedElement` in FabricContext), runs it and moves the new object under
 * the cursor. Using a module-level slot avoids serialising large payloads
 * (e.g. 1 MB SVGs) through `dataTransfer`.
 */
export const ELEMENT_DRAG_MIME = "application/x-themebuilder-element";

type AddFn = () => void | Promise<void>;

let currentDrag: AddFn | null = null;

export function takeDraggedElement(): AddFn | null {
  const add = currentDrag;
  currentDrag = null;
  return add;
}

export function isElementDrag(event: { dataTransfer: DataTransfer | null }): boolean {
  return Boolean(event.dataTransfer?.types?.includes(ELEMENT_DRAG_MIME));
}

export function elementDragProps(add: AddFn) {
  return {
    draggable: true as const,
    onDragStart: (event: DragEvent<HTMLElement>) => {
      currentDrag = add;
      event.dataTransfer.effectAllowed = "copy";
      event.dataTransfer.setData(ELEMENT_DRAG_MIME, "1");
      event.dataTransfer.setData("text/plain", "");
    },
    onDragEnd: () => {
      currentDrag = null;
    },
  };
}
