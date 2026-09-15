import {
  useState,
  type MouseEvent,
} from "react";

import { useEditor } from "../../context/EditorContext";

interface CanvasProps {
  backgroundColor?: string;
}

export default function Canvas({
  backgroundColor = "#ffffff",
}: CanvasProps) {
  const {
    elements,
    selectedId,
    selectElement,
    updateElement,
  } = useEditor();

  const [draggingId, setDraggingId] =
    useState<string | null>(null);

  const [resizingId, setResizingId] =
    useState<string | null>(null);

  const [dragStart, setDragStart] = useState({
    mouseX: 0,
    mouseY: 0,
    elementX: 0,
    elementY: 0,
  });

  const [resizeStart, setResizeStart] =
    useState({
      mouseX: 0,
      mouseY: 0,
      width: 0,
      height: 0,
    });

  const startDragging = (
    event: MouseEvent,
    elementId: string,
    elementX: number,
    elementY: number
  ) => {
    event.preventDefault();
    event.stopPropagation();

    selectElement(elementId);

    setDraggingId(elementId);

    setDragStart({
      mouseX: event.clientX,
      mouseY: event.clientY,
      elementX,
      elementY,
    });
  };

  const startResizing = (
    event: MouseEvent,
    elementId: string,
    width: number,
    height: number
  ) => {
    event.preventDefault();
    event.stopPropagation();

    selectElement(elementId);

    setResizingId(elementId);

    setResizeStart({
      mouseX: event.clientX,
      mouseY: event.clientY,
      width,
      height,
    });
  };

  const handleMouseMove = (
    event: MouseEvent
  ) => {
    if (draggingId) {
      const deltaX =
        event.clientX - dragStart.mouseX;

      const deltaY =
        event.clientY - dragStart.mouseY;

      updateElement(draggingId, {
        x: Math.max(
          0,
          dragStart.elementX + deltaX
        ),
        y: Math.max(
          0,
          dragStart.elementY + deltaY
        ),
      });
    }

    if (resizingId) {
      const deltaX =
        event.clientX - resizeStart.mouseX;

      const deltaY =
        event.clientY - resizeStart.mouseY;

      updateElement(resizingId, {
        width: Math.max(
          50,
          resizeStart.width + deltaX
        ),
        height: Math.max(
          30,
          resizeStart.height + deltaY
        ),
      });
    }
  };

  const handleMouseUp = () => {
    setDraggingId(null);
    setResizingId(null);
  };

  return (
    <div
      className="flex-1 overflow-auto bg-gray-200 p-10"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={() => selectElement(null)}
    >
      <div
        className="relative mx-auto shadow-2xl overflow-hidden"
        style={{
          width: "900px",
          height: "650px",
          backgroundColor,
        }}
        onClick={(event) =>
          event.stopPropagation()
        }
      >

        {/* Decorative Certificate Border */}

        <div
          className="absolute inset-4 border-2 pointer-events-none"
          style={{
            borderColor: "#374151",
          }}
        />

        <div
          className="absolute inset-7 border pointer-events-none"
          style={{
            borderColor: "#9ca3af",
          }}
        />

        {elements.map((element) => {
          const isSelected =
            selectedId === element.id;

          const baseStyle = {
            position: "absolute" as const,
            left: element.x,
            top: element.y,
            width: element.width,
            height: element.height,
          };

          // Rectangle
          if (element.type === "rectangle") {
            return (
              <div
                key={element.id}
                onMouseDown={(event) =>
                  startDragging(
                    event,
                    element.id,
                    element.x,
                    element.y
                  )
                }
                style={{
                  ...baseStyle,
                  backgroundColor:
                    element.backgroundColor,
                  border: isSelected
                    ? "2px solid #2563eb"
                    : "none",
                  cursor: "move",
                }}
              >
                {isSelected && (
                  <ResizeHandle
                    onMouseDown={(event) =>
                      startResizing(
                        event,
                        element.id,
                        element.width,
                        element.height
                      )
                    }
                  />
                )}
              </div>
            );
          }

          // Circle
          if (element.type === "circle") {
            return (
              <div
                key={element.id}
                onMouseDown={(event) =>
                  startDragging(
                    event,
                    element.id,
                    element.x,
                    element.y
                  )
                }
                style={{
                  ...baseStyle,
                  backgroundColor:
                    element.backgroundColor,
                  borderRadius: "50%",
                  border: isSelected
                    ? "2px solid #2563eb"
                    : "none",
                  cursor: "move",
                }}
              >
                {isSelected && (
                  <ResizeHandle
                    onMouseDown={(event) =>
                      startResizing(
                        event,
                        element.id,
                        element.width,
                        element.height
                      )
                    }
                  />
                )}
              </div>
            );
          }

          // Triangle
          if (element.type === "triangle") {
            return (
              <div
                key={element.id}
                onMouseDown={(event) =>
                  startDragging(
                    event,
                    element.id,
                    element.x,
                    element.y
                  )
                }
                style={{
                  position: "absolute",
                  left: element.x,
                  top: element.y,
                  width: element.width,
                  height: element.height,
                  cursor: "move",
                }}
              >
                <div
                  style={{
                    width: 0,
                    height: 0,
                    borderLeft: `${element.width / 2}px solid transparent`,
                    borderRight: `${element.width / 2}px solid transparent`,
                    borderBottom: `${element.height}px solid ${element.backgroundColor}`,
                  }}
                />

                {isSelected && (
                  <ResizeHandle
                    onMouseDown={(event) =>
                      startResizing(
                        event,
                        element.id,
                        element.width,
                        element.height
                      )
                    }
                  />
                )}
              </div>
            );
          }

          // Text / Heading / Subheading
          return (
            <div
              key={element.id}
              onMouseDown={(event) =>
                startDragging(
                  event,
                  element.id,
                  element.x,
                  element.y
                )
              }
              onDoubleClick={(event) => {
                event.preventDefault();
                event.stopPropagation();

                const newText =
                  window.prompt(
                    "Edit text",
                    element.text || ""
                  );

                if (newText !== null) {
                  updateElement(
                    element.id,
                    {
                      text: newText,
                    }
                  );
                }
              }}
              style={{
                ...baseStyle,

                fontSize:
                  element.fontSize,

                fontFamily:
                  element.fontFamily,

                color:
                  element.color,

                fontWeight:
                  element.fontWeight,

                display: "flex",
                alignItems: "center",
                justifyContent: "center",

                textAlign: "center",

                padding: "5px",

                boxSizing: "border-box",

                border: isSelected
                  ? "2px solid #2563eb"
                  : "1px solid transparent",

                cursor: "move",

                userSelect: "none",

                zIndex: isSelected ? 20 : 10,
              }}
            >
              {element.text}

              {isSelected && (
                <ResizeHandle
                  onMouseDown={(event) =>
                    startResizing(
                      event,
                      element.id,
                      element.width,
                      element.height
                    )
                  }
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ResizeHandle({
  onMouseDown,
}: {
  onMouseDown: (
    event: MouseEvent
  ) => void;
}) {
  return (
    <div
      onMouseDown={onMouseDown}
      className="absolute -right-2 -bottom-2 w-4 h-4 bg-blue-600 border-2 border-white rounded-sm cursor-se-resize z-50"
    />
  );
}