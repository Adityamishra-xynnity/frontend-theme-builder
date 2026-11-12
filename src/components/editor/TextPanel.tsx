
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Type,
  Heading,
  AlignLeft,
  Sparkles,
  Search,
  Crown,
  Sun,
} from "lucide-react";

import { useFabric } from "../../context/FabricContext";

type TextStyle = {
  text: string;
  fontSize: number;
  fontFamily: string;
  fill: string;
  fontWeight?: string;
  fontStyle?: string;
  charSpacing?: number;
  textAlign?: "left" | "center" | "right";
  textEffect?:
    | "none"
    | "neon"
    | "outline"
    | "3d"
    | "retro"
    | "striped"
    | "outside-striped";
  textStripeColor?: string;
  textStrokeColor?: string;
  textStrokeWidth?: number;
};

type Combination = {
  id: string;
  name: string;
  category: string;
  styles: TextStyle[];
};

type TextAssetApiResponse = {
  id: number;
  assetKey: string;
  name: string;
  assetType: string;
  category: string;
  assetData: {
    styles?: TextStyle[];
  };
  sortOrder: number;
  isActive: boolean;
};

type TextPageResponse = {
  content?: TextAssetApiResponse[];
  last?: boolean;
  totalPages?: number;
  number?: number;
};

const API_URL = "http://localhost:8080/api/assets/text/page";
const PAGE_SIZE = 20;

const CATEGORIES = [
  "All",
  "Elegant",
  "Celebration",
  "Business",
  "Creative",
  "Decorative",
  "Minimal",
];

