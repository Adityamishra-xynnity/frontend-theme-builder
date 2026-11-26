import { useRef, useState } from "react";
import {
  Link2,
  Copy,
  Trash2,
  Palette,
  ImagePlus,
  UploadCloud,
} from "lucide-react";
import { useEmailEditor } from "../context/EmailEditorContext";
import { getNodeLinkUrl } from "../utils/linkUtils";
import LinkPopover from "./LinkPopover";
import ButtonStylePopover from "./ButtonStylePopover";
import {
  TOOLBAR_CLASSES,
  TextFormattingControls,
  ColorSwatchButton,
  preserveToolbarSelection,
  type FontOption,
} from "../../components/editor/SharedToolbarControls";
import {
  getUploadedImages,
  uploadImageToCloudinary,
  type UserUploadItem,
} from "../../api/uploadApi";
import {
  EMAIL_EDITING_LIMITS,
  EMAIL_SAFE_FONT_OPTIONS,
} from "../utils/emailCompatibilityEngine";

const EMAIL_FONTS: FontOption[] = EMAIL_SAFE_FONT_OPTIONS.map((f) => ({
  label: f.label,
  value: f.value,
}));

export default function EmailContextualToolbar() {
  const {
    sections,
    selectedSectionId,
    selectedNodeId,
    updateNodeStyle,
    updateNodeLink,
    duplicateNode,
    removeNode,
    updateSectionStyle,
    duplicateSection,
    removeSection,
  } = useEmailEditor();

  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [isButtonStyleOpen, setIsButtonStyleOpen] = useState(false);
  const [isReplaceImageOpen, setIsReplaceImageOpen] = useState(false);
  const [cloudImages, setCloudImages] = useState<UserUploadItem[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageError, setImageError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedSection = sections.find((s) => s.id === selectedSectionId);
  if (!selectedSection) return null;

  const selectedNode = selectedSection.nodes.find((n) => n.id === selectedNodeId);
  const isStandaloneButton =
    selectedSection.backgroundColor === "transparent" &&
    selectedSection.nodes.length === 1 &&
    selectedSection.nodes[0].type === "button";

  const { barWrapper, barInner, toolBtn, divider, field, group } = TOOLBAR_CLASSES;

  const openReplaceImagePicker = async () => {
    const next = !isReplaceImageOpen;
    setIsReplaceImageOpen(next);
    setIsLinkOpen(false);
    setIsButtonStyleOpen(false);
    if (next) {
      setIsLoadingImages(true);
      setImageError("");
      try {
        const items = await getUploadedImages(0, 30);
        setCloudImages(items);
      } catch (err) {
        setImageError(
          err instanceof Error ? err.message : "Failed to load Cloudinary images."
        );
      } finally {
        setIsLoadingImages(false);
      }
    }
  };

  const handleUploadReplacement = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !selectedNode) return;
    if (!file.type.startsWith("image/")) {
      setImageError("Please select a valid image file.");
      return;
    }
    setIsUploadingImage(true);
    setImageError("");
    try {
      const uploaded = await uploadImageToCloudinary(file);
      setCloudImages((prev) => [uploaded, ...prev]);
      updateNodeStyle(selectedSection.id, selectedNode.id, {
        content: uploaded.secureUrl,
      });
      setIsReplaceImageOpen(false);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  // 1. Node-level Contextual Toolbar (matches Theme Builder Toolbar.tsx)
  if (selectedNode) {
    const nodeLink = getNodeLinkUrl(selectedNode);
    const isTextLike =
      selectedNode.type === "text" ||
      selectedNode.type === "heading" ||
      selectedNode.type === "logo" ||
      selectedNode.type === "link";

    const isBold =
      selectedNode.fontWeight === "bold" ||
      selectedNode.fontWeight === "700" ||
      (selectedNode.fontWeight === undefined &&
        (selectedNode.type === "heading" || selectedNode.type === "logo"));
    const isItalic = selectedNode.fontStyle === "italic";
    const isUnderline =
      selectedNode.textDecoration === "underline" ||
      (selectedNode.textDecoration === undefined && selectedNode.type === "link");
    const isStrikethrough = selectedNode.textDecoration === "line-through";

    return (
      <div className={barWrapper} onClick={(e) => e.stopPropagation()}>
        <div className={barInner}>
          <div className="flex items-center gap-1 shrink-0">
            <span className="mr-1 rounded-md bg-indigo-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-700">
              {selectedNode.type}
            </span>

            <div className={divider} />

            {/* TEXT / HEADING / LOGO / LINK */}
            {isTextLike && (
              <TextFormattingControls
                fontFamily={selectedNode.fontFamily || ""}
                fontOptions={EMAIL_FONTS}
                fontSize={Math.round(selectedNode.fontSize ?? 14)}
                maxFontSize={EMAIL_EDITING_LIMITS.maxFontSize}
                color={selectedNode.color || "#111827"}
                isBold={isBold}
                isItalic={isItalic}
                isUnderline={isUnderline}
                isStrikethrough={isStrikethrough}
                showStrikethrough={true}
                textAlign={selectedNode.textAlign || "left"}
                showJustify={true}
                lineSpacing={selectedNode.lineHeight ?? 1.25}
                letterSpacing={selectedNode.letterSpacing ?? 0}
                letterSpacingStep={0.5}
                minLetterSpacing={EMAIL_EDITING_LIMITS.minLetterSpacing}
                maxLetterSpacing={EMAIL_EDITING_LIMITS.maxLetterSpacing}
                onFontFamilyChange={(val) =>
                  updateNodeStyle(selectedSection.id, selectedNode.id, {
                    fontFamily: val || undefined,
                  })
                }
                onFontSizeDecrease={() =>
                  updateNodeStyle(selectedSection.id, selectedNode.id, {
                    fontSize: Math.max(
                      EMAIL_EDITING_LIMITS.minFontSize,
                      (selectedNode.fontSize ?? 14) - 1
                    ),
                  })
                }
                onFontSizeIncrease={() =>
                  updateNodeStyle(selectedSection.id, selectedNode.id, {
                    fontSize: Math.min(
                      EMAIL_EDITING_LIMITS.maxFontSize,
                      (selectedNode.fontSize ?? 14) + 1
                    ),
                  })
                }
                onFontSizeChange={(val) => {
                  const next = Number(val);
                  if (
                    Number.isFinite(next) &&
                    next >= EMAIL_EDITING_LIMITS.minFontSize &&
                    next <= EMAIL_EDITING_LIMITS.maxFontSize
                  ) {
                    updateNodeStyle(selectedSection.id, selectedNode.id, {
                      fontSize: next,
                    });
                  }
                }}
                onColorChange={(hex) =>
                  updateNodeStyle(selectedSection.id, selectedNode.id, {
                    color: hex,
                  })
                }
                onToggleBold={() =>
                  updateNodeStyle(selectedSection.id, selectedNode.id, {
                    fontWeight: isBold ? "normal" : "bold",
                  })
                }
                onToggleItalic={() =>
                  updateNodeStyle(selectedSection.id, selectedNode.id, {
                    fontStyle: isItalic ? "normal" : "italic",
                  })
                }
                onToggleUnderline={() =>
                  updateNodeStyle(selectedSection.id, selectedNode.id, {
                    textDecoration: isUnderline ? "none" : "underline",
                  })
                }
                onToggleStrikethrough={() =>
                  updateNodeStyle(selectedSection.id, selectedNode.id, {
                    textDecoration: isStrikethrough ? "none" : "line-through",
                  })
                }
                onAlignChange={(align) =>
                  updateNodeStyle(selectedSection.id, selectedNode.id, {
                    textAlign: align,
                  })
                }
                onLineSpacingChange={(val) =>
                  updateNodeStyle(selectedSection.id, selectedNode.id, {
                    lineHeight: Number(val) || 1.25,
                  })
                }
                onLetterSpacingDecrease={() =>
                  updateNodeStyle(selectedSection.id, selectedNode.id, {
                    letterSpacing: Math.max(
                      -2,
                      (selectedNode.letterSpacing ?? 0) - 0.5
                    ),
                  })
                }
                onLetterSpacingIncrease={() =>
                  updateNodeStyle(selectedSection.id, selectedNode.id, {
                    letterSpacing: Math.min(
                      12,
                      (selectedNode.letterSpacing ?? 0) + 0.5
                    ),
                  })
                }
                onLetterSpacingChange={(val) => {
                  const next = Number(val);
                  if (Number.isFinite(next) && next >= -2 && next <= 12) {
                    updateNodeStyle(selectedSection.id, selectedNode.id, {
                      letterSpacing: next,
                    });
                  }
                }}
              />
            )}

            {/* BUTTON */}
            {selectedNode.type === "button" && (
              <div className={group}>
                <ColorSwatchButton
                  label="Fill"
                  value={selectedNode.backgroundColor || "#6d28d9"}
                  onChange={(hex) =>
                    updateNodeStyle(selectedSection.id, selectedNode.id, {
                      backgroundColor: hex,
                      gradient: undefined,
                    })
                  }
                />

                <ColorSwatchButton
                  label="Text"
                  value={selectedNode.color || "#ffffff"}
                  fallback="#ffffff"
                  onChange={(hex) =>
                    updateNodeStyle(selectedSection.id, selectedNode.id, {
                      color: hex,
                    })
                  }
                />

                <div className="relative">
                  <button
                    type="button"
                    onMouseDown={preserveToolbarSelection}
                    onClick={() => {
                      setIsButtonStyleOpen((p) => !p);
                      setIsLinkOpen(false);
                    }}
                    className={`${toolBtn} border-slate-200 bg-white px-2.5 text-xs font-medium shadow-xs ${
                      isButtonStyleOpen ? "bg-indigo-50 text-indigo-700" : ""
                    }`}
                  >
                    <Palette size={14} />
                    <span>Button Styles</span>
                  </button>

                  {isButtonStyleOpen && (
                    <div className="fixed left-1/2 top-28 z-50 -translate-x-1/2">
                      <ButtonStylePopover
                        node={selectedNode}
                        onChange={(patch) =>
                          updateNodeStyle(selectedSection.id, selectedNode.id, patch)
                        }
                        onClose={() => setIsButtonStyleOpen(false)}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* IMAGE */}
            {selectedNode.type === "image" && (
              <div className={group}>
                <div className="relative">
                  <button
                    type="button"
                    onMouseDown={preserveToolbarSelection}
                    onClick={openReplaceImagePicker}
                    className={`${toolBtn} border-slate-200 bg-white px-2.5 text-xs font-medium shadow-xs ${
                      isReplaceImageOpen ? "bg-indigo-50 text-indigo-700" : ""
                    }`}
                  >
                    <ImagePlus size={14} />
                    <span>Replace Image</span>
                  </button>

                  {isReplaceImageOpen && (
                    <div className="fixed left-1/2 top-28 z-50 w-72 -translate-x-1/2 rounded-xl border border-slate-200 bg-white p-3 shadow-2xl">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-800">
                          Cloudinary Library
                        </span>
                        <button
                          type="button"
                          disabled={isUploadingImage}
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                          <UploadCloud size={12} />
                          {isUploadingImage ? "Uploading..." : "Upload New"}
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleUploadReplacement}
                          className="hidden"
                        />
                      </div>

                      {imageError && (
                        <p className="mb-2 text-[11px] text-red-600">{imageError}</p>
                      )}

                      {isLoadingImages ? (
                        <div className="grid grid-cols-3 gap-2 py-2">
                          {[1, 2, 3].map((s) => (
                            <div
                              key={s}
                              className="h-14 animate-pulse rounded bg-slate-100"
                            />
                          ))}
                        </div>
                      ) : cloudImages.length === 0 ? (
                        <p className="py-4 text-center text-[11px] text-slate-400">
                          No Cloudinary uploads yet.
                        </p>
                      ) : (
                        <div className="grid max-h-48 grid-cols-3 gap-2 overflow-y-auto">
                          {cloudImages.map((img) => (
                            <button
                              key={img.id}
                              type="button"
                              onClick={() => {
                                updateNodeStyle(
                                  selectedSection.id,
                                  selectedNode.id,
                                  { content: img.secureUrl }
                                );
                                setIsReplaceImageOpen(false);
                              }}
                              className="overflow-hidden rounded-md border border-slate-200 hover:border-indigo-500"
                            >
                              <img
                                src={img.secureUrl}
                                alt={img.originalFilename || "Cloudinary asset"}
                                className="h-14 w-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className={divider} />

                <label className="flex items-center gap-1.5 px-1 text-xs font-medium text-slate-600">
                  <span>Radius</span>
                  <input
                    type="number"
                    min={0}
                    max={200}
                    value={
                      typeof selectedNode.borderRadius === "number"
                        ? selectedNode.borderRadius
                        : parseInt(String(selectedNode.borderRadius || "0"), 10) || 0
                    }
                    onChange={(e) =>
                      updateNodeStyle(selectedSection.id, selectedNode.id, {
                        borderRadius: Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                    className={`${field} w-14 text-center`}
                  />
                </label>
              </div>
            )}
          </div>

          {/* RIGHT SHARED NODE ACTIONS (Link, Duplicate, Delete) */}
          <div className={group}>
            <div className="relative">
              <button
                type="button"
                onMouseDown={preserveToolbarSelection}
                onClick={() => {
                  setIsLinkOpen((p) => !p);
                  setIsButtonStyleOpen(false);
                  setIsReplaceImageOpen(false);
                }}
                className={`${toolBtn} px-2.5 text-xs font-medium ${
                  nodeLink ? "bg-indigo-50 text-indigo-700" : ""
                }`}
                title={nodeLink ? `Linked: ${nodeLink}` : "Add link"}
              >
                <Link2 size={15} />
                <span className="max-w-[100px] truncate">
                  {nodeLink ? nodeLink : "Link"}
                </span>
              </button>

              {isLinkOpen && (
                <div className="fixed right-6 top-28 z-50">
                  <LinkPopover
                    initialUrl={nodeLink}
                    onApply={(url) => {
                      updateNodeLink(selectedSection.id, selectedNode.id, url);
                      setIsLinkOpen(false);
                    }}
                    onRemove={() => {
                      updateNodeLink(selectedSection.id, selectedNode.id, undefined);
                      setIsLinkOpen(false);
                    }}
                    onClose={() => setIsLinkOpen(false)}
                    title={`Edit ${selectedNode.type} Link`}
                  />
                </div>
              )}
            </div>

            <div className={divider} />

            <button
              type="button"
              onMouseDown={preserveToolbarSelection}
              onClick={() => duplicateNode(selectedSection.id, selectedNode.id)}
              className={toolBtn}
              title="Duplicate element"
              aria-label="Duplicate element"
            >
              <Copy size={15} />
            </button>

            <button
              type="button"
              onMouseDown={preserveToolbarSelection}
              onClick={() => removeNode(selectedSection.id, selectedNode.id)}
              className={`${toolBtn} hover:bg-red-50 hover:text-red-600`}
              title="Delete element"
              aria-label="Delete element"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Section / Header / Footer Contextual Toolbar (not shown for standalone transparent buttons)
  if (isStandaloneButton) return null;

  return (
    <div className={barWrapper} onClick={(e) => e.stopPropagation()}>
      <div className={barInner}>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="mr-1 rounded-md bg-indigo-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-700">
            {selectedSection.category || "Section"}
          </span>

          <div className={divider} />

          <ColorSwatchButton
            label="Background"
            value={selectedSection.backgroundColor || "#ffffff"}
            fallback="#ffffff"
            onChange={(hex) =>
              updateSectionStyle(selectedSection.id, { backgroundColor: hex })
            }
          />

          <label className="flex items-center gap-1.5 px-1 text-xs font-medium text-slate-600">
            <span>Padding</span>
            <input
              type="text"
              value={selectedSection.padding || "24px"}
              onChange={(e) =>
                updateSectionStyle(selectedSection.id, { padding: e.target.value })
              }
              className={`${field} w-24`}
            />
          </label>
        </div>

        <div className={group}>
          <button
            type="button"
            onMouseDown={preserveToolbarSelection}
            onClick={() => duplicateSection(selectedSection.id)}
            className={toolBtn}
            title="Duplicate section"
            aria-label="Duplicate section"
          >
            <Copy size={15} />
          </button>

          <button
            type="button"
            onMouseDown={preserveToolbarSelection}
            onClick={() => removeSection(selectedSection.id)}
            className={`${toolBtn} hover:bg-red-50 hover:text-red-600`}
            title="Delete section"
            aria-label="Delete section"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
