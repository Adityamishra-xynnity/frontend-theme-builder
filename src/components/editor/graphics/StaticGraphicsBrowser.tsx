import { useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import {
  ArrowLeft,
  Search,
  X,
  Leaf,
  Sun,
  Tent,
  PawPrint,
  Compass,
  Coffee,
  Apple,
  BookOpen,
  Briefcase,
  Minus,
  Sparkles,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import type {
  GraphicAsset,
  GraphicCategory,
} from "../../../types/graphics";
import {
  getGraphicCategories,
  getRecommendedGraphics,
  getGraphics,
} from "../../../api/graphicsApi";
import CategoryRail from "./CategoryRail";
import CategorySeeAllView from "./CategorySeeAllView";
import GraphicCard from "./GraphicCard";

interface StaticGraphicsBrowserProps {
  onBack: () => void;
  onSelectGraphic?: (graphic: GraphicAsset) => void;
}

const STATIC_CATEGORY_ICONS: Record<string, ReactNode> = {
  "bold-foliage": <Leaf size={14} />,
  "organic-summer": <Sun size={14} />,
  "camping-rustic-drawing": <Tent size={14} />,
  "vivid-leaves": <Leaf size={14} />,
  "handdrawn-animals": <PawPrint size={14} />,
  "pastel-travel-accessories": <Compass size={14} />,
  "simple-drawn-objects": <Coffee size={14} />,
  "organic-sketched-fruit": <Apple size={14} />,
  "educational-graphics": <BookOpen size={14} />,
  "business-graphics": <Briefcase size={14} />,
  "lines-dividers": <Minus size={14} />,
};

export default function StaticGraphicsBrowser({
  onBack,
  onSelectGraphic,
}: StaticGraphicsBrowserProps) {
  // Navigation & Subview
  const [activeSeeAllCategory, setActiveSeeAllCategory] =
    useState<GraphicCategory | null>(null);

  // Search State
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchResults, setSearchResults] = useState<GraphicAsset[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchTotal, setSearchTotal] = useState(0);

  // Rails Data
  const [categories, setCategories] = useState<GraphicCategory[]>([]);
  const [recommended, setRecommended] = useState<GraphicAsset[]>([]);
  const [categoryRailMap, setCategoryRailMap] = useState<
    Record<string, GraphicAsset[]>
  >({});
  const [initialLoading, setInitialLoading] = useState(true);
  const [initialError, setInitialError] = useState<string | null>(null);

  // Cache refs
  const railsCacheRef = useRef<Record<string, GraphicAsset[]>>({});

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Load static categories and static recommendations from backend
  const loadInitialData = useCallback(async () => {
    try {
      setInitialLoading(true);
      setInitialError(null);

      // 1. Fetch static categories summary
      const fetchedCats = await getGraphicCategories("static");
      setCategories(fetchedCats);

      // 2. Fetch top recommended static graphics
      const fetchedRecs = await getRecommendedGraphics(20, "static");
      setRecommended(fetchedRecs);

      // 3. Fetch preview graphics for each static category in parallel
      const railEntries: [string, GraphicAsset[]][] = await Promise.all(
        fetchedCats.map(async (cat) => {
          if (railsCacheRef.current[cat.id]) {
            return [cat.id, railsCacheRef.current[cat.id]];
          }
          try {
            const pageResp = await getGraphics({
              categoryId: cat.id,
              type: "static",
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

      const railMap: Record<string, GraphicAsset[]> = {};
      for (const [id, items] of railEntries) {
        railMap[id] = items;
      }
      setCategoryRailMap(railMap);
    } catch (err) {
      setInitialError(
        err instanceof Error ? err.message : "Failed to load static graphics."
      );
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInitialData();
  }, [loadInitialData]);

  // Execute Search query for static graphics
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
        const resp = await getGraphics({
          search: debouncedSearch.trim(),
          type: "static",
          page: 0,
          size: 30,
        });
        if (isMounted) {
          setSearchResults(resp.content || []);
          setSearchTotal(resp.totalElements || 0);
        }
      } catch (err) {
        if (isMounted) {
          setSearchError(
            err instanceof Error ? err.message : "Search failed to complete."
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
      <CategorySeeAllView
        category={activeSeeAllCategory}
        onBack={() => setActiveSeeAllCategory(null)}
        onSelectGraphic={onSelectGraphic}
      />
    );
  }

  const isSearchActive = debouncedSearch.trim().length > 0;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white text-slate-800">
      {/* TOP HEADER */}
      <div className="bg-white px-4 pb-2 pt-3">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to Elements"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#0e1318] transition-colors hover:bg-[#f1f3f4]"
          >
            <ArrowLeft size={16} />
          </button>

          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-[#0e1318]"><span>Graphics</span></h2>
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
            placeholder="Search graphics (e.g. flowers, leaves, animals, fruit...)"
            aria-label="Search graphics library"
            className="h-10 w-full rounded-lg border border-[#d9dbe0] bg-white pl-9 pr-9 text-[13px] text-[#0e1318] outline-none transition-shadow placeholder:text-[#6b7280] focus:border-[#8b3dff] focus:ring-2 focus:ring-[#8b3dff]/25"
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

      {/* BODY CONTENT AREA */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 pt-2 space-y-6 [scrollbar-width:thin]">
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
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square animate-pulse rounded-lg bg-[#f1f3f4]"
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
                <Search size={28} className="text-slate-300" />
                <p className="mt-2 text-xs font-semibold text-slate-700">
                  No graphics found
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Try searching for foliage, leaves, animals, summer, or fruit.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {searchResults.map((graphic) => (
                  <GraphicCard
                    key={graphic.id}
                    graphic={graphic}
                    onClick={onSelectGraphic}
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
                    <div className="h-4 w-36 animate-pulse rounded-full bg-[#f1f3f4]" />
                    <div className="flex gap-2.5 overflow-hidden">
                      {Array.from({ length: 4 }).map((_, cardIdx) => (
                        <div
                          key={cardIdx}
                          className="h-[88px] w-[88px] shrink-0 animate-pulse rounded-lg bg-[#f1f3f4]"
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
                  Unable to load graphics
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
                {/* 1. RECOMMENDED RAIL */}
                {recommended.length > 0 && (
                  <CategoryRail
                    title="Recommended for You"
                    icon={<Sparkles size={14} className="text-amber-500" />}
                    graphics={recommended}
                    onSelectGraphic={onSelectGraphic}
                  />
                )}

                {/* 2. CATEGORY COLLECTIONS */}
                {categories.map((cat) => {
                  const railItems = categoryRailMap[cat.id] || [];
                  const icon = STATIC_CATEGORY_ICONS[cat.id] || (
                    <Leaf size={14} />
                  );

                  return (
                    <CategoryRail
                      key={cat.id}
                      title={cat.name}
                      icon={icon}
                      count={cat.count}
                      graphics={railItems}
                      onSeeAll={() => setActiveSeeAllCategory(cat)}
                      onSelectGraphic={onSelectGraphic}
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
