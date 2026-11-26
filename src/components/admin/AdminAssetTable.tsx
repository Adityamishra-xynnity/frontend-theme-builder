import { Pencil, RotateCcw, Trash2 } from "lucide-react";
import type { AdminAssetItem } from "../../api/adminAssetApi";

interface AdminAssetTableProps {
  items: AdminAssetItem[];
  loading: boolean;
  showSort?: boolean;
  onEdit: (item: AdminAssetItem) => void;
  onToggleActive: (item: AdminAssetItem) => void;
  onDeleteOrRestore: (item: AdminAssetItem) => void;
}

function renderPreview(item: AdminAssetItem) {
  const jd = item.jsonData || {};
  const svg = typeof jd.svgContent === "string" ? jd.svgContent : null;
  const imgUrl =
    (typeof jd.thumbnailUrl === "string" && jd.thumbnailUrl) ||
    (typeof jd.url === "string" && jd.url) ||
    (typeof jd.imageUrl === "string" && jd.imageUrl) ||
    null;
  const unicode =
    (typeof jd.unicode === "string" && jd.unicode) ||
    (typeof jd.emoji === "string" && jd.emoji) ||
    null;

  if (svg && svg.includes("<svg")) {
    return (
      <div
        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-1 [&>svg]:h-full [&>svg]:w-full"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  }
  if (imgUrl) {
    return (
      <img
        src={imgUrl}
        alt={item.name}
        className="h-10 w-10 rounded-lg border border-slate-200 bg-slate-50 object-contain"
      />
    );
  }
  if (unicode) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-xl">
        {unicode}
      </div>
    );
  }
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-[10px] font-bold text-slate-500">
      {item.type.slice(0, 4)}
    </div>
  );
}

export default function AdminAssetTable({
  items,
  loading,
  showSort = true,
  onEdit,
  onToggleActive,
  onDeleteOrRestore,
}: AdminAssetTableProps) {
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-500">
        Loading assets from Supabase PostgreSQL...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-center text-sm text-slate-500">
        <p className="font-semibold text-slate-700">No matching assets found</p>
        <p className="mt-1 text-xs">Try adjusting filters or click &quot;+ Add Asset&quot; to create one.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="sticky top-0 z-10 bg-slate-50 shadow-[0_1px_0_0_rgb(226,232,240)]">
          <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <th className="px-4 py-3">Preview</th>
            <th className="px-4 py-3">Name / asset_key</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Category / Subcategory</th>
            {showSort && <th className="px-4 py-3">Sort</th>}
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-slate-50/80">
              <td className="px-4 py-3">{renderPreview(item)}</td>
              <td className="px-4 py-3">
                <div className="font-semibold text-slate-900">{item.name}</div>
                <div className="font-mono text-xs text-slate-500">{item.assetKey}</div>
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex rounded-md bg-violet-50 px-2 py-0.5 text-xs font-semibold text-violet-700">
                  {item.type}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="text-slate-800">{item.category}</div>
                {item.subcategory && (
                  <div className="text-xs text-slate-400">{item.subcategory}</div>
                )}
              </td>
              {showSort && (
                <td className="px-4 py-3 font-mono text-xs text-slate-600">{item.sortOrder}</td>
              )}
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => onToggleActive(item)}
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition ${
                    item.isActive
                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                      : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                  }`}
                >
                  {item.isActive ? "Active" : "Inactive"}
                </button>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="inline-flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    title="Edit asset"
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-violet-50 hover:text-violet-700"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteOrRestore(item)}
                    title={item.isDeleted ? "Restore asset" : "Soft delete asset"}
                    className={`rounded-lg p-1.5 ${
                      item.isDeleted
                        ? "text-emerald-600 hover:bg-emerald-50"
                        : "text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                    }`}
                  >
                    {item.isDeleted ? <RotateCcw size={15} /> : <Trash2 size={15} />}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
