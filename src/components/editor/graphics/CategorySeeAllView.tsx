import { useEffect, useState, useCallback, useRef } from "react";
import {
  ArrowLeft,
  Search,
  X,
  AlertCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { GraphicAsset, GraphicCategory } from "../../../types/graphics";
import { getGraphics } from "../../../api/graphicsApi";
import GraphicCard from "./GraphicCard";

interface CategorySeeAllViewProps {
  category: GraphicCategory;
  onBack: () => void;
  onSelectGraphic?: (graphic: GraphicAsset) => void;
}

export default function CategorySeeAllView({
  category,
  onBack,
  onSelectGraphic,
}: CategorySeeAllViewProps) {
  const [graphics, setGraphics] = useState<GraphicAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "animated" | "static">("all");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // In-memory cache for fast tab/page navigation
  const cacheRef = useRef<Map<string, { items: GraphicAsset[]; totalPages: number; totalElements: number }>>(
    new Map()
  );

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch graphics whenever category, debouncedSearch, typeFilter, or page changes
  const fetchCategoryGraphics = useCallback(async () => {
    const cacheKey = `${category.id}|${debouncedSearch}|${typeFilter}|${page}`;

    if (cacheRef.current.has(cacheKey)) {
      const cached = cacheRef.current.get(cacheKey)!;
      setGraphics(cached.items);
      setTotalPages(cached.totalPages);
      setTotalElements(cached.totalElements);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await getGraphics({
        categoryId: category.id,
        search: debouncedSearch.trim() || undefined,
        type: typeFilter,
        page,
        size: 18,
      });

      setGraphics(response.content || []);
      setTotalPages(response.totalPages || 1);
      setTotalElements(response.totalElements || 0);

      cacheRef.current.set(cacheKey, {
        items: response.content || [],
        totalPages: response.totalPages || 1,
        totalElements: response.totalElements || 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load graphics.");
    } finally {
      setLoading(false);
    }
  }, [category.id, debouncedSearch, typeFilter, page]);

  useEffect(() => {
    void fetchCategoryGraphics();
  }, [fetchCategoryGraphics]);

  const handleFilterChange = (filter: "all" | "animated" | "static") => {
    setTypeFilter(filter);
    setPage(0);
  };

  return (
    <div className="flex h-full flex-col">
      {/* HEADER */}
      <div className="border-b border-slate-200 bg-white p-3.5">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to graphics categories"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-xs transition-colors hover:bg-slate-50 hover:text-blue-600 active:scale-95"
          >
            <ArrowLeft size={16} />
          </button>

          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-bold text-slate-900">
              {category.name}
            </h2>
            <p className="text-[11px] text-slate-500">
              {totalElements} free items • 100% Free
            </p>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="relative mt-3">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${category.name.toLowerCase()}...`}
            className="h-10 w-full rounded-lg border border-[#d9dbe0] bg-white pl-9 pr-9 text-[13px] text-[#0e1318] outline-none transition-shadow placeholder:text-[#6b7280] focus:border-[#8b3dff] focus:ring-2 focus:ring-[#8b3dff]/25"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* TYPE FILTER PILLS */}
        <div className="mt-2.5 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleFilterChange("all")}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
              typeFilter === "all"
                ? "bg-[#0e1318] text-white"
                : "bg-[#f1f3f4] text-[#0e1318] hover:bg-[#e8eaed]"
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => handleFilterChange("animated")}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
              typeFilter === "animated"
                ? "bg-[#0e1318] text-white"
                : "bg-[#f1f3f4] text-[#0e1318] hover:bg-[#e8eaed]"
            }`}
          >
            <Sparkles size={11} />
            Animated
          </button>
          <button
            type="button"
            onClick={() => handleFilterChange("static")}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
              typeFilter === "static"
                ? "bg-[#0e1318] text-white"
                : "bg-[#f1f3f4] text-[#0e1318] hover:bg-[#e8eaed]"
            }`}
          >
            Static
          </button>
        </div>
      </div>

      {/* CONTENT GRID */}
      <div className="flex-1 overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-slate-200">
        {loading ? (
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 9 }).map((_, idx) => (
              <div key={idx} className="aspect-square animate-pulse rounded-lg bg-[#f1f3f4]" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/40 p-6 text-center">
            <AlertCircle size={28} className="mb-2 text-red-500" />
            <p className="text-xs font-semibold text-slate-800">{error}</p>
            <button
              type="button"
              onClick={() => void fetchCategoryGraphics()}
              className="mt-3 rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : graphics.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {graphics.map((graphic) => (
              <GraphicCard
                key={graphic.id || graphic.assetKey}
                graphic={graphic}
                onClick={onSelectGraphic}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
            <Search size={28} className="mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No graphics found</p>
            <p className="mt-1 text-xs text-slate-500">
              Try adjusting your search or filters.
            </p>
            {(search || typeFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setTypeFilter("all");
                }}
                className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* PAGINATION CONTROLS */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs">
          <button
            type="button"
            disabled={page <= 0 || loading}
            onClick={() => setPage((prev) => Math.max(0, prev - 1))}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={14} />
            Prev
          </button>

          <span className="text-slate-500">
            Page <strong className="text-slate-800">{page + 1}</strong> of{" "}
            <strong className="text-slate-800">{totalPages}</strong>
          </span>

          <button
            type="button"
            disabled={page >= totalPages - 1 || loading}
            onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
