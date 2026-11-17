import { useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import {
  ArrowLeft,
  Search,
  X,
  Sparkles,
  ArrowRight,
  Type,
  Shapes,
  Smile,
  Utensils,
  Award,
  BookOpen,
  Briefcase,
  Minus,
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

interface GraphicsBrowserProps {
  onBack: () => void;
  onSelectGraphic?: (graphic: GraphicAsset) => void;
}

const CATEGORY_ICONS: Record<string, ReactNode> = {
  "arrow-animations": <ArrowRight size={14} />,
  "word-animations": <Type size={14} />,
  "shape-animations": <Shapes size={14} />,
  "emoji-animations": <Smile size={14} />,
  "food-animations": <Utensils size={14} />,
  "decorative-animations": <Sparkles size={14} />,
  "certificate-animations": <Award size={14} />,
  "educational-graphics": <BookOpen size={14} />,
  "business-graphics": <Briefcase size={14} />,
  "lines-dividers": <Minus size={14} />,
};

export default function GraphicsBrowser({
  onBack,
  onSelectGraphic,
}: GraphicsBrowserProps) {
  // Navigation & Subview
  const [activeSeeAllCategory, setActiveSeeAllCategory] =
    useState<GraphicCategory | null>(null);

  // Search State
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchType, setSearchType] = useState<"all" | "animated" | "static">("all");
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

  // Load initial categories and recommendations
  const loadInitialData = useCallback(async () => {
    try {
      setInitialLoading(true);
      setInitialError(null);

      // 1. Fetch animated categories summary
      const fetchedCats = await getGraphicCategories("animated");
      setCategories(fetchedCats);

      // 2. Fetch top animated recommendations
      const fetchedRecs = await getRecommendedGraphics(20, "animated");
      setRecommended(fetchedRecs);

      // 3. Fetch preview graphics for each animated category in parallel
      const railEntries: [string, GraphicAsset[]][] = await Promise.all(
        fetchedCats.map(async (cat) => {
          if (railsCacheRef.current[cat.id]) {
            return [cat.id, railsCacheRef.current[cat.id]];
          }
          try {
            const pageResp = await getGraphics({
              categoryId: cat.id,
              type: "animated",
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
        err instanceof Error ? err.message : "Failed to load graphics."
      );
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInitialData();
  }, [loadInitialData]);

  // Execute Search query when debouncedSearch or searchType changes
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
          type: "animated",
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
  }, [debouncedSearch, searchType]);

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
              <Sparkles size={16} className="text-blue-600" />
              <span>Animated Designs</span>
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Dynamic animated elements, arrows & decorative vectors
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
            placeholder="Search animated designs (arrows, words, shapes, food...)"
            aria-label="Search animated designs library"
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

        {/* SEARCH FILTER PILLS (When searching) */}
        {isSearchActive && (
          <div className="mt-2.5 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSearchType("all")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                searchType === "all"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
              }`}
            >
              All ({searchTotal})
            </button>
            <button
              type="button"
              onClick={() => setSearchType("animated")}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                searchType === "animated"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
              }`}
            >
              <Sparkles size={11} />
              Animated
            </button>
            <button
              type="button"
              onClick={() => setSearchType("static")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                searchType === "static"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
              }`}
            >
              Static
            </button>
          </div>
        )}
      </div>

      {/* BODY CONTENT */}
      <div className="flex-1 overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-slate-200">
        {isSearchActive ? (
          /* SEARCH RESULTS GRID VIEW */
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-slate-600">
                Found {searchTotal} graphics for &quot;{debouncedSearch}&quot;
              </span>
            </div>

            {searchLoading ? (
              <div className="grid grid-cols-3 gap-2.5">
                {Array.from({ length: 9 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="flex h-32 animate-pulse flex-col items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-2"
                  >
                    <div className="h-24 w-full rounded-xl bg-slate-200/70" />
                    <div className="mt-2 h-2.5 w-14 rounded bg-slate-200/70" />
                  </div>
                ))}
              </div>
            ) : searchError ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/40 p-6 text-center">
                <AlertCircle size={24} className="mb-2 text-red-500" />
                <p className="text-xs font-semibold text-slate-800">
                  {searchError}
                </p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-3 gap-2.5">
                {searchResults.map((graphic) => (
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
                <p className="text-sm font-semibold text-slate-700">
                  No matching graphics
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Try searching for arrows, words, shapes, food, or stars.
                </p>
              </div>
            )}
          </div>
        ) : initialLoading ? (
          /* INITIAL LOADING SKELETON */
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="space-y-2">
                <div className="h-4 w-36 animate-pulse rounded bg-slate-200/80" />
                <div className="flex gap-2.5 overflow-hidden">
                  {Array.from({ length: 4 }).map((__, cIdx) => (
                    <div
                      key={cIdx}
                      className="h-32 w-28 shrink-0 animate-pulse rounded-2xl bg-slate-100"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : initialError ? (
          /* INITIAL ERROR STATE */
          <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/40 p-6 text-center">
            <AlertCircle size={28} className="mb-2 text-red-500" />
            <p className="text-sm font-semibold text-slate-800">
              Failed to load graphics
            </p>
            <p className="mt-1 text-xs text-slate-500">{initialError}</p>
            <button
              type="button"
              onClick={() => void loadInitialData()}
              className="mt-3.5 flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 active:scale-95"
            >
              <RefreshCw size={13} />
              <span>Retry</span>
            </button>
          </div>
        ) : (
          /* CANVA-STYLE CATEGORY RAILS */
          <div className="space-y-5 pb-4">
            {/* 1. RECOMMENDED FOR YOU RAIL */}
            {recommended.length > 0 && (
              <CategoryRail
                title="Recommended for You"
                icon={<Sparkles size={14} className="text-amber-500" />}
                count={recommended.length}
                graphics={recommended}
                onSelectGraphic={onSelectGraphic}
                onSeeAll={() =>
                  setActiveSeeAllCategory({
                    id: "all",
                    name: "Recommended for You",
                    count: recommended.length,
                    iconKey: "Sparkles",
                    isAnimated: true,
                  })
                }
              />
            )}

            {/* 2. DYNAMIC CATEGORIES RAILS */}
            {categories.map((category) => {
              const railItems = categoryRailMap[category.id] || [];
              const icon = CATEGORY_ICONS[category.id] || <Sparkles size={14} />;

              return (
                <CategoryRail
                  key={category.id}
                  title={category.name}
                  icon={icon}
                  count={category.count}
                  graphics={railItems}
                  onSelectGraphic={onSelectGraphic}
                  onSeeAll={() => setActiveSeeAllCategory(category)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