export default function TextPanel() {
  const {
    addText,
    addTextCombination,
    selectedObject,
    setTextShadow,
    setTextBend,
  } = useFabric();

  const [combinations, setCombinations] = useState<Combination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [loadMoreError, setLoadMoreError] = useState("");

  const [page, setPage] = useState(-1);
  const [hasMore, setHasMore] = useState(true);
  const [retryInitial, setRetryInitial] = useState(0);

  const [shadowAmount, setShadowAmount] = useState(12);
  const [shadowSide, setShadowSide] = useState<
    "all" | "top" | "bottom" | "left" | "right"
  >("all");

  const [shadowColor, setShadowColor] = useState("#000000");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [textBendValue, setTextBendValue] = useState(0);

  const observerTargetRef = useRef<HTMLDivElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const loadingRef = useRef(false);
  const pageRef = useRef(-1);
  const hasMoreRef = useRef(true);

  // Convert backend assets into the existing Combination format.
  const mapAssets = useCallback(
    (assets: TextAssetApiResponse[]): Combination[] => {
      return assets
        .filter(
          (asset) =>
            asset.assetType === "TEXT" &&
            asset.isActive !== false &&
            Array.isArray(asset.assetData?.styles) &&
            asset.assetData.styles.length > 0,
        )
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((asset) => ({
          id: asset.assetKey,
          name: asset.name,
          category: asset.category,
          styles: asset.assetData.styles!,
        }));
    },
    [],
  );

  // Fetch one page from the paginated backend API.
  const loadPage = useCallback(
    async (
      pageNumber: number,
      reset: boolean,
      signal: AbortSignal,
    ) => {
      if (loadingRef.current || signal.aborted) return;

      if (!reset && !hasMoreRef.current) return;

      loadingRef.current = true;

      if (reset) {
        setIsLoading(true);
        setLoadError("");
        setLoadMoreError("");
      } else {
        setIsLoadingMore(true);
        setLoadMoreError("");
      }

      try {
        const params = new URLSearchParams({
          page: String(pageNumber),
          size: String(PAGE_SIZE),
        });

        if (category !== "All") {
          params.set("category", category);
        }

        const response = await fetch(`${API_URL}?${params.toString()}`, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          signal,
        });

        if (!response.ok) {
          throw new Error(
            `Text API failed. Status: ${response.status}`,
          );
        }

        const data: unknown = await response.json();

        let assets: TextAssetApiResponse[] = [];
        let backendLast: boolean | undefined;
        let backendTotalPages: number | undefined;

        // Spring Boot Page response.
        if (
          data &&
          typeof data === "object" &&
          !Array.isArray(data) &&
          "content" in data
        ) {
          const pageData = data as TextPageResponse;

          if (!Array.isArray(pageData.content)) {
            throw new Error("Invalid paginated Text API response.");
          }

          assets = pageData.content;
          backendLast = pageData.last;
          backendTotalPages = pageData.totalPages;
        } else if (Array.isArray(data)) {
          // Also supports a plain array response.
          assets = data as TextAssetApiResponse[];
        } else {
          throw new Error("Invalid response received from Text API.");
        }

        if (signal.aborted) return;

        const mappedCombinations = mapAssets(assets);

        setCombinations((previous) => {
          if (reset) {
            return mappedCombinations;
          }

          const existingIds = new Set(previous.map((item) => item.id));

          const newItems = mappedCombinations.filter(
            (item) => !existingIds.has(item.id),
          );

          return [...previous, ...newItems];
        });

        pageRef.current = pageNumber;
        setPage(pageNumber);

        let moreAvailable: boolean;

        if (typeof backendLast === "boolean") {
          moreAvailable = !backendLast;
        } else if (typeof backendTotalPages === "number") {
          moreAvailable = pageNumber + 1 < backendTotalPages;
        } else {
          moreAvailable = assets.length === PAGE_SIZE;
        }

        hasMoreRef.current = moreAvailable;
        setHasMore(moreAvailable);
      } catch (error) {
        if (signal.aborted) return;

        console.error("Failed to load text combinations:", error);

        const message =
          error instanceof Error
            ? error.message
            : "Unable to load text combinations.";

        if (reset) {
          setLoadError(message);
        } else {
          setLoadMoreError(message);
        }
      } finally {
        if (!signal.aborted) {
          loadingRef.current = false;
          setIsLoading(false);
          setIsLoadingMore(false);
        }
      }
    },
    [category, mapAssets],
  );

  // Reset pagination and load the first page when category changes.
  useEffect(() => {
    const controller = new AbortController();

    abortControllerRef.current?.abort();
    abortControllerRef.current = controller;

    loadingRef.current = false;
    pageRef.current = -1;
    hasMoreRef.current = true;

    setPage(-1);
    setHasMore(true);
    setCombinations([]);
    setLoadError("");
    setLoadMoreError("");
    setIsLoading(true);
    setIsLoadingMore(false);

    void loadPage(0, true, controller.signal);

    return () => {
      controller.abort();
    };
  }, [category, retryInitial, loadPage]);

  // Automatically load the next page when the user scrolls near the bottom.
  useEffect(() => {
    const target = observerTargetRef.current;

    if (
      !target ||
      isLoading ||
      isLoadingMore ||
      !hasMore ||
      loadError ||
      loadMoreError
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (
          entry.isIntersecting &&
          !loadingRef.current &&
          hasMoreRef.current
        ) {
          const nextPage = page + 1;
          const controller = abortControllerRef.current;

          if (controller && !controller.signal.aborted) {
            void loadPage(nextPage, false, controller.signal);
          }
        }
      },
      {
        root: null,
        rootMargin: "150px",
        threshold: 0.1,
      },
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [
    page,
    isLoading,
    isLoadingMore,
    hasMore,
    loadError,
    loadMoreError,
    loadPage,
  ]);

  // Keep bend slider synchronized with selected Fabric text.
  useEffect(() => {
    setTextBendValue(
      Math.max(-100, Math.min(100, Number(selectedObject?.textBend) || 0)),
    );
  }, [selectedObject]);

  const isTextSelected = Boolean(
    selectedObject &&
      ["i-text", "textbox"].includes(selectedObject.type),
  );

  // Search among the combinations loaded so far.
  const filteredCombinations = useMemo(() => {
    const query = search.trim().toLowerCase();

    return combinations.filter((item) => {
      const matchesSearch =
        !query ||
        `${item.name} ${item.category} ${item.styles
          .map((style) => style.text)
          .join(" ")}`
          .toLowerCase()
          .includes(query);

      return matchesSearch;
    });
  }, [combinations, search]);

  return (
    <aside className="h-full w-64 shrink-0 overflow-y-auto border-r border-gray-200 bg-white">
      {/* Add Text */}
      <div className="px-4 pb-5 pt-5">
        <p className="mb-3 px-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
          Add text
        </p>

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => addText("heading")}
            className="flex w-full items-center gap-3 rounded-xl border border-gray-200 p-3 text-left transition hover:border-blue-200 hover:bg-blue-50/50"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Heading size={19} />
            </span>

            <span>
              <span className="block text-sm font-semibold text-gray-800">
                Heading
              </span>
              <span className="text-xs text-gray-500">Large title</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => addText("subheading")}
            className="flex w-full items-center gap-3 rounded-xl border border-gray-200 p-3 text-left transition hover:border-blue-200 hover:bg-blue-50/50"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Type size={19} />
            </span>

            <span>
              <span className="block text-sm font-semibold text-gray-800">
                Subheading
              </span>
              <span className="text-xs text-gray-500">
                Supporting text
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => addText("text")}
            className="flex w-full items-center gap-3 rounded-xl border border-gray-200 p-3 text-left transition hover:border-blue-200 hover:bg-blue-50/50"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <AlignLeft size={19} />
            </span>

            <span>
              <span className="block text-sm font-semibold text-gray-800">
                Body text
              </span>
              <span className="text-xs text-gray-500">Normal text</span>
            </span>
          </button>
        </div>
      </div>

      {/* Text Combinations */}
      <div className="border-t border-gray-100 px-4 pb-5 pt-5">
        <div className="mb-3 flex items-center gap-2 px-1">
          <Sparkles size={15} className="text-blue-600" />
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
            Text combinations
          </p>
        </div>

        <div className="relative mb-3">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search text styles..."
            className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
          {CATEGORIES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                category === item
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="rounded-xl border border-dashed border-gray-200 px-3 py-8 text-center text-sm text-gray-500">
            Loading text styles...
          </div>
        ) : loadError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-5 text-center">
            <p className="text-sm font-semibold text-red-600">
              Unable to load text styles
            </p>
            <p className="mt-2 break-words text-xs text-red-500">
              {loadError}
            </p>
            <button
              type="button"
              onClick={() => setRetryInitial((value) => value + 1)}
              className="mt-3 rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <p className="mb-2 px-1 text-xs font-semibold text-gray-500">
              {filteredCombinations.length} loaded text styles
            </p>

            <div className="space-y-3">
              {filteredCombinations.map((combination) => (
                <button
                  key={combination.id}
                  type="button"
                  onClick={() => addTextCombination(combination.styles)}
                  className="group relative flex min-h-28 w-full flex-col items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-gray-50 px-3 py-4 transition hover:border-blue-300 hover:bg-blue-50/40 hover:shadow-sm"
                  title={`Add ${combination.name} to canvas`}
                >
                  <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-gray-400">
                    {combination.category}
                  </span>

                  <span className="mt-2 flex w-full flex-col items-center justify-center gap-0.5">
                    {combination.styles.map((style, index) => (
                      <span
                        key={`${combination.id}-${index}`}
                        className="block max-w-full truncate text-center leading-tight"
                        style={{
                          fontFamily: style.fontFamily,
                          fontSize: `${Math.min(style.fontSize * 0.48, 25)}px`,
                          color:
                            style.textEffect === "outline" ||
                            style.textEffect === "striped"
                              ? "transparent"
                              : style.fill,
                          backgroundImage:
                            style.textEffect === "striped"
                              ? `repeating-linear-gradient(135deg, ${style.fill} 0 5px, ${style.textStripeColor ?? "#FDBA74"} 5px 8px)`
                              : undefined,
                          backgroundClip:
                            style.textEffect === "striped" ? "text" : undefined,
                          WebkitBackgroundClip:
                            style.textEffect === "striped" ? "text" : undefined,
                          WebkitTextFillColor:
                            style.textEffect === "striped"
                              ? "transparent"
                              : undefined,
                          WebkitTextStroke:
                            style.textEffect === "outline" ||
                            style.textEffect === "retro"
                              ? `${(style.textStrokeWidth ?? 2) * 0.55}px ${style.textStrokeColor ?? style.fill}`
                              : undefined,
                          textShadow:
                            style.textEffect === "neon"
                              ? `0 0 4px ${style.fill}, 0 0 10px ${style.fill}, 0 0 18px ${style.fill}`
                              : style.textEffect === "3d"
                                ? "3px 3px 0 #581C87"
                                : style.textEffect === "retro" ||
                                    style.textEffect === "striped" ||
                                    style.textEffect === "outside-striped"
                                  ? "3px 3px 0 #9A3412"
                                  : undefined,
                          fontWeight: style.fontWeight ?? "normal",
                          fontStyle: style.fontStyle ?? "normal",
                          letterSpacing: `${Math.min(style.charSpacing ?? 0, 90) / 10}px`,
                        }}
                      >
                        {style.text}
                      </span>
                    ))}
                  </span>

                  <span className="mt-2 text-[10px] font-medium text-gray-400 group-hover:text-blue-600">
                    {combination.name} · Click to add
                  </span>
                </button>
              ))}

              {filteredCombinations.length === 0 && (
                <div className="rounded-xl border border-dashed border-gray-200 px-3 py-8 text-center text-sm text-gray-500">
                  No text styles found. Try another search.
                </div>
              )}
            </div>

            {/* Infinite scroll trigger */}
            <div ref={observerTargetRef} className="h-2 w-full" />

            {isLoadingMore && (
              <div className="py-4 text-center text-xs text-gray-500">
                Loading more text styles...
              </div>
            )}

            {loadMoreError && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-4 text-center">
                <p className="text-xs text-red-600">{loadMoreError}</p>
                <button
                  type="button"
                  onClick={() => {
                    const controller = abortControllerRef.current;

                    if (controller && !controller.signal.aborted) {
                      void loadPage(
                        pageRef.current + 1,
                        false,
                        controller.signal,
                      );
                    }
                  }}
                  className="mt-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700"
                >
                  Retry loading
                </button>
              </div>
            )}

            {!hasMore && combinations.length > 0 && (
              <p className="py-4 text-center text-xs text-gray-400">
                You have reached the end.
              </p>
            )}
          </>
        )}
      </div>

      {/* Text Formatting */}
      <div className="border-t border-gray-100 px-4 pb-5 pt-5">
        <div className="mb-3 flex items-center gap-2 px-1">
          <Crown size={15} className="text-blue-600" />
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
            Text formatting
          </p>
        </div>

        {isTextSelected ? (
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 px-3 py-4">
            <p className="text-sm font-medium text-gray-800">
              Text selected
            </p>

            <p className="mt-1 text-xs leading-5 text-gray-600">
              Double-click the text on the canvas to edit its content. Use
              the editor toolbar to change font size, color, style,
              alignment, and spacing.
            </p>

            <div className="mt-4 border-t border-blue-100 pt-4">
              {/* Text Shadow */}
              <div className="mb-3 flex items-center gap-2">
                <Sun size={15} className="text-blue-600" />
                <p className="text-xs font-bold uppercase tracking-wide text-gray-600">
                  Text shadow
                </p>
              </div>

              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-medium text-gray-600">
                  Shadow amount
                </label>
                <span className="text-xs font-semibold tabular-nums text-blue-700">
                  {shadowAmount}
                </span>
              </div>

              <input
                aria-label="Shadow amount"
                type="range"
                min="0"
                max="50"
                step="1"
                value={shadowAmount}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  setShadowAmount(value);
                  setTextShadow(value, shadowSide, shadowColor);
                }}
                className="w-full cursor-pointer accent-blue-600"
              />

              <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                <span>None</span>
                <span>Strong</span>
              </div>

              <label className="mb-2 mt-4 block text-xs font-medium text-gray-600">
                Shadow direction
              </label>

              <div className="flex flex-wrap gap-1.5">
                {[
                  { value: "all", label: "All sides" },
                  { value: "top", label: "Top" },
                  { value: "bottom", label: "Bottom" },
                  { value: "left", label: "Left" },
                  { value: "right", label: "Right" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      const side = option.value as typeof shadowSide;
                      setShadowSide(side);
                      setTextShadow(shadowAmount, side, shadowColor);
                    }}
                    className={`rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition ${
                      shadowSide === option.value
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <label className="text-xs font-medium text-gray-600">
                  Shadow color
                </label>

                <input
                  aria-label="Shadow color"
                  type="color"
                  value={shadowColor}
                  onChange={(event) => {
                    const color = event.target.value;
                    setShadowColor(color);
                    setTextShadow(shadowAmount, shadowSide, color);
                  }}
                  className="h-8 w-10 cursor-pointer rounded border border-gray-200 bg-white p-0.5"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setShadowAmount(0);
                  setTextShadow(0, shadowSide, shadowColor);
                }}
                className="mt-3 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition hover:bg-gray-100"
              >
                Remove shadow
              </button>

              {/* Text Bend */}
              <div className="mt-5 border-t border-blue-100 pt-4">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-600">
                      Text bend
                    </p>
                    <p className="mt-1 text-[10px] text-gray-400">
                      Curve the selected text
                    </p>
                  </div>

                  <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold tabular-nums text-blue-700 ring-1 ring-blue-100">
                    {textBendValue}
                  </span>
                </div>

                <input
                  aria-label="Text bend"
                  type="range"
                  min="-100"
                  max="100"
                  step="1"
                  value={textBendValue}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setTextBendValue(value);
                    setTextBend(value);
                  }}
                  className="w-full cursor-pointer accent-blue-600"
                />

                <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                  <span>Downward ∪</span>
                  <span>Straight</span>
                  <span>Upward ∩</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setTextBendValue(0);
                    setTextBend(0);
                  }}
                  className="mt-3 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition hover:bg-gray-100"
                >
                  Reset bend
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3 py-5 text-center">
            <Type size={20} className="mx-auto mb-2 text-gray-400" />

            <p className="text-sm font-medium text-gray-700">
              Select a text element
            </p>

            <p className="mt-1 text-xs leading-5 text-gray-500">
              Add a heading or text, then select it on the canvas to edit
              its content and formatting.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
