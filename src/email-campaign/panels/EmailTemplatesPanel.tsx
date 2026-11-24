import { useState, useEffect, useTransition } from "react";
import {
  Search,
  X,
  Sparkles,
  Eye,
  RefreshCw,
  Plus,
  AlertCircle,
  FolderOpen,
} from "lucide-react";
import { useEmailEditor } from "../context/EmailEditorContext";
import {
  fetchEmailTemplates,
  fetchEmailTemplateCategories,
} from "../services/emailCampaignApi";
import type { EmailTemplateResponse } from "../types/campaign";
import EmailTemplatePreviewModal from "../components/EmailTemplatePreviewModal";

export default function EmailTemplatesPanel() {
  const { loadTemplate, resetToBlank } = useEmailEditor();

  const [templates, setTemplates] = useState<EmailTemplateResponse[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Template currently displayed in the full preview modal
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplateResponse | null>(null);

  const [, startTransition] = useTransition();

  // Debounce search query input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        setDebouncedSearch(searchQuery);
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load categories on initial mount
  useEffect(() => {
    let isMounted = true;

    async function loadCategories() {
      try {
        const fetchedCats = await fetchEmailTemplateCategories();
        if (isMounted) {
          setCategories(fetchedCats);
        }
      } catch (err) {
        console.warn("Failed to load template categories:", err);
      }
    }

    loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch templates whenever selectedCategory or debouncedSearch changes
  const loadTemplatesData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchEmailTemplates(
        selectedCategory === "all" ? undefined : selectedCategory,
        debouncedSearch || undefined
      );
      setTemplates(data);
    } catch (err) {
      console.error("Error loading email templates:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load email templates from server"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTemplatesData();
  }, [selectedCategory, debouncedSearch]);

  const handleUseTemplate = (template: EmailTemplateResponse) => {
    loadTemplate(template);
  };

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header & Search */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Email Templates</h2>
          <span className="text-[11px] font-medium text-gray-400">
            {templates.length} available
          </span>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Canva-inspired designs ready to customize.
        </p>

        {/* Search input */}
        <div className="relative mt-3">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search all templates..."
            className="w-full rounded-lg border border-gray-200 bg-gray-50/50 py-2 pl-9 pr-8 text-xs text-gray-800 placeholder-gray-400 outline-none transition-all focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
              title="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Category Filters Pills */}
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium transition-all ${
              selectedCategory === "all"
                ? "bg-violet-600 text-white shadow-xs"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All
          </button>

          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium capitalize transition-all ${
                selectedCategory === cat
                  ? "bg-violet-600 text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat.replace(/-/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Main Templates Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Loading State Skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 gap-3.5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="overflow-hidden rounded-xl border border-gray-100 bg-white p-2 shadow-xs"
              >
                <div className="h-36 w-full animate-pulse rounded-lg bg-gray-200" />
                <div className="mt-2.5 space-y-1.5 px-1">
                  <div className="h-3 w-3/4 animate-pulse rounded bg-gray-200" />
                  <div className="h-2.5 w-1/2 animate-pulse rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-red-100 bg-red-50/50 p-6 text-center">
            <AlertCircle size={28} className="text-red-500" />
            <h4 className="mt-2 text-xs font-semibold text-red-900">
              Unable to load templates
            </h4>
            <p className="mt-1 text-[11px] text-red-600">{error}</p>
            <button
              onClick={loadTemplatesData}
              className="mt-3.5 flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-red-700 shadow-xs border border-red-200 hover:bg-red-50"
            >
              <RefreshCw size={12} />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Templates Grid with Blank Email Quick-Start Card */}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 gap-4">
            {/* Blank Email Quick-Start Card */}
            <button
              type="button"
              onClick={resetToBlank}
              className="group flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/60 p-4 text-center transition-all hover:border-violet-400 hover:bg-violet-50/40"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-xs group-hover:scale-110 group-hover:bg-violet-600 group-hover:text-white transition-all text-violet-600 border border-gray-200 group-hover:border-violet-600">
                <Plus size={18} strokeWidth={2.2} />
              </div>
              <h3 className="mt-2 text-xs font-semibold text-gray-800 group-hover:text-violet-700">
                Start with a Blank Email
              </h3>
              <p className="text-[11px] text-gray-400">
                Clear canvas and assemble from Elements
              </p>
            </button>

            {/* Empty Search Results */}
            {templates.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <FolderOpen size={32} className="text-gray-300" />
                <h4 className="mt-2 text-xs font-semibold text-gray-700">
                  No templates match your criteria
                </h4>
                <p className="mt-1 text-[11px] text-gray-400">
                  Try checking another category or clearing your search.
                </p>
                {(searchQuery || selectedCategory !== "all") && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                    }}
                    className="mt-3 text-xs font-medium text-violet-600 hover:underline"
                  >
                    Reset filters
                  </button>
                )}
              </div>
            )}

            {/* Template Cards */}
            {templates.map((template) => (
              <div
                key={template.id || template.templateKey}
                className="group relative overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-xs transition-all hover:border-violet-300 hover:shadow-md"
              >
                {/* Thumbnail Container */}
                <div className="relative h-44 w-full overflow-hidden bg-gray-100">
                  {template.thumbnailUrl ? (
                    <img
                      src={template.thumbnailUrl}
                      alt={template.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-50 to-indigo-100 text-violet-400">
                      <Sparkles size={28} />
                    </div>
                  )}

                  {/* Category Pill Tag */}
                  <span className="absolute left-2.5 top-2.5 rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-700 shadow-xs backdrop-blur-xs">
                    {template.category}
                  </span>

                  {/* Hover Overlay with Preview and Use Actions */}
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-slate-900/60 opacity-0 backdrop-blur-xs transition-opacity duration-200 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => setPreviewTemplate(template)}
                      className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-sm transition-transform hover:scale-105 hover:bg-gray-50 active:scale-95"
                    >
                      <Eye size={13} />
                      <span>Preview</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUseTemplate(template)}
                      className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-transform hover:scale-105 hover:bg-violet-700 active:scale-95"
                    >
                      <Sparkles size={13} />
                      <span>Use</span>
                    </button>
                  </div>
                </div>

                {/* Card Meta Content */}
                <div
                  className="p-3 cursor-pointer"
                  onClick={() => setPreviewTemplate(template)}
                >
                  <h3 className="truncate text-xs font-bold text-gray-800 transition-colors group-hover:text-violet-700">
                    {template.name}
                  </h3>
                  <p className="mt-0.5 line-clamp-2 text-[11px] text-gray-500 leading-relaxed">
                    {template.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Full-Screen Template Preview Modal */}
      {previewTemplate && (
        <EmailTemplatePreviewModal
          template={previewTemplate}
          isOpen={Boolean(previewTemplate)}
          onClose={() => setPreviewTemplate(null)}
          onUseTemplate={handleUseTemplate}
        />
      )}
    </div>
  );
}
