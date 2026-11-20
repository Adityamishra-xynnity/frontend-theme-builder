import { useEffect, useState, useCallback, useRef } from "react";
import {
  ArrowLeft,
  Search,
  X,
  Smile,
  Sparkles,
  History,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import type { EmojiAsset, EmojiCategory } from "../../../types/emoji";
import {
  getEmojiCategories,
  getRecommendedEmojis,
  getEmojis,
} from "../../../api/emojiApi";
import EmojiCard from "./EmojiCard";
import EmojiCategoryRail from "./EmojiCategoryRail";
import EmojiCategorySeeAllView from "./EmojiCategorySeeAllView";

interface EmojiBrowserProps {
  onBack: () => void;
  onSelectEmoji?: (emoji: EmojiAsset) => void;
}

const RECENT_EMOJIS_KEY = "tb_recent_emojis";
const MAX_RECENT_EMOJIS = 12;

export default function EmojiBrowser({
  onBack,
  onSelectEmoji,
}: EmojiBrowserProps) {
  // Navigation & Subview
  const [activeSeeAllCategory, setActiveSeeAllCategory] =
    useState<EmojiCategory | null>(null);

  // Search State
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchResults, setSearchResults] = useState<EmojiAsset[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchTotal, setSearchTotal] = useState(0);

  // Rails Data
  const [categories, setCategories] = useState<EmojiCategory[]>([]);
  const [recommended, setRecommended] = useState<EmojiAsset[]>([]);
  const [recentEmojis, setRecentEmojis] = useState<EmojiAsset[]>([]);
  const [categoryRailMap, setCategoryRailMap] = useState<
    Record<string, EmojiAsset[]>
  >({});
  const [initialLoading, setInitialLoading] = useState(true);
  const [initialError, setInitialError] = useState<string | null>(null);

  // Cache refs
  const railsCacheRef = useRef<Record<string, EmojiAsset[]>>({});

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Load recently used emojis from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_EMOJIS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentEmojis(parsed);
        }
      }
    } catch (e) {
      console.warn("Failed to read recently used emojis from localStorage", e);
    }
  }, []);

  // Save selected emoji to Recently Used
  const handleSelectEmoji = useCallback(
    (emoji: EmojiAsset) => {
      // 1. Update recently used in state & localStorage
      setRecentEmojis((prev) => {
        const filtered = prev.filter(
          (item) => item.assetKey !== emoji.assetKey && item.id !== emoji.id
        );
        const next = [emoji, ...filtered].slice(0, MAX_RECENT_EMOJIS);
        try {
          localStorage.setItem(RECENT_EMOJIS_KEY, JSON.stringify(next));
        } catch (e) {
          console.warn("Failed to persist recent emoji", e);
        }
        return next;
      });

      // 2. Invoke parent handler to add to canvas
      onSelectEmoji?.(emoji);
    },
    [onSelectEmoji]
  );

  // Load categories and initial rails from backend
  const loadInitialData = useCallback(async () => {
    try {
      setInitialLoading(true);
      setInitialError(null);

      // 1. Fetch categories summary
      const fetchedCats = await getEmojiCategories();
      setCategories(fetchedCats);

      // 2. Fetch top recommended emojis
      const fetchedRecs = await getRecommendedEmojis(20);
      setRecommended(fetchedRecs);

      // 3. Fetch preview emojis for each canonical category in parallel
      const railEntries: [string, EmojiAsset[]][] = await Promise.all(
        fetchedCats.map(async (cat) => {
          if (railsCacheRef.current[cat.id]) {
            return [cat.id, railsCacheRef.current[cat.id]];
          }
          try {
            const pageResp = await getEmojis({
              category: cat.id,
              page: 0,
              size: 10,
            });
            const content = pageResp.content || [];
            railsCacheRef.current[cat.id] = content;
            return [cat.id, content];
          } catch {
            return [cat.id, []];
          }
        })
      );

      const railMap: Record<string, EmojiAsset[]> = {};
      for (const [id, items] of railEntries) {
        railMap[id] = items;
      }
      setCategoryRailMap(railMap);
    } catch (err) {
      setInitialError(
        err instanceof Error ? err.message : "Failed to load emoji library."
      );
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInitialData();
  }, [loadInitialData]);

  // Execute Search query strictly against the backend database
  useEffect(() => {
    if (!debouncedSearch.trim()) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    let isMounted = true;
    const runSearch = async () => {
      setSearchLoading(true);
      setSearchError(null);
      try {
        const resp = await getEmojis({
          search: debouncedSearch.trim(),
          page: 0,
          size: 36,
        });
        if (isMounted) {
          setSearchResults(resp.content || []);
          setSearchTotal(resp.totalElements || 0);
        }
      } catch (err) {
        if (isMounted) {
          setSearchError(
            err instanceof Error ? err.message : "Emoji search failed."
          );
        }
      } finally {
        if (isMounted) {
          setSearchLoading(false);
        }
      }
    };

    void runSearch();
    return () => {
      isMounted = false;
    };
  }, [debouncedSearch]);

  // If user clicked "See All" on a category, render the dedicated CategorySeeAllView
  if (activeSeeAllCategory) {
    return (
      <EmojiCategorySeeAllView
        category={activeSeeAllCategory}
        onBack={() => setActiveSeeAllCategory(null)}
        onSelectEmoji={handleSelectEmoji}
      />
    );
  }

  const isSearchActive = debouncedSearch.trim().length > 0;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white text-slate-800">
      {/* TOP HEADER */}
      <div className="border-b border-slate-200 bg-gradient-to-br from-white via-white to-slate-50/80 p-3.5">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to Elements"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-xs transition-colors hover:bg-slate-50 hover:text-blue-600 active:scale-95"
          >
            <ArrowLeft size={16} />
          </button>

          <div className="min-w-0 flex-1">
            <h2 className="flex items-center gap-1.5 text-sm font-bold tracking-tight text-slate-900">
              <Smile size={16} className="text-blue-600" />
              <span>Emojis</span>
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Microsoft Fluent & Google Noto vector SVG emoji collection
            </p>
          </div>
        </div>

        {/* SEARCH INPUT */}
        <div className="relative mt-3">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search all emojis (e.g. smile, heart, star, cat, fire...)"
            aria-label="Search emojis"
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-9 text-xs text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-3 focus:ring-blue-100"
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

        {/* HORIZONTALLY SCROLLABLE CATEGORY PILLS */}
        {!isSearchActive && categories.length > 0 && (
          <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveSeeAllCategory(cat)}
                className="group flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-xs transition-all hover:border-blue-300 hover:bg-blue-50/60 hover:text-blue-700 active:scale-95"
              >
                <span>{cat.icon || "😀"}</span>
                <span className="truncate max-w-[120px]">{cat.name}</span>
                <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-[9px] font-semibold text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-700">
                  {cat.count}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* BODY CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-6 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        {/* VIEW 1: SEARCH ACTIVE */}
        {isSearchActive && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold text-slate-900">
                Search Results ({searchTotal})
              </h3>
              <span className="text-[11px] text-slate-400">
                "{debouncedSearch}"
              </span>
            </div>

            {searchLoading ? (
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-24 animate-pulse rounded-2xl border border-slate-100 bg-slate-50 p-2"
                  />
                ))}
              </div>
            ) : searchError ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50/60 p-6 text-center">
                <AlertCircle size={24} className="text-rose-500" />
                <p className="mt-2 text-xs font-semibold text-rose-800">
                  {searchError}
                </p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
                <Smile size={28} className="text-slate-300" />
                <p className="mt-2 text-xs font-semibold text-slate-700">
                  No emojis found
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Try searching for heart, star, party, coffee, dog, or smile.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                {searchResults.map((emoji) => (
                  <EmojiCard
                    key={emoji.id || emoji.assetKey}
                    emoji={emoji}
                    onClick={handleSelectEmoji}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: BROWSING RAILS (When not searching) */}
        {!isSearchActive && (
          <>
            {initialLoading ? (
              // SKELETON RAILS
              <div className="space-y-6">
                {Array.from({ length: 3 }).map((_, railIdx) => (
                  <div key={railIdx} className="space-y-2">
                    <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
                    <div className="flex gap-2.5 overflow-hidden">
                      {Array.from({ length: 4 }).map((_, cardIdx) => (
                        <div
                          key={cardIdx}
                          className="h-28 w-24 shrink-0 animate-pulse rounded-2xl bg-slate-100"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : initialError ? (
              // ERROR STATE WITH RETRY
              <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50/60 p-6 text-center">
                <AlertCircle size={28} className="text-rose-500" />
                <p className="mt-2 text-xs font-bold text-rose-900">
                  Unable to load emojis
                </p>
                <p className="mt-1 text-[11px] text-rose-600">{initialError}</p>
                <button
                  type="button"
                  onClick={() => void loadInitialData()}
                  className="mt-3.5 inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 active:scale-95"
                >
                  <RefreshCw size={12} />
                  <span>Try Again</span>
                </button>
              </div>
            ) : (
              // NORMAL CONTENT RAILS
              <div className="space-y-6">
                {/* 1. RECENTLY USED RAIL */}
                {recentEmojis.length > 0 && (
                  <EmojiCategoryRail
                    title="Recently Used"
                    icon={<History size={14} className="text-blue-600" />}
                    count={recentEmojis.length}
                    emojis={recentEmojis}
                    onSelectEmoji={handleSelectEmoji}
                  />
                )}

                {/* 2. RECOMMENDED RAIL */}
                {recommended.length > 0 && (
                  <EmojiCategoryRail
                    title="Recommended for You"
                    icon={<Sparkles size={14} className="text-amber-500" />}
                    count={recommended.length}
                    emojis={recommended}
                    onSelectEmoji={handleSelectEmoji}
                  />
                )}

                {/* 3. 14 CANONICAL CATEGORY COLLECTIONS */}
                {categories.map((cat) => {
                  const railItems = categoryRailMap[cat.id] || [];

                  return (
                    <EmojiCategoryRail
                      key={cat.id}
                      title={cat.name}
                      icon={<span className="text-xs">{cat.icon || "😀"}</span>}
                      count={cat.count}
                      emojis={railItems}
                      onSeeAll={() => setActiveSeeAllCategory(cat)}
                      onSelectEmoji={handleSelectEmoji}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
