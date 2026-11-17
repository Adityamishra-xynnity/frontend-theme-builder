
import { Rnd } from "react-rnd";
import { Move, Trash2 } from "lucide-react";
import { useEmailEditor } from "../context/EmailEditorContext";

export default function EmailBlockRenderer() {
  const {
    sections,
    selectedSectionId,
    selectedNodeId,
    selectSection,
    selectNode,
    updateNodeContent,
    updateSectionBounds,
    updateNodeBounds,
    removeNode,
    removeSection,
  } = useEmailEditor();

  if (sections.length === 0) {
    return (
      <div className="flex min-h-[800px] flex-col items-center justify-center px-8 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-3xl">
          ✉️
        </div>

        <h3 className="text-lg font-semibold text-gray-700">
          Your email starts here
        </h3>

        <p className="mt-2 max-w-xs text-sm text-gray-500">
          Choose a ready-made design from Elements to start building your email.
        </p>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-[1200px] w-[600px] bg-white"
      onClick={() => selectSection(null)}
    >
      {sections.map((section) => {
        const isSectionSelected =
          selectedSectionId === section.id && selectedNodeId === null;

        return (
          <Rnd
            key={section.id}
            position={{ x: section.x, y: section.y }}
            size={{ width: section.width, height: section.height }}
            bounds="parent"
            minWidth={250}
            minHeight={120}
            disableDragging={!isSectionSelected}
            dragHandleClassName="section-drag-handle"
            enableResizing={isSectionSelected}
            onDragStop={(_e, data) =>
              updateSectionBounds(section.id, {
                x: data.x,
                y: data.y,
              })
            }
            onResizeStop={(_e, _direction, ref, _delta, position) => {
              const scaleX = ref.offsetWidth / section.width;
              const scaleY = ref.offsetHeight / section.height;

              section.nodes.forEach((node) => {
                const fontScale = Math.min(scaleX, scaleY);

                updateNodeBounds(section.id, node.id, {
                  x: node.x * scaleX,
                  y: node.y * scaleY,
                  width: node.width * scaleX,
                  height: node.height * scaleY,
                  fontSize: (node.fontSize ?? 14) * fontScale,
                });
              });

              updateSectionBounds(section.id, {
                x: position.x,
                y: position.y,
                width: ref.offsetWidth,
                height: ref.offsetHeight,
              });
            }}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              selectSection(section.id);
            }}
          >
            <div
              className={`relative h-full w-full overflow-visible ${isSectionSelected
                ? "border-2 border-violet-500"
                : "border border-transparent hover:border-violet-200"
                }`}
              style={{
                backgroundColor: section.backgroundColor,
              }}
            >
              {/* Section controls */}
              <div className="absolute -top-8 right-0 z-50 flex items-center gap-2">
                {isSectionSelected && (
                  <>
                    <button
                      type="button"
                      className="section-drag-handle flex cursor-move items-center gap-1 rounded bg-violet-600 px-2 py-1 text-xs text-white"
                    >
                      <Move size={12} />
                      Move section
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSection(section.id);
                      }}
                      className="rounded bg-red-50 p-1.5 text-red-600"
                      title="Delete section"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>

              {/* Individual editable elements */}
              {section.nodes.map((node) => {
                const isNodeSelected =
                  selectedSectionId === section.id &&
                  selectedNodeId === node.id;

                const update = (content: string) =>
                  updateNodeContent(section.id, node.id, content);

                return (
                  <Rnd
                    key={node.id}
                    position={{ x: node.x, y: node.y }}
                    size={{ width: node.width, height: node.height }}
                    bounds="parent"
                    minWidth={40}
                    minHeight={25}
                    disableDragging={!isNodeSelected}
                    dragHandleClassName="node-drag-handle"
                    enableResizing={isNodeSelected}
                    onDragStop={(_e, data) =>
                      updateNodeBounds(section.id, node.id, {
                        x: data.x,
                        y: data.y,
                      })
                    }
                    onResizeStop={(
                      _e,
                      _direction,
                      ref,
                      _delta,
                      position
                    ) =>
                      updateNodeBounds(section.id, node.id, {
                        x: position.x,
                        y: position.y,
                        width: ref.offsetWidth,
                        height: ref.offsetHeight,
                      })
                    }
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      selectNode(section.id, node.id);
                    }}
                  >
                    <div
                      className={`relative h-full w-full ${isNodeSelected
                        ? "border-2 border-violet-500"
                        : "border border-transparent hover:border-violet-200"
                        }`}
                    >
                      {isNodeSelected && (
                        <div className="node-drag-handle absolute -top-6 right-0 z-50 flex cursor-move items-center gap-1 rounded bg-violet-600 px-2 py-1 text-white">
                          <Move size={11} />
                          <span className="text-[10px]">Move</span>
                        </div>
                      )}

                      {node.type === "logo" && (
                        <input
                          value={node.content}
                          onChange={(e) => update(e.target.value)}
                          onClick={(e) => {
                            e.stopPropagation();
                            selectNode(section.id, node.id);
                          }}
                          aria-label="Edit logo"
                          className="h-full w-full bg-transparent text-xl font-bold text-gray-900 outline-none"
                        />
                      )}

                      {node.type === "heading" && (
                        <input
                          value={node.content}
                          onChange={(e) => update(e.target.value)}
                          onClick={(e) => {
                            e.stopPropagation();
                            selectNode(section.id, node.id);
                          }}
                          aria-label="Edit heading"
                          className="h-full w-full bg-transparent font-bold leading-tight text-gray-900 outline-none"
                          style={{ fontSize: `${node.fontSize ?? 24}px` }}
                        />
                      )}

                      {node.type === "text" && (
                        <textarea
                          value={node.content}
                          onChange={(e) => update(e.target.value)}
                          onClick={(e) => {
                            e.stopPropagation();
                            selectNode(section.id, node.id);
                          }}
                          aria-label="Edit text"
                          className="h-full w-full resize-none bg-transparent text-sm leading-6 text-gray-700 outline-none"
                        />
                      )}

                      {node.type === "button" && (
                        <input
                          value={node.content}
                          onChange={(e) => update(e.target.value)}
                          onClick={(e) => {
                            e.stopPropagation();
                            selectNode(section.id, node.id);
                          }}
                          aria-label="Edit button text"
                          className="h-full w-full rounded-lg bg-violet-600 px-4 text-center font-semibold text-white outline-none"
                        />
                      )}

                      {node.type === "link" && (
                        <input
                          value={node.content}
                          onChange={(e) => update(e.target.value)}
                          onClick={(e) => {
                            e.stopPropagation();
                            selectNode(section.id, node.id);
                          }}
                          aria-label="Edit link"
                          className="h-full w-full bg-transparent text-sm font-medium text-gray-700 outline-none"
                        />
                      )}

                      {node.type === "image" && (
                        <div className="h-full w-full">
                          {node.content.startsWith("http") ? (
                            <img
                              src={node.content}
                              alt="Email element"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-gray-100 text-xs text-gray-500">
                              Image placeholder
                            </div>
                          )}
                        </div>
                      )}

                      {node.type === "container" && (
                        <div
                          className="h-full w-full"
                          style={{
                            backgroundColor: node.backgroundColor ?? "#F3F4F6",
                          }}
                        />
                      )}

                      {isNodeSelected && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNode(section.id, node.id);
                          }}
                          className="absolute -right-2 -top-8 z-50 rounded bg-red-50 p-1 text-red-600"
                          title="Delete element"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </Rnd>
                );
              })}
            </div>
          </Rnd>
        );
      })}
    </div>
  );
}
