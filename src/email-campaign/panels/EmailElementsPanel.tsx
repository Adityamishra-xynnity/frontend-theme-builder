
import {
  LayoutTemplate,
  PanelBottom,
  MousePointerClick,
  Smile,
  Blocks,
  Columns2,
  Highlighter,
  Shapes,
  Image,
  Video,
  Film,
  ChartNoAxesCombined,
  FileSpreadsheet,
  Table2,
  ArrowLeft,
  Plus,
  Code2,
  RefreshCw,
  AlertCircle,
  FolderOpen,
  Search,
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

import { useState, useEffect, useCallback } from "react";
import { useEmailEditor } from "../context/EmailEditorContext";
import type { EmailSectionTemplate } from "../types/campaign";
import {
  fetchEmailCampaignHeaderTemplates,
  fetchEmailCampaignFootersPaginated,
  fetchEmailCampaignFooterCategories,
  fetchEmailCampaignButtonsPaginated,
  fetchEmailCampaignButtonCategories,
} from "../services/emailCampaignApi";
import { elementTemplates } from "../elements/elementTemplates";
import EmailIconBlocksBrowser from "../components/EmailIconBlocksBrowser";
import EmailHighlightBlocksBrowser from "../components/EmailHighlightBlocksBrowser";
import EmailStructuredBlocksBrowser from "../components/EmailStructuredBlocksBrowser";
import { SUPPORTED_ELEMENT_PANEL_CATEGORIES } from "../utils/emailCompatibilityEngine";

const allCategories = [
  { id: "header", label: "Header", icon: LayoutTemplate, color: "bg-violet-100 text-violet-700" },
  { id: "footer", label: "Footer", icon: PanelBottom, color: "bg-blue-100 text-blue-700" },
  { id: "buttons", label: "Buttons", icon: MousePointerClick, color: "bg-pink-100 text-pink-700" },
  { id: "icons", label: "Icon Blocks", icon: Smile, color: "bg-amber-100 text-amber-700" },
  { id: "bricks", label: "Bricks", icon: Blocks, color: "bg-indigo-100 text-indigo-700" },
  { id: "columns", label: "Columns", icon: Columns2, color: "bg-cyan-100 text-cyan-700" },
  { id: "highlights", label: "Highlight blocks", icon: Highlighter, color: "bg-yellow-100 text-yellow-700" },
  { id: "graphics", label: "Graphics", icon: Shapes, color: "bg-orange-100 text-orange-700" },
  { id: "photos", label: "Photos", icon: Image, color: "bg-green-100 text-green-700" },
  { id: "videos", label: "Videos", icon: Video, color: "bg-red-100 text-red-700" },
  { id: "animation", label: "Animation", icon: Film, color: "bg-fuchsia-100 text-fuchsia-700" },
  { id: "charts", label: "Charts", icon: ChartNoAxesCombined, color: "bg-teal-100 text-teal-700" },
  { id: "sheets", label: "Sheets", icon: FileSpreadsheet, color: "bg-emerald-100 text-emerald-700" },
  { id: "tables", label: "Tables", icon: Table2, color: "bg-sky-100 text-sky-700" },
  {
    id: "elements", label: "Elements", icon: Code2, color: "bg-purple-100 text-purple-700",
  }
];

const categories = allCategories.filter((c) =>
  SUPPORTED_ELEMENT_PANEL_CATEGORIES.has(c.id)
);

export default function EmailElementsPanel() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { addSection, addButtonElement } = useEmailEditor();

  const [headerTemplates, setHeaderTemplates] = useState<EmailSectionTemplate[]>([]);
  const [isHeadersLoading, setIsHeadersLoading] = useState<boolean>(false);
  const [headersError, setHeadersError] = useState<string | null>(null);
  const [hasLoadedHeaders, setHasLoadedHeaders] = useState<boolean>(false);

  // Paginated Footer templates state
  const [footerTemplates, setFooterTemplates] = useState<EmailSectionTemplate[]>([]);
  const [footerCategories, setFooterCategories] = useState<string[]>([]);
  const [footerCategory, setFooterCategory] = useState<string>("all");
  const [footerSearch, setFooterSearch] = useState<string>("");
  const [debouncedFooterSearch, setDebouncedFooterSearch] = useState<string>("");
  const [footerPage, setFooterPage] = useState<number>(0);
  const [footerTotalPages, setFooterTotalPages] = useState<number>(0);
  const [footerTotalElements, setFooterTotalElements] = useState<number>(0);
  const [isFootersLoading, setIsFootersLoading] = useState<boolean>(false);
  const [footersError, setFootersError] = useState<string | null>(null);

  // Paginated Button templates state
  const [buttonTemplates, setButtonTemplates] = useState<EmailSectionTemplate[]>([]);
  const [buttonCategories, setButtonCategories] = useState<string[]>([]);
  const [buttonCategory, setButtonCategory] = useState<string>("all");
  const [buttonSearch, setButtonSearch] = useState<string>("");
  const [debouncedButtonSearch, setDebouncedButtonSearch] = useState<string>("");
  const [buttonPage, setButtonPage] = useState<number>(0);
  const [buttonTotalPages, setButtonTotalPages] = useState<number>(0);
  const [buttonTotalElements, setButtonTotalElements] = useState<number>(0);
  const [isButtonsLoading, setIsButtonsLoading] = useState<boolean>(false);
  const [buttonsError, setButtonsError] = useState<string | null>(null);

  const loadHeaderTemplates = useCallback(async () => {
    setIsHeadersLoading(true);
    setHeadersError(null);
    try {
      const data = await fetchEmailCampaignHeaderTemplates();
      const mapped: EmailSectionTemplate[] = data.map((item) => ({
        ...(item.templateData || {}),
        id: item.templateKey,
        category: item.category || item.templateData?.category || "header",
        name: item.name || item.templateData?.name || "Header",
        backgroundColor: item.templateData?.backgroundColor || "#ffffff",
        padding: item.templateData?.padding || "16px 24px",
        height: item.templateData?.height,
        nodes: Array.isArray(item.templateData?.nodes) ? item.templateData.nodes : [],
      }));
      setHeaderTemplates(mapped);
      setHasLoadedHeaders(true);
    } catch (err) {
      setHeadersError(
        err instanceof Error ? err.message : "Failed to load header templates from server"
      );
    } finally {
      setIsHeadersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCategory === "header" && !hasLoadedHeaders && !isHeadersLoading) {
      loadHeaderTemplates();
    }
  }, [selectedCategory, hasLoadedHeaders, isHeadersLoading, loadHeaderTemplates]);

  // Debounce footer & button search inputs
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFooterSearch(footerSearch);
      setFooterPage(0);
    }, 250);
    return () => clearTimeout(timer);
  }, [footerSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedButtonSearch(buttonSearch);
      setButtonPage(0);
    }, 250);
    return () => clearTimeout(timer);
  }, [buttonSearch]);

  // Load footer categories
  useEffect(() => {
    if (selectedCategory === "footer" && footerCategories.length === 0) {
      fetchEmailCampaignFooterCategories()
        .then(setFooterCategories)
        .catch(() => {});
    }
  }, [selectedCategory, footerCategories.length]);

  // Load button categories
  useEffect(() => {
    if (selectedCategory === "buttons" && buttonCategories.length === 0) {
      fetchEmailCampaignButtonCategories()
        .then(setButtonCategories)
        .catch(() => {});
    }
  }, [selectedCategory, buttonCategories.length]);

  const loadFooterTemplates = useCallback(async () => {
    setIsFootersLoading(true);
    setFootersError(null);
    try {
      const pageData = await fetchEmailCampaignFootersPaginated(
        footerPage,
        4,
        footerCategory === "all" ? undefined : footerCategory,
        debouncedFooterSearch || undefined
      );
      const mapped: EmailSectionTemplate[] = (pageData.content || []).map((item) => ({
        ...(item.templateData || {}),
        id: item.templateKey,
        category: item.templateData?.category || "footer",
        name: item.name || item.templateData?.name || "Footer",
        backgroundColor: item.templateData?.backgroundColor || "#f3f4f6",
        padding: item.templateData?.padding || "24px 32px",
        height: item.templateData?.height,
        nodes: Array.isArray(item.templateData?.nodes) ? item.templateData.nodes : [],
      }));
      setFooterTemplates(mapped);
      setFooterTotalPages(pageData.totalPages);
      setFooterTotalElements(pageData.totalElements);
    } catch (err) {
      setFootersError(
        err instanceof Error ? err.message : "Failed to load footer templates from server"
      );
    } finally {
      setIsFootersLoading(false);
    }
  }, [footerPage, footerCategory, debouncedFooterSearch]);

  useEffect(() => {
    if (selectedCategory === "footer") {
      loadFooterTemplates();
    }
  }, [selectedCategory, loadFooterTemplates]);

  const loadButtonTemplates = useCallback(async () => {
    setIsButtonsLoading(true);
    setButtonsError(null);
    try {
      const pageData = await fetchEmailCampaignButtonsPaginated(
        buttonPage,
        6,
        buttonCategory === "all" ? undefined : buttonCategory,
        debouncedButtonSearch || undefined
      );
      const mapped: EmailSectionTemplate[] = (pageData.content || []).map((item) => ({
        ...(item.templateData || {}),
        id: item.templateKey,
        category: item.templateData?.category || "buttons",
        name: item.name || item.templateData?.name || "Button",
        backgroundColor: item.templateData?.backgroundColor || "#ffffff",
        padding: item.templateData?.padding || "16px 24px",
        height: item.templateData?.height,
        nodes: Array.isArray(item.templateData?.nodes) ? item.templateData.nodes : [],
      }));
      setButtonTemplates(mapped);
      setButtonTotalPages(pageData.totalPages);
      setButtonTotalElements(pageData.totalElements);
    } catch (err) {
      setButtonsError(
        err instanceof Error ? err.message : "Failed to load button templates from server"
      );
    } finally {
      setIsButtonsLoading(false);
    }
  }, [buttonPage, buttonCategory, debouncedButtonSearch]);

  useEffect(() => {
    if (selectedCategory === "buttons") {
      loadButtonTemplates();
    }
  }, [selectedCategory, loadButtonTemplates]);

  const selectedCategoryLabel = categories.find(
    (category) => category.id === selectedCategory
  )?.label;

  return (
    <div className="flex h-full min-h-[500px] flex-col bg-white">
      {!selectedCategory ? (
        <>
          <div className="p-5">
            <h2 className="text-xl font-bold text-gray-800">Elements</h2>
            <p className="mt-1 text-sm text-gray-500">
              Find ready-made designs for your email.
            </p>

            <input
              type="text"
              placeholder="Search elements..."
              className="mt-5 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />
          </div>

          <div className="grid grid-cols-3 gap-3 overflow-y-auto px-5 pb-5">
            {categories.map((category) => {
              const Icon = category.icon;

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategory(category.id)}
                  className="group flex flex-col gap-2 text-left"
                >
                  <div
                    className={`flex aspect-square items-center justify-center rounded-2xl transition group-hover:-translate-y-1 group-hover:shadow-md ${category.color}`}
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/80 shadow-sm group-hover:scale-110">
                      <Icon size={30} strokeWidth={1.7} />
                    </div>
                  </div>

                  <span className="text-center text-xs font-semibold text-gray-700 group-hover:text-violet-700">
                    {category.label}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div className="border-b border-gray-100 p-4">
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-violet-700"
            >
              <ArrowLeft size={16} />
              All elements
            </button>

            <h2 className="text-lg font-bold text-gray-800">
              {selectedCategoryLabel}
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Choose a design to add it to your email.
            </p>
          </div>


          {selectedCategory === "header" ? (
            <div className="flex-1 space-y-3.5 overflow-y-auto p-4">
              {isHeadersLoading ? (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Loading header layouts...</span>
                  </div>
                  {[1, 2, 3, 4].map((skeleton) => (
                    <div
                      key={skeleton}
                      className="h-20 w-full animate-pulse rounded-2xl border border-gray-100 bg-gray-100"
                    />
                  ))}
                </div>
              ) : headersError ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/50 p-6 text-center">
                  <AlertCircle size={24} className="mb-2 text-red-500" />
                  <p className="text-xs font-semibold text-gray-800">
                    Could not load header templates
                  </p>
                  <p className="mt-1 text-[11px] text-gray-500">{headersError}</p>
                  <button
                    type="button"
                    onClick={loadHeaderTemplates}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700"
                  >
                    <RefreshCw size={12} />
                    Retry
                  </button>
                </div>
              ) : headerTemplates.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-gray-50 p-6 text-center">
                  <FolderOpen size={24} className="mb-2 text-gray-400" />
                  <p className="text-xs font-semibold text-gray-700">
                    No header templates available
                  </p>
                  <button
                    type="button"
                    onClick={loadHeaderTemplates}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <RefreshCw size={12} />
                    Refresh
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
                    <span>{headerTemplates.length} Header layouts</span>
                    <span>Click to insert</span>
                  </div>
                  {headerTemplates.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => addSection(template)}
                      className="group w-full overflow-hidden rounded-2xl border border-gray-200/90 text-left transition-all hover:border-violet-400 hover:shadow-lg active:scale-[0.99] bg-white"
                    >
                      <HeaderMiniaturePreview template={template} />

                      <div className="flex items-center justify-between bg-white px-3.5 py-2.5 border-t border-gray-100">
                        <span className="text-xs font-semibold text-gray-800 truncate">
                          {template.name}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-violet-600 transition-opacity">
                          <Plus size={13} strokeWidth={2.5} />
                          Insert
                        </span>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
          ) : selectedCategory === "footer" ? (
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="border-b border-gray-100 p-3 space-y-2.5">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={footerSearch}
                    onChange={(e) => setFooterSearch(e.target.value)}
                    placeholder="Search footers..."
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-7 text-xs outline-none focus:border-violet-500 focus:bg-white"
                  />
                  {footerSearch && (
                    <button
                      type="button"
                      onClick={() => setFooterSearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
                {footerCategories.length > 0 && (
                  <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                    <button
                      type="button"
                      onClick={() => { setFooterCategory("all"); setFooterPage(0); }}
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium capitalize transition ${
                        footerCategory === "all"
                          ? "bg-violet-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      All
                    </button>
                    {footerCategories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => { setFooterCategory(cat); setFooterPage(0); }}
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium capitalize transition ${
                          footerCategory === cat
                            ? "bg-violet-600 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-3.5 overflow-y-auto p-4">
                {isFootersLoading ? (
                  <div className="space-y-3.5">
                    <p className="text-xs text-gray-400">Loading footer layouts...</p>
                    {[1, 2, 3].map((s) => (
                      <div key={s} className="h-24 w-full animate-pulse rounded-2xl border border-gray-100 bg-gray-100" />
                    ))}
                  </div>
                ) : footersError ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/50 p-6 text-center">
                    <AlertCircle size={24} className="mb-2 text-red-500" />
                    <p className="text-xs font-semibold text-gray-800">Could not load footer templates</p>
                    <p className="mt-1 text-[11px] text-gray-500">{footersError}</p>
                    <button
                      type="button"
                      onClick={loadFooterTemplates}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700"
                    >
                      <RefreshCw size={12} /> Retry
                    </button>
                  </div>
                ) : footerTemplates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-gray-50 p-6 text-center">
                    <FolderOpen size={24} className="mb-2 text-gray-400" />
                    <p className="text-xs font-semibold text-gray-700">No footer templates found</p>
                    <button
                      type="button"
                      onClick={loadFooterTemplates}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <RefreshCw size={12} /> Refresh
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{footerTotalElements} Footer layouts</span>
                      <span>Click to insert</span>
                    </div>
                    {footerTemplates.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => addSection(template)}
                        className="group w-full overflow-hidden rounded-2xl border border-gray-200/90 bg-white text-left transition-all hover:border-violet-400 hover:shadow-lg active:scale-[0.99]"
                      >
                        <HeaderMiniaturePreview template={template} />
                        <div className="flex items-center justify-between border-t border-gray-100 bg-white px-3.5 py-2.5">
                          <span className="truncate text-xs font-semibold text-gray-800">{template.name}</span>
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-violet-600">
                            <Plus size={13} strokeWidth={2.5} /> Insert
                          </span>
                        </div>
                      </button>
                    ))}
                  </>
                )}
              </div>

              {footerTotalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-100 bg-white px-4 py-2.5 text-xs text-gray-600">
                  <button
                    type="button"
                    disabled={footerPage === 0 || isFootersLoading}
                    onClick={() => setFooterPage((p) => Math.max(0, p - 1))}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 font-medium hover:bg-gray-50 disabled:opacity-40"
                  >
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <span className="text-[11px] font-medium text-gray-500">
                    Page {footerPage + 1} of {footerTotalPages}
                  </span>
                  <button
                    type="button"
                    disabled={footerPage + 1 >= footerTotalPages || isFootersLoading}
                    onClick={() => setFooterPage((p) => p + 1)}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 font-medium hover:bg-gray-50 disabled:opacity-40"
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          ) : selectedCategory === "buttons" ? (
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="border-b border-gray-100 p-3 space-y-2.5">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={buttonSearch}
                    onChange={(e) => setButtonSearch(e.target.value)}
                    placeholder="Search buttons..."
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-7 text-xs outline-none focus:border-violet-500 focus:bg-white"
                  />
                  {buttonSearch && (
                    <button
                      type="button"
                      onClick={() => setButtonSearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
                {buttonCategories.length > 0 && (
                  <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                    <button
                      type="button"
                      onClick={() => { setButtonCategory("all"); setButtonPage(0); }}
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium capitalize transition ${
                        buttonCategory === "all"
                          ? "bg-violet-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      All
                    </button>
                    {buttonCategories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => { setButtonCategory(cat); setButtonPage(0); }}
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium capitalize transition ${
                          buttonCategory === cat
                            ? "bg-violet-600 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {isButtonsLoading ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4, 5, 6].map((s) => (
                      <div key={s} className="h-20 animate-pulse rounded-xl border border-gray-100 bg-gray-100" />
                    ))}
                  </div>
                ) : buttonsError ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/50 p-6 text-center">
                    <AlertCircle size={24} className="mb-2 text-red-500" />
                    <p className="text-xs font-semibold text-gray-800">Could not load button templates</p>
                    <p className="mt-1 text-[11px] text-gray-500">{buttonsError}</p>
                    <button
                      type="button"
                      onClick={loadButtonTemplates}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700"
                    >
                      <RefreshCw size={12} /> Retry
                    </button>
                  </div>
                ) : buttonTemplates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-gray-50 p-6 text-center">
                    <FolderOpen size={24} className="mb-2 text-gray-400" />
                    <p className="text-xs font-semibold text-gray-700">No button templates found</p>
                    <button
                      type="button"
                      onClick={loadButtonTemplates}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <RefreshCw size={12} /> Refresh
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mb-3 flex items-center justify-between text-xs text-gray-500">
                      <span>{buttonTotalElements} Button styles</span>
                      <span>Click to insert</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {buttonTemplates.map((template) => {
                        const btnNode = template.nodes[0];
                        return (
                          <button
                            key={template.id}
                            type="button"
                            onClick={() => addButtonElement(template)}
                            title={template.name}
                            className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white p-2.5 text-left transition hover:border-violet-400 hover:shadow-md active:scale-[0.98]"
                          >
                            <div className="flex h-16 w-full items-center justify-center rounded-lg bg-gray-50 px-2">
                              {btnNode && (
                                <span
                                  className="inline-flex items-center justify-center px-4 py-1.5 text-xs font-semibold truncate max-w-full"
                                  style={{
                                    background: btnNode.gradient || btnNode.backgroundColor || "#6d28d9",
                                    color: btnNode.color || "#ffffff",
                                    borderRadius:
                                      typeof btnNode.borderRadius === "number"
                                        ? `${btnNode.borderRadius}px`
                                        : btnNode.borderRadius || "6px",
                                    border:
                                      btnNode.borderWidth && btnNode.borderColor
                                        ? `${btnNode.borderWidth}px solid ${btnNode.borderColor}`
                                        : undefined,
                                  }}
                                >
                                  {btnNode.content}
                                </span>
                              )}
                            </div>
                            <span className="mt-2 truncate text-[11px] font-medium text-gray-700 group-hover:text-violet-700">
                              {template.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {buttonTotalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-100 bg-white px-4 py-2.5 text-xs text-gray-600">
                  <button
                    type="button"
                    disabled={buttonPage === 0 || isButtonsLoading}
                    onClick={() => setButtonPage((p) => Math.max(0, p - 1))}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 font-medium hover:bg-gray-50 disabled:opacity-40"
                  >
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <span className="text-[11px] font-medium text-gray-500">
                    Page {buttonPage + 1} of {buttonTotalPages}
                  </span>
                  <button
                    type="button"
                    disabled={buttonPage + 1 >= buttonTotalPages || isButtonsLoading}
                    onClick={() => setButtonPage((p) => p + 1)}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 font-medium hover:bg-gray-50 disabled:opacity-40"
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          ) : selectedCategory === "elements" ? (
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {elementTemplates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => addSection(template)}
                  className="group w-full rounded-xl border border-gray-200 p-4 text-left transition hover:border-purple-400 hover:shadow-md"
                >
                  <div className="mb-3 flex min-h-[100px] items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-100">
                    <span className="text-sm text-gray-500">
                      &lt;div&gt;
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">
                      {template.name}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-semibold text-purple-700">
                      <Plus size={14} /> Add
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : selectedCategory === "icons" ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <EmailIconBlocksBrowser onSelectBlock={addSection} />
            </div>
          ) : selectedCategory === "highlights" ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <EmailHighlightBlocksBrowser onSelectBlock={addSection} />
            </div>
          ) : selectedCategory === "bricks" ||
            selectedCategory === "columns" ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <EmailStructuredBlocksBrowser
                kind={selectedCategory}
                onSelectBlock={addSection}
              />
            </div>
          ) : (
            <div className="p-5 text-sm text-gray-500">
              More {selectedCategoryLabel?.toLowerCase()} designs are coming next.
            </div>
          )}

        </>
      )}
    </div>
  );
}

/**
 * Pixel-accurate miniature preview of header templates for the Elements panel.
 * Uses exact proportional scaling (scale = 328px / 600px ≈ 0.5467)
 * so the thumbnail card matches the Canva design and the inserted canvas layout.
 */
function HeaderMiniaturePreview({
  template,
}: {
  template: EmailSectionTemplate;
}) {
  const height = template.height || 100;
  const scale = 0.5467;

  return (
    <div
      className="relative w-full overflow-hidden select-none"
      style={{
        height: `${Math.round(height * scale)}px`,
        backgroundColor: template.backgroundColor,
      }}
    >
      <div
        style={{
          width: "600px",
          height: `${height}px`,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          position: "relative",
          backgroundColor: template.backgroundColor,
        }}
      >
        {template.nodes.map((node, index) => {
          const fontSize = node.fontSize || 14;
          const left = node.x ?? 24;
          const top = node.y ?? 24;
          const width = node.width ?? 552;
          const nodeHeight = node.height ?? 40;

          if (node.type === "image") {
            const src = node.content || node.url || "";
            return (
              <div
                key={index}
                style={{
                  position: "absolute",
                  left: `${left}px`,
                  top: `${top}px`,
                  width: `${width}px`,
                  height: `${nodeHeight}px`,
                  overflow: "hidden",
                  borderRadius:
                    typeof node.borderRadius === "number"
                      ? `${node.borderRadius}px`
                      : node.borderRadius || undefined,
                }}
              >
                {src ? (
                  <img
                    src={src}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: width <= 64 ? "contain" : "cover",
                      borderRadius:
                        typeof node.borderRadius === "number"
                          ? `${node.borderRadius}px`
                          : node.borderRadius || undefined,
                    }}
                  />
                ) : null}
              </div>
            );
          }

          if (node.type === "container") {
            return (
              <div
                key={index}
                style={{
                  position: "absolute",
                  left: `${left}px`,
                  top: `${top}px`,
                  width: `${width}px`,
                  height: `${nodeHeight}px`,
                  backgroundColor:
                    node.backgroundColor || "rgba(255, 255, 255, 0.4)",
                  borderRadius:
                    typeof node.borderRadius === "number"
                      ? `${node.borderRadius}px`
                      : node.borderRadius || undefined,
                }}
              />
            );
          }

          return (
            <div
              key={index}
              style={{
                position: "absolute",
                left: `${left}px`,
                top: `${top}px`,
                width: `${width}px`,
                height: `${nodeHeight}px`,
                fontSize: `${fontSize}px`,
                color: node.color || "#ffffff",
                fontWeight:
                  node.type === "heading" || node.type === "logo"
                    ? "bold"
                    : "normal",
                lineHeight: 1.25,
                whiteSpace: "pre-wrap",
                textDecoration: node.type === "link" ? "underline" : "none",
                display: "flex",
                alignItems: "center",
              }}
            >
              {node.content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
