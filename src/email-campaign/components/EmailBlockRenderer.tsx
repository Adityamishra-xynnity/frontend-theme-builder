import { useRef, useState } from "react";
import { Rnd } from "react-rnd";
import { Move, Trash2, Copy, Link2, Palette } from "lucide-react";
import {
  useEmailEditor,
  computeScaledSectionFromSnapshot,
  computeSymmetricHorizontalBounds,
  getNodeMinDimensions,
  getSectionMinDimensions,
  type EmailSection,
} from "../context/EmailEditorContext";
import { isColumnContainerNode } from "../utils/emailCompatibilityEngine";
import LinkPopover from "./LinkPopover";
import ButtonStylePopover from "./ButtonStylePopover";
import { getNodeLinkUrl, isValidEmailUrl } from "../utils/linkUtils";

export default function EmailBlockRenderer() {
  const {
    sections,
    selectedSectionId,
    selectedNodeId,
    selectSection,
    selectNode,
    updateNodeContent,
    updateNodeStyle,
    updateNodeLink,
    duplicateNode,
    updateSectionBounds,
    replaceSection,
    updateNodeBounds,
    removeNode,
    removeSection,
  } = useEmailEditor();

  const [activeLinkNodeId, setActiveLinkNodeId] = useState<string | null>(null);
  const [activeStyleNodeId, setActiveStyleNodeId] = useState<string | null>(null);
  const sectionResizeSnapshotRef = useRef<EmailSection | null>(null);

  if (sections.length === 0) {
    return (
      <div className="flex min-h-[800px] flex-col items-center justify-center px-8 text-center select-none">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-3xl shadow-xs">
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

  const maxSectionBottom = sections.reduce(
    (max, s) => Math.max(max, (s.y || 0) + (s.height || 0)),
    0
  );
  const canvasMinHeight = Math.max(1200, maxSectionBottom + 80);

  return (
    <div
      className="relative w-[600px] bg-white"
      style={{ minHeight: `${canvasMinHeight}px` }}
      onClick={() => {
        selectSection(null);
        setActiveLinkNodeId(null);
        setActiveStyleNodeId(null);
      }}
    >
      {sections.map((section) => {
        const isStandaloneButton =
          section.backgroundColor === "transparent" &&
          section.nodes.length === 1 &&
          section.nodes[0].type === "button";

        if (isStandaloneButton) {
          const btnNode = section.nodes[0];
          const isBtnSelected =
            selectedSectionId === section.id && selectedNodeId === btnNode.id;
          const effectiveLinkUrl = getNodeLinkUrl(btnNode);
          const hasLink = Boolean(effectiveLinkUrl);
          const isNearTopEdge = section.y < 42;
          const { minWidth, minHeight } = getNodeMinDimensions("button", btnNode);

          return (
            <Rnd
              key={section.id}
              position={{ x: section.x, y: section.y }}
              size={{ width: section.width, height: section.height }}
              bounds="parent"
              minWidth={minWidth}
              maxWidth={600}
              minHeight={minHeight}
              style={{ zIndex: isBtnSelected ? 35 : 20 }}
              disableDragging={!isBtnSelected}
              dragHandleClassName="node-drag-handle"
              enableResizing={
                isBtnSelected
                  ? {
                      top: false,
                      right: true,
                      bottom: true,
                      left: true,
                      topRight: false,
                      bottomRight: true,
                      bottomLeft: true,
                      topLeft: false,
                    }
                  : false
              }
              onDragStop={(_e, data) =>
                updateSectionBounds(section.id, {
                  x: data.x,
                  y: data.y,
                })
              }
              onResize={(_e, direction, ref, _delta, position) => {
                const next = computeSymmetricHorizontalBounds(
                  {
                    x: section.x,
                    y: section.y,
                    width: section.width,
                    height: section.height,
                  },
                  {
                    x: position.x,
                    y: position.y,
                    width: ref.offsetWidth,
                    height: ref.offsetHeight,
                  },
                  direction,
                  minWidth
                );
                replaceSection({
                  ...section,
                  ...next,
                  nodes: [
                    {
                      ...btnNode,
                      x: 0,
                      y: 0,
                      width: next.width,
                      height: next.height,
                    },
                  ],
                });
              }}
              onResizeStop={(_e, direction, ref, _delta, position) => {
                const next = computeSymmetricHorizontalBounds(
                  {
                    x: section.x,
                    y: section.y,
                    width: section.width,
                    height: section.height,
                  },
                  {
                    x: position.x,
                    y: position.y,
                    width: ref.offsetWidth,
                    height: ref.offsetHeight,
                  },
                  direction,
                  minWidth
                );
                replaceSection({
                  ...section,
                  ...next,
                  nodes: [
                    {
                      ...btnNode,
                      x: 0,
                      y: 0,
                      width: next.width,
                      height: next.height,
                    },
                  ],
                });
              }}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                selectNode(section.id, btnNode.id);
              }}
            >
              <div
                className={`relative h-full w-full transition-all ${
                  isBtnSelected
                    ? "ring-2 ring-violet-500 ring-offset-2 rounded-lg"
                    : "hover:ring-1 hover:ring-violet-300/80 rounded-lg"
                }`}
              >
                {isBtnSelected && (
                  <div
                    className={`absolute ${
                      isNearTopEdge ? "top-full mt-2" : "-top-10"
                    } left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 rounded-lg bg-white/95 px-2 py-1 shadow-xl ring-1 ring-black/10 backdrop-blur-xs select-none`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div
                      className="node-drag-handle flex cursor-move items-center p-1 text-gray-500 hover:text-violet-700 transition-colors"
                      title="Drag to reposition button"
                    >
                      <Move size={13} />
                    </div>

                    <div className="h-3.5 w-[1px] bg-gray-200" />

                    <button
                      type="button"
                      onClick={() => {
                        setActiveStyleNodeId((c) => (c === btnNode.id ? null : btnNode.id));
                        setActiveLinkNodeId(null);
                      }}
                      className={`flex items-center gap-1 rounded px-1.5 py-1 text-xs font-medium transition-colors ${
                        activeStyleNodeId === btnNode.id
                          ? "bg-violet-100 text-violet-700"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                      title="Edit button style"
                    >
                      <Palette size={13} />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveLinkNodeId((c) => (c === btnNode.id ? null : btnNode.id));
                        setActiveStyleNodeId(null);
                      }}
                      className={`relative flex items-center gap-1 rounded px-1.5 py-1 text-xs font-medium transition-colors ${
                        hasLink
                          ? "bg-violet-100 text-violet-700 hover:bg-violet-200"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                      title={hasLink ? `Edit link: ${effectiveLinkUrl}` : "Attach hyperlink (URL)"}
                    >
                      <Link2 size={13} className={hasLink ? "text-violet-700" : "text-gray-600"} />
                      {hasLink && <span className="h-1.5 w-1.5 rounded-full bg-violet-600" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => duplicateNode(section.id, btnNode.id)}
                      className="rounded p-1 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                      title="Duplicate button"
                    >
                      <Copy size={13} />
                    </button>

                    <button
                      type="button"
                      onClick={() => removeNode(section.id, btnNode.id)}
                      className="rounded p-1 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Delete button"
                    >
                      <Trash2 size={13} />
                    </button>

                    {activeLinkNodeId === btnNode.id && (
                      <LinkPopover
                        initialUrl={effectiveLinkUrl}
                        onApply={(newUrl) => {
                          updateNodeLink(section.id, btnNode.id, newUrl);
                          setActiveLinkNodeId(null);
                        }}
                        onRemove={() => {
                          updateNodeLink(section.id, btnNode.id, undefined);
                          setActiveLinkNodeId(null);
                        }}
                        onClose={() => setActiveLinkNodeId(null)}
                        title="Link: Button"
                      />
                    )}

                    {activeStyleNodeId === btnNode.id && (
                      <div className="absolute left-0 top-full mt-2 z-50">
                        <ButtonStylePopover
                          node={btnNode}
                          onChange={(patch) => updateNodeStyle(section.id, btnNode.id, patch)}
                          onClose={() => setActiveStyleNodeId(null)}
                        />
                      </div>
                    )}
                  </div>
                )}

                {!isBtnSelected && hasLink && (
                  <div
                    className="pointer-events-none absolute -right-1.5 -top-1.5 z-20 flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-white shadow-xs"
                    title={`Linked to: ${effectiveLinkUrl}`}
                  >
                    <Link2 size={9} />
                  </div>
                )}

                <input
                  value={btnNode.content}
                  onChange={(e) => updateNodeContent(section.id, btnNode.id, e.target.value)}
                  onClick={(e) => {
                    e.stopPropagation();
                    selectNode(section.id, btnNode.id);
                  }}
                  aria-label="Edit button text"
                  className="h-full w-full text-center outline-none shadow-xs"
                  style={{
                    background: btnNode.gradient || btnNode.backgroundColor || "#6d28d9",
                    color: btnNode.color || "#ffffff",
                    fontFamily: btnNode.fontFamily || undefined,
                    fontSize: `${btnNode.fontSize ?? 15}px`,
                    fontWeight: btnNode.fontWeight || "bold",
                    padding: btnNode.padding || "10px 20px",
                    border:
                      btnNode.borderWidth && btnNode.borderColor
                        ? `${btnNode.borderWidth}px solid ${btnNode.borderColor}`
                        : "none",
                    borderRadius:
                      typeof btnNode.borderRadius === "number"
                        ? `${btnNode.borderRadius}px`
                        : btnNode.borderRadius || "8px",
                  }}
                />
              </div>
            </Rnd>
          );
        }

        const isSectionSelected =
          selectedSectionId === section.id && selectedNodeId === null;
        const { minWidth: sectionMinWidth, minHeight: sectionMinHeight } =
          getSectionMinDimensions(section);
        const effectiveSectionHeight = Math.max(section.height, sectionMinHeight);

        return (
          <Rnd
            key={section.id}
            position={{ x: section.x, y: section.y }}
            size={{ width: section.width, height: effectiveSectionHeight }}
            bounds="parent"
            minWidth={sectionMinWidth}
            maxWidth={600}
            minHeight={sectionMinHeight}
            disableDragging={!isSectionSelected}
            dragHandleClassName="section-drag-handle"
            enableResizing={
              isSectionSelected
                ? {
                    top: false,
                    right: true,
                    bottom: true,
                    left: true,
                    topRight: false,
                    bottomRight: true,
                    bottomLeft: true,
                    topLeft: false,
                  }
                : false
            }
            onDragStop={(_e, data) =>
              updateSectionBounds(section.id, {
                x: data.x,
                y: data.y,
              })
            }
            onResizeStart={() => {
              sectionResizeSnapshotRef.current = structuredClone(section);
            }}
            onResize={(_e, direction, ref, _delta, position) => {
              const snap = sectionResizeSnapshotRef.current;
              if (!snap || snap.id !== section.id) return;
              replaceSection(
                computeScaledSectionFromSnapshot(
                  snap,
                  {
                    x: position.x,
                    y: position.y,
                    width: ref.offsetWidth,
                    height: ref.offsetHeight,
                  },
                  direction
                )
              );
            }}
            onResizeStop={(_e, direction, ref, _delta, position) => {
              const snap = sectionResizeSnapshotRef.current;
              sectionResizeSnapshotRef.current = null;
              if (!snap || snap.id !== section.id) return;
              replaceSection(
                computeScaledSectionFromSnapshot(
                  snap,
                  {
                    x: position.x,
                    y: position.y,
                    width: ref.offsetWidth,
                    height: ref.offsetHeight,
                  },
                  direction
                )
              );
            }}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              selectSection(section.id);
              setActiveLinkNodeId(null);
            }}
          >
            <div
              className={`relative h-full w-full overflow-visible transition-colors ${
                isSectionSelected
                  ? "border-2 border-violet-500 ring-2 ring-violet-200"
                  : "border border-transparent hover:border-violet-300/60"
              }`}
              style={{
                backgroundColor: section.backgroundColor,
              }}
            >
              {/* Canva-style Section controls toolbar */}
              {isSectionSelected && (
                <div className="absolute -top-9 right-0 z-40 flex items-center gap-1.5 rounded-lg bg-white/95 px-2 py-1 shadow-lg ring-1 ring-black/10 backdrop-blur-xs select-none">
                  <div
                    className="section-drag-handle flex cursor-move items-center gap-1 text-xs font-semibold text-violet-700 hover:text-violet-900"
                    title="Drag to reorder section"
                  >
                    <Move size={12} />
                    <span>Move section</span>
                  </div>

                  <div className="h-3.5 w-[1px] bg-gray-200" />

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSection(section.id);
                    }}
                    className="rounded p-1 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Delete section"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}

              {/* Individual editable elements */}
              {section.nodes.map((node) => {
                // In parent-based column layouts, column containers are non-resizable shells
                // owned by the parent ColumnLayout section (clicking selects the parent).
                if (isColumnContainerNode(section, node)) {
                  return (
                    <div
                      key={node.id}
                      style={{
                        position: "absolute",
                        left: `${node.x}px`,
                        top: `${node.y}px`,
                        width: `${node.width}px`,
                        height: `${node.height}px`,
                        background: node.backgroundColor || "rgba(255, 255, 255, 0.4)",
                        border:
                          node.borderWidth && node.borderColor
                            ? `${node.borderWidth}px solid ${node.borderColor}`
                            : undefined,
                        borderRadius:
                          typeof node.borderRadius === "number"
                            ? `${node.borderRadius}px`
                            : node.borderRadius || undefined,
                      }}
                    />
                  );
                }

                const isNodeSelected =
                  selectedSectionId === section.id &&
                  selectedNodeId === node.id;

                const effectiveLinkUrl = getNodeLinkUrl(node);
                const hasLink = Boolean(effectiveLinkUrl);

                const update = (content: string) =>
                  updateNodeContent(section.id, node.id, content);

                // Image source resolver: prioritize base64 PNG content over external URL
                const resolvedImageSrc =
                  node.content &&
                  (node.content.startsWith("data:image/") ||
                    node.content.startsWith("http://") ||
                    node.content.startsWith("https://"))
                    ? node.content
                    : node.url &&
                      (node.url.startsWith("data:image/") ||
                        node.url.startsWith("http://") ||
                        node.url.startsWith("https://")) &&
                      !isValidEmailUrl(node.linkUrl)
                    ? node.url
                    : node.content;

                // Toolbar position (above node, or below if near top boundary)
                const isNearTopEdge = node.y < 42;
                const { minWidth, minHeight } = getNodeMinDimensions(node.type, node);

                return (
                  <Rnd
                    key={node.id}
                    position={{ x: node.x, y: node.y }}
                    size={{ width: node.width, height: node.height }}
                    bounds="parent"
                    minWidth={minWidth}
                    minHeight={minHeight}
                    maxWidth={section.width}
                    lockAspectRatio={node.type === "image"}
                    disableDragging={!isNodeSelected}
                    dragHandleClassName="node-drag-handle"
                    enableResizing={isNodeSelected}
                    onDragStop={(_e, data) =>
                      updateNodeBounds(section.id, node.id, {
                        x: data.x,
                        y: data.y,
                      })
                    }
                    onResize={(_e, _direction, ref, _delta, position) =>
                      updateNodeBounds(section.id, node.id, {
                        x: position.x,
                        y: position.y,
                        width: ref.offsetWidth,
                        height: ref.offsetHeight,
                      })
                    }
                    onResizeStop={(_e, _direction, ref, _delta, position) =>
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
                      className={`relative h-full w-full transition-all ${
                        isNodeSelected
                          ? "border-2 border-violet-500 ring-2 ring-violet-200"
                          : "border border-transparent hover:border-violet-300/70"
                      }`}
                    >
                      {/* Canva-style Floating Action Toolbar on Selected Element */}
                      {isNodeSelected && (
                        <div
                          className={`absolute ${
                            isNearTopEdge ? "top-full mt-2" : "-top-9"
                          } left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 rounded-lg bg-white/95 px-2 py-1 shadow-xl ring-1 ring-black/10 backdrop-blur-xs select-none`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Move handle */}
                          <div
                            className="node-drag-handle flex cursor-move items-center p-1 text-gray-500 hover:text-violet-700 transition-colors"
                            title="Drag to reposition element"
                          >
                            <Move size={13} />
                          </div>

                          <div className="h-3.5 w-[1px] bg-gray-200" />

                          {/* Button Style Action (when editing a button inside a section) */}
                          {node.type === "button" && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveStyleNodeId((current) =>
                                  current === node.id ? null : node.id
                                );
                                setActiveLinkNodeId(null);
                              }}
                              className={`flex items-center gap-1 rounded px-1.5 py-1 text-xs font-medium transition-colors ${
                                activeStyleNodeId === node.id
                                  ? "bg-violet-100 text-violet-700"
                                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                              }`}
                              title="Edit button style"
                            >
                              <Palette size={13} />
                            </button>
                          )}

                          {/* Canva Hyperlink Action */}
                          <button
                            type="button"
                            onClick={() =>
                              setActiveLinkNodeId((current) =>
                                current === node.id ? null : node.id
                              )
                            }
                            className={`relative flex items-center gap-1 rounded px-1.5 py-1 text-xs font-medium transition-colors ${
                              hasLink
                                ? "bg-violet-100 text-violet-700 hover:bg-violet-200"
                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                            }`}
                            title={
                              hasLink
                                ? `Edit link: ${effectiveLinkUrl}`
                                : "Attach hyperlink (URL)"
                            }
                          >
                            <Link2
                              size={13}
                              className={
                                hasLink ? "text-violet-700" : "text-gray-600"
                              }
                            />
                            {hasLink && (
                              <span className="h-1.5 w-1.5 rounded-full bg-violet-600" />
                            )}
                          </button>

                          {/* Duplicate element */}
                          <button
                            type="button"
                            onClick={() => duplicateNode(section.id, node.id)}
                            className="rounded p-1 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                            title="Duplicate element"
                          >
                            <Copy size={13} />
                          </button>

                          {/* Delete element */}
                          <button
                            type="button"
                            onClick={() => removeNode(section.id, node.id)}
                            className="rounded p-1 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Delete element"
                          >
                            <Trash2 size={13} />
                          </button>

                          {/* Link Popover anchored to floating toolbar */}
                          {activeLinkNodeId === node.id && (
                            <LinkPopover
                              initialUrl={effectiveLinkUrl}
                              onApply={(newUrl) => {
                                updateNodeLink(section.id, node.id, newUrl);
                                setActiveLinkNodeId(null);
                              }}
                              onRemove={() => {
                                updateNodeLink(section.id, node.id, undefined);
                                setActiveLinkNodeId(null);
                              }}
                              onClose={() => setActiveLinkNodeId(null)}
                              title={`Link: ${
                                node.type.charAt(0).toUpperCase() +
                                node.type.slice(1)
                              }`}
                            />
                          )}

                          {activeStyleNodeId === node.id && node.type === "button" && (
                            <div className="absolute left-0 top-full mt-2 z-50">
                              <ButtonStylePopover
                                node={node}
                                onChange={(patch) => updateNodeStyle(section.id, node.id, patch)}
                                onClose={() => setActiveStyleNodeId(null)}
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Small Link badge when not selected */}
                      {!isNodeSelected && hasLink && (
                        <div
                          className="pointer-events-none absolute -right-1.5 -top-1.5 z-20 flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-white shadow-xs"
                          title={`Linked to: ${effectiveLinkUrl}`}
                        >
                          <Link2 size={9} />
                        </div>
                      )}

                      {/* Logo element */}
                      {node.type === "logo" && (
                        <input
                          value={node.content}
                          onChange={(e) => update(e.target.value)}
                          onClick={(e) => {
                            e.stopPropagation();
                            selectNode(section.id, node.id);
                          }}
                          aria-label="Edit logo"
                          className="h-full w-full bg-transparent font-bold leading-tight outline-none"
                          style={{
                            fontSize: `${node.fontSize ?? 20}px`,
                            fontFamily: node.fontFamily || undefined,
                            fontWeight: node.fontWeight || "bold",
                            fontStyle: node.fontStyle || "normal",
                            textDecoration: node.textDecoration || "none",
                            lineHeight: node.lineHeight ?? 1.25,
                            letterSpacing:
                              node.letterSpacing !== undefined
                                ? `${node.letterSpacing}px`
                                : undefined,
                            color: node.color || "#111827",
                            textAlign: node.textAlign || "left",
                          }}
                        />
                      )}

                      {/* Heading element */}
                      {node.type === "heading" && (
                        <textarea
                          value={node.content}
                          onChange={(e) => {
                            update(e.target.value);
                            const needed = e.currentTarget.scrollHeight + 2;
                            if (needed > node.height) {
                              updateNodeBounds(section.id, node.id, {
                                height: needed,
                              });
                            }
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            selectNode(section.id, node.id);
                          }}
                          aria-label="Edit heading"
                          className="h-full w-full resize-none overflow-hidden bg-transparent font-bold leading-tight outline-none p-0 m-0"
                          style={{
                            fontSize: `${node.fontSize ?? 24}px`,
                            fontFamily: node.fontFamily || undefined,
                            fontWeight: node.fontWeight || "bold",
                            fontStyle: node.fontStyle || "normal",
                            textDecoration: node.textDecoration || "none",
                            lineHeight: node.lineHeight ?? 1.25,
                            letterSpacing:
                              node.letterSpacing !== undefined
                                ? `${node.letterSpacing}px`
                                : undefined,
                            color: node.color || "#111827",
                            whiteSpace: "pre-wrap",
                            textAlign: node.textAlign || "left",
                          }}
                        />
                      )}

                      {/* Text element */}
                      {node.type === "text" && (
                        <textarea
                          value={node.content}
                          onChange={(e) => {
                            update(e.target.value);
                            const needed = e.currentTarget.scrollHeight + 2;
                            if (needed > node.height) {
                              updateNodeBounds(section.id, node.id, {
                                height: needed,
                              });
                            }
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            selectNode(section.id, node.id);
                          }}
                          aria-label="Edit text"
                          className="h-full w-full resize-none overflow-hidden bg-transparent leading-snug outline-none p-0 m-0"
                          style={{
                            fontSize: `${node.fontSize ?? 14}px`,
                            fontFamily: node.fontFamily || undefined,
                            fontWeight: node.fontWeight || "normal",
                            fontStyle: node.fontStyle || "normal",
                            textDecoration: node.textDecoration || "none",
                            lineHeight: node.lineHeight ?? 1.4,
                            letterSpacing:
                              node.letterSpacing !== undefined
                                ? `${node.letterSpacing}px`
                                : undefined,
                            color: node.color || "#374151",
                            whiteSpace: "pre-wrap",
                            textAlign: node.textAlign || "left",
                          }}
                        />
                      )}

                      {/* Button element */}
                      {node.type === "button" && (
                        <input
                          value={node.content}
                          onChange={(e) => update(e.target.value)}
                          onClick={(e) => {
                            e.stopPropagation();
                            selectNode(section.id, node.id);
                          }}
                          aria-label="Edit button text"
                          className="h-full w-full rounded-lg px-4 text-center font-semibold outline-none shadow-xs"
                          style={{
                            background: node.gradient || node.backgroundColor || "#6d28d9",
                            color: node.color || "#ffffff",
                            fontFamily: node.fontFamily || undefined,
                            fontSize: `${node.fontSize ?? 14}px`,
                            fontWeight: node.fontWeight || "bold",
                            padding: node.padding || "10px 20px",
                            border:
                              node.borderWidth && node.borderColor
                                ? `${node.borderWidth}px solid ${node.borderColor}`
                                : "none",
                            borderRadius:
                              typeof node.borderRadius === "number"
                                ? `${node.borderRadius}px`
                                : node.borderRadius || "8px",
                          }}
                        />
                      )}

                      {/* Link element */}
                      {node.type === "link" && (
                        <input
                          value={node.content}
                          onChange={(e) => update(e.target.value)}
                          onClick={(e) => {
                            e.stopPropagation();
                            selectNode(section.id, node.id);
                          }}
                          aria-label="Edit link"
                          className="h-full w-full bg-transparent font-medium leading-tight outline-none underline p-0 m-0"
                          style={{
                            fontSize: `${node.fontSize ?? 13}px`,
                            fontFamily: node.fontFamily || undefined,
                            fontWeight: node.fontWeight || "500",
                            fontStyle: node.fontStyle || "normal",
                            textDecoration: node.textDecoration || "underline",
                            lineHeight: node.lineHeight ?? 1.3,
                            letterSpacing:
                              node.letterSpacing !== undefined
                                ? `${node.letterSpacing}px`
                                : undefined,
                            color: node.color || "#2563eb",
                            textAlign: node.textAlign || "left",
                          }}
                        />
                      )}

                      {/* Image element */}
                      {node.type === "image" && (
                        <div
                          className="h-full w-full overflow-hidden select-none"
                          style={{
                            opacity: node.opacity ?? 1,
                            borderRadius:
                              typeof node.borderRadius === "number"
                                ? `${node.borderRadius}px`
                                : node.borderRadius || undefined,
                          }}
                        >
                          {resolvedImageSrc ? (
                            <img
                              src={resolvedImageSrc}
                              alt="Email element"
                              className={`h-full w-full pointer-events-none ${
                                node.width <= 64
                                  ? "object-contain"
                                  : "object-cover"
                              }`}
                              style={{
                                borderRadius:
                                  typeof node.borderRadius === "number"
                                    ? `${node.borderRadius}px`
                                    : node.borderRadius || undefined,
                              }}
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-gray-100 text-xs text-gray-400">
                              Image
                            </div>
                          )}
                        </div>
                      )}

                      {/* Container / Divider element */}
                      {node.type === "container" && (
                        <div
                          className="h-full w-full"
                          style={{
                            background:
                              node.gradient ||
                              node.backgroundColor ||
                              "rgba(255, 255, 255, 0.4)",
                            border:
                              node.borderWidth && node.borderColor
                                ? `${node.borderWidth}px solid ${node.borderColor}`
                                : undefined,
                            borderRadius:
                              typeof node.borderRadius === "number"
                                ? `${node.borderRadius}px`
                                : node.borderRadius || undefined,
                          }}
                        />
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
