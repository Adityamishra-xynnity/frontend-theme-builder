import { useEffect, useState, type CSSProperties } from "react";
import { Check, Frame, LoaderCircle, Search, X } from "lucide-react";
import { useEditor, type EditorPageAsset } from "../../context/EditorContext";
import { assetLibraryService } from "../../services/assetLibraryService";

interface ApiAsset extends EditorPageAsset {
  assetType?: string;
  sortOrder?: number;
  isActive?: boolean;
}
const PAGE_SIZE = 100;

function getStyle(asset: EditorPageAsset | null) {
  return (asset?.assetData?.style ?? {}) as Record<string, unknown>;
}

function previewBorder(asset: EditorPageAsset) {
  const style = getStyle(asset);
  const lineStyle = String(style.lineStyle ?? style.kind ?? "solid");
  const color = String(style.color ?? "#C9A227");
  const width = Number(style.width ?? 4);
  const radius = Number(style.radius ?? (style.corner === "rounded" ? 16 : 0));
  return {
    border: `${Math.max(1, Math.min(width, 7))}px ${lineStyle} ${color}`,
    borderRadius: `${Math.max(0, Math.min(radius, 24))}px`,
    outline: style.secondaryColor
      ? `1px solid ${String(style.secondaryColor)}`
      : undefined,
    outlineOffset: style.secondaryColor ? "4px" : undefined,
  } as CSSProperties;
}

export default function BordersPanel() {
  const { borderAsset, setPageBorderAsset } = useEditor();
  const [assets, setAssets] = useState<ApiAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await assetLibraryService.getAssetsByType("BORDER", {
          page: 0,
          size: PAGE_SIZE,
          search: debouncedSearch.trim() || undefined,
          orderBy: "sort_order",
          ascending: true,
        });
        if (!active) return;
        const mapped: ApiAsset[] = res.data.map((r) => ({
          id: r.id as any,
          assetKey: r.asset_key,
          name: r.name,
          category: r.category,
          sortOrder: r.sort_order,
          isActive: r.is_active,
          assetData: r.json_data || {},
        }));
        setAssets(mapped);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Failed to load border assets.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [debouncedSearch]);

  const visible = assets;

  return (
    <section className="h-full bg-white">
      <header className="border-b border-slate-200 px-4 py-5">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700"><Frame size={19} /></span>
          <div><h2 className="text-lg font-bold text-slate-900">Borders</h2><p className="text-xs text-slate-500">Choose a page border</p></div>
        </div>
        <div className="relative mt-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search borders..." className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-violet-400" />
        </div>
      </header>

      <div className="p-4">
        <button type="button" onClick={() => setPageBorderAsset(null)} className={`mb-3 flex w-full items-center justify-between rounded-xl border p-3 text-left text-sm ${!borderAsset ? "border-violet-500 bg-violet-50 text-violet-700" : "border-slate-200 hover:bg-slate-50"}`}>
          <span className="flex items-center gap-2"><X size={16} /> No border</span>{!borderAsset && <Check size={17} />}
        </button>

        {loading && <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500"><LoaderCircle size={18} className="animate-spin" /> Loading borders...</div>}
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-xs text-red-700">{error}</p>}
        {!loading && !error && visible.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No borders found.</p>}

        <div className="flex flex-col gap-3">
          {visible.map((asset) => {
            const selected = borderAsset?.assetKey === asset.assetKey;
            return (
              <button key={asset.id} type="button" onClick={() => setPageBorderAsset(asset)} aria-pressed={selected} className={`rounded-xl border p-3 text-left transition ${selected ? "border-violet-500 bg-violet-50 ring-1 ring-violet-200" : "border-slate-200 hover:border-violet-300"}`}>
                <div className="flex h-24 items-center justify-center rounded-lg bg-slate-50 p-3">
                  <div className="h-full w-full bg-white shadow-sm" style={previewBorder(asset)} />
                </div>
                <div className="mt-2 flex items-center justify-between gap-2"><span className="text-sm font-semibold text-slate-800">{asset.name}</span>{selected && <Check size={17} className="text-violet-600" />}</div>
                <p className="mt-0.5 text-xs text-slate-500">{asset.category}</p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
