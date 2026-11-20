import { useEffect, useState, useCallback, useRef } from "react";
import {
  ArrowLeft,
  Search,
  X,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Smile,
} from "lucide-react";
import type { EmojiAsset, EmojiCategory } from "../../../types/emoji";
import { getEmojis } from "../../../api/emojiApi";
import EmojiCard from "./EmojiCard";

interface EmojiCategorySeeAllViewProps {
  category: EmojiCategory;
  onBack: () => void;
  onSelectEmoji?: (emoji: EmojiAsset) => void;
}

export default function EmojiCategorySeeAllView({
  category,
  onBack,
  onSelectEmoji,
}: EmojiCategorySeeAllViewProps) {
  const [emojis, setEmojis] = useState<EmojiAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // In-memory cache for fast tab/page navigation
  const cacheRef = useRef<
    Map<string, { items: EmojiAsset[]; totalPages: number; totalElements: number }>
  >(new Map());

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch category emojis with backend query and pagination
  const fetchCategoryEmojis = useCallback(async () => {
    const cacheKey = `${category.id}|${debouncedSearch}|${page}`;

    if (cacheRef.current.has(cacheKey)) {
      const cached = cacheRef.current.get(cacheKey)!;
      setEmojis(cached.items);
      setTotalPages(cached.totalPages);
      setTotalElements(cached.totalElements);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await getEmojis({
        category: category.id,
        search: debouncedSearch.trim() || undefined,
        page,
        size: 24,
      });

      setEmojis(response.content || []);
      setTotalPages(response.totalPages || 1);
      setTotalElements(response.totalElements || 0);

      cacheRef.current.set(cacheKey, {
        items: response.content || [],
        totalPages: response.totalPages || 1,
        totalElements: response.totalElements || 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load emojis.");
    } finally {
      setLoading(false);
    }
  }, [category.id, debouncedSearch, page]);

  useEffect(() => {
    void fetchCategoryEmojis();
  }, [fetchCategoryEmojis]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white text-slate-800">
      {/* HEADER */}
      <div className="border-b border-slate-200 bg-gradient-to-br from-white via-white to-slate-50/80 p-3.5">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to all emoji categories"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-xs transition-colors hover:bg-slate-50 hover:text-blue-600 active:scale-95"
          >
            <ArrowLeft size={16} />
          </button>

          <div className="min-w-0 flex-1">
            <h2 className="flex items-center gap-2 text-sm font-bold tracking-tight text-slate-900">
              <span className="text-base">{category.icon || "😀"}</span>
              <span className="truncate">{category.name}</span>
              {totalElements > 0 && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                  {totalElements}
                </span>
              )}
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Microsoft Fluent & Google Noto vector SVG collection
            </p>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="relative mt-3">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search within ${category.name}...`}
            aria-label={`Search within ${category.name}`}
            className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-9 text-xs text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-3 focus:ring-blue-100"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* BODY GRID */}
      <div className="flex-1 overflow-y-auto p-3.5 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        {loading ? (
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-2xl border border-slate-100 bg-slate-50 p-2"
              />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50/60 p-6 text-center">
            <AlertCircle size={24} className="text-rose-500" />
            <p className="mt-2 text-xs font-semibold text-rose-800">{error}</p>
            <button
              type="button"
              onClick={() => void fetchCategoryEmojis()}
              className="mt-3 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
            >
              Retry
            </button>
          </div>
        ) : emojis.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
            <Smile size={28} className="text-slate-300" />
            <p className="mt-2 text-xs font-semibold text-slate-700">
              No emojis found
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              Try a different search keyword.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
            {emojis.map((emoji) => (
              <EmojiCard
                key={emoji.id || emoji.assetKey}
                emoji={emoji}
                onClick={onSelectEmoji}
              />
            ))}
          </div>
        )}
      </div>

      {/* FOOTER PAGINATION */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-600">
          <span className="text-[11px] text-slate-500">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
