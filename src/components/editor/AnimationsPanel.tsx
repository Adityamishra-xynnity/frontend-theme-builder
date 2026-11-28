import { useEffect, useState } from "react";
import { Check, LoaderCircle, Search, Sparkles, X } from "lucide-react";
import { useEditor, type EditorPageAsset } from "../../context/EditorContext";
import { assetLibraryService } from "../../services/assetLibraryService";

interface ApiAsset extends EditorPageAsset {
  sortOrder?: number;
  isActive?: boolean;
}
const PAGE_SIZE = 100;

function effectName(asset: EditorPageAsset) {
  const config = asset.assetData?.config as Record<string, unknown> | undefined;
  return String(config?.effect ?? asset.assetKey).toLowerCase();
}

function previewAnimation(asset: EditorPageAsset) {
  const effect = effectName(asset);
  const supported: Record<string, string> = {
    "fade-in": "tb-fade-in 1.2s ease-in-out infinite alternate",
    float: "tb-float 2.4s ease-in-out infinite",
    pulse: "tb-pulse 1.4s ease-in-out infinite",
    "soft-glow": "tb-soft-glow 1.8s ease-in-out infinite alternate",
    shimmer: "tb-shimmer 2.2s linear infinite",
    "slide-up": "tb-slide-up 1s ease-out infinite alternate",
    "gentle-zoom": "tb-gentle-zoom 2.6s ease-in-out infinite alternate",
    sparkle: "tb-sparkle 1.8s ease-in-out infinite",
  };
  return supported[effect] ?? "tb-pulse 1.4s ease-in-out infinite";
}

export default function AnimationsPanel() {
  const { animationAsset, setPageAnimationAsset } = useEditor();
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
        const res = await assetLibraryService.getAssetsByType("ANIMATION", {
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
        if (active) setError(err instanceof Error ? err.message : "Failed to load animation assets.");
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
      <style>{`
        @keyframes tb-fade-in { from { opacity:.25 } to { opacity:1 } }
        @keyframes tb-float { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-7px) } }
        @keyframes tb-pulse { 0%,100% { transform:scale(1) } 50% { transform:scale(1.06) } }
        @keyframes tb-soft-glow { from { filter:drop-shadow(0 0 1px #fbbf24) } to { filter:drop-shadow(0 0 9px #fbbf24) } }
        @keyframes tb-shimmer { from { background-position:-200% 0 } to { background-position:200% 0 } }
        @keyframes tb-slide-up { from { transform:translateY(7px); opacity:.6 } to { transform:translateY(-4px); opacity:1 } }
        @keyframes tb-gentle-zoom { from { transform:scale(.96) } to { transform:scale(1.05) } }
        @keyframes tb-sparkle { 0%,100% { filter:brightness(1) } 50% { filter:brightness(1.5) drop-shadow(0 0 6px #f5c542) } }
      `}</style>
      <header className="border-b border-slate-200 px-4 py-5">
        <div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700"><Sparkles size={19} /></span><div><h2 className="text-lg font-bold text-slate-900">Animations</h2><p className="text-xs text-slate-500">Preview an effect on this page</p></div></div>
        <div className="relative mt-4"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search animations..." className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-violet-400" /></div>
      </header>
      <div className="p-4">
        <button type="button" onClick={() => setPageAnimationAsset(null)} className={`mb-3 flex w-full items-center justify-between rounded-xl border p-3 text-left text-sm ${!animationAsset ? "border-violet-500 bg-violet-50 text-violet-700" : "border-slate-200 hover:bg-slate-50"}`}><span className="flex items-center gap-2"><X size={16} /> No animation</span>{!animationAsset && <Check size={17} />}</button>
        {loading && <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500"><LoaderCircle size={18} className="animate-spin" /> Loading animations...</div>}
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-xs text-red-700">{error}</p>}
        {!loading && !error && visible.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No animations found.</p>}
        <div className="flex flex-col gap-3">
          {visible.map((asset) => {
            const selected = animationAsset?.assetKey === asset.assetKey;
            return <button key={asset.id} type="button" onClick={() => setPageAnimationAsset({ ...asset })} aria-pressed={selected} className={`rounded-xl border p-3 text-left transition ${selected ? "border-violet-500 bg-violet-50 ring-1 ring-violet-200" : "border-slate-200 hover:border-violet-300"}`}>
              <div className="flex h-20 items-center justify-center overflow-hidden rounded-lg bg-slate-50"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600 text-white shadow-md" style={{ animation: previewAnimation(asset) }}><Sparkles size={24} /></div></div>
              <div className="mt-2 flex items-center justify-between gap-2"><span className="text-sm font-semibold text-slate-800">{asset.name}</span>{selected && <Check size={17} className="text-violet-600" />}</div><p className="mt-0.5 text-xs text-slate-500">{asset.category}</p>
            </button>;
          })}
        </div>
      </div>
    </section>
  );
}
