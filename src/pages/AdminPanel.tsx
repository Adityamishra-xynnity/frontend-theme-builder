import { useCallback, useEffect, useRef, useState } from "react";
import {
  Database,
  // FileUp,
  Plus,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  ASSET_TYPES,
  createAdminAsset,
  deleteOrRestoreAdminAsset,
  getAdminAssets,
  getAdminAssetStats,
  getAdminCategories,
  toggleAdminAssetStatus,
  updateAdminAsset,
  type AdminAssetItem,
  type AdminAssetPayload,
  type AdminAssetStats,
} from "../api/adminAssetApi";
import AdminAssetTable from "../components/admin/AdminAssetTable";
import AdminAssetFormModal from "../components/admin/AdminAssetFormModal";
// import BulkImportModal from "../components/admin/BulkImportModal";

const PAGE_SIZE = 20;

export default function AdminPanel() {
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [expandedType, setExpandedType] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE" | "TRASH">("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);

  const [items, setItems] = useState<AdminAssetItem[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<AdminAssetStats>({ total: 0, byType: {} });
  const [categories, setCategories] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminAssetItem | null>(null);
  const loadSeqRef = useRef(0);
  // const [bulkOpen, setBulkOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const loadStatsAndCategories = useCallback(async () => {
    try {
      const [statsRes, catsRes] = await Promise.all([
        getAdminAssetStats(),
        getAdminCategories(selectedType),
      ]);
      setStats(statsRes);
      setCategories(catsRes);
      if (selectedType !== "ALL") {
        if (catsRes.length > 0) {
          setSelectedCategory((prev) =>
            prev === "ALL" || !catsRes.includes(prev) ? catsRes[0] : prev
          );
        } else {
          setSelectedCategory("");
        }
      }
    } catch (err) {
      console.warn("Failed to load admin stats/categories:", err);
    }
  }, [selectedType]);

  const loadAssets = useCallback(async () => {
    if (selectedType !== "ALL" && selectedCategory === "ALL") {
      setLoading(true);
      return;
    }

    const seq = ++loadSeqRef.current;
    setLoading(true);
    setError("");
    try {
      const isDeleted = statusFilter === "TRASH";
      const isActive =
        statusFilter === "ACTIVE" ? true : statusFilter === "INACTIVE" ? false : null;

      const res = await getAdminAssets({
        type: selectedType,
        category: selectedCategory,
        isActive,
        isDeleted,
        search: debouncedSearch,
        page,
        size: PAGE_SIZE,
      });

      if (seq !== loadSeqRef.current) return;

      setItems(res.content || []);
      setTotalElements(res.totalElements || 0);
      setTotalPages(Math.max(1, res.totalPages || 1));
    } catch (err) {
      if (seq !== loadSeqRef.current) return;
      setError(err instanceof Error ? err.message : "Failed to load assets");
    } finally {
      if (seq === loadSeqRef.current) {
        setLoading(false);
      }
    }
  }, [selectedType, selectedCategory, statusFilter, debouncedSearch, page]);

  useEffect(() => {
    void loadStatsAndCategories();
  }, [loadStatsAndCategories]);

  useEffect(() => {
    void loadAssets();
  }, [loadAssets]);

  const handleSave = async (payload: AdminAssetPayload, id?: number) => {
    if (id !== undefined) {
      await updateAdminAsset(id, payload);
    } else {
      await createAdminAsset(payload);
    }
    await Promise.all([loadAssets(), loadStatsAndCategories()]);
  };

  const handleToggleActive = async (item: AdminAssetItem) => {
    try {
      await toggleAdminAssetStatus(item.id, !item.isActive);
      await loadAssets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle active status");
    }
  };

  const handleDeleteOrRestore = async (item: AdminAssetItem) => {
    try {
      await deleteOrRestoreAdminAsset(item.id, item.isDeleted);
      await Promise.all([loadAssets(), loadStatsAndCategories()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update asset");
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-88px)] w-full max-w-[1600px] flex-col overflow-hidden px-4 py-5 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
            <Database size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Asset Library Admin Panel
            </h1>
            <p className="text-xs text-slate-500">
              Manage <code className="rounded bg-slate-200/70 px-1 py-0.5">public.asset_library</code> directly ({stats.total} active records)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => void Promise.all([loadAssets(), loadStatsAndCategories()])}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
          {/* <button
            type="button"
            onClick={() => setBulkOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <FileUp size={16} />
            Bulk JSON Import
          </button> */}
          <button
            type="button"
            onClick={() => {
              setEditingItem(null);
              setFormOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700"
          >
            <Plus size={16} />
            Add Asset
          </button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
        {/* Type Sidebar */}
        <aside className="h-full overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
          <div className="mb-2 px-3 text-xs font-bold uppercase tracking-wider text-slate-400">
            Asset Types
          </div>
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => {
                setSelectedType("ALL");
                setExpandedType(null);
                setSelectedCategory("ALL");
                setPage(0);
              }}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition ${
                selectedType === "ALL"
                  ? "bg-violet-50 text-violet-700"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span>All Types</span>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {stats.total}
              </span>
            </button>

            {ASSET_TYPES.map((t) => {
              const isSelected = selectedType === t;
              const isExpanded = expandedType === t;
              return (
                <div key={t} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setExpandedType((prev) => (prev === t ? null : t));
                      } else {
                        setSelectedType(t);
                        setExpandedType(t);
                        setSelectedCategory("ALL");
                        setPage(0);
                      }
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition ${
                      isSelected
                        ? "bg-violet-50 text-violet-700"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      {isExpanded ? (
                        <ChevronDown size={14} className="shrink-0 text-violet-600" />
                      ) : (
                        <ChevronRight size={14} className="shrink-0 text-slate-400" />
                      )}
                      <span className="truncate">{t}</span>
                    </span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {stats.byType[t] ?? 0}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="ml-4 space-y-0.5 border-l border-slate-200 pl-2.5">
                      {categories.length === 0 ? (
                        <div className="px-2 py-1.5 text-xs text-slate-400">
                          No categories
                        </div>
                      ) : (
                        categories.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              setSelectedCategory(cat);
                              setPage(0);
                            }}
                            className={`flex w-full items-center rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition ${
                              selectedCategory === cat
                                ? "bg-violet-100 font-semibold text-violet-800"
                                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            }`}
                          >
                            <span className="truncate">{cat}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-200 bg-white shadow-xs">
          {/* Filters Bar */}
          <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-slate-200 p-4">
            <div className="relative min-w-[220px] flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, asset_key, category, subcategory..."
                className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-violet-500 focus:outline-none"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setPage(0);
              }}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-violet-500 focus:outline-none"
            >
              <option value="ALL">Status: All</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
              <option value="TRASH">Deleted (Trash)</option>
            </select>
          </div>

          {error && (
            <div className="m-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-medium text-rose-700">
              {error}
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto">
            <AdminAssetTable
              items={items}
              loading={loading}
              showSort={selectedType !== "ALL"}
              onEdit={(item) => {
                setEditingItem(item);
                setFormOpen(true);
              }}
              onToggleActive={handleToggleActive}
              onDeleteOrRestore={handleDeleteOrRestore}
            />
          </div>

          {/* Pagination */}
          <div className="flex shrink-0 items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-600">
            <span>
              Showing page {page + 1} of {totalPages} ({totalElements} total)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 font-semibold hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft size={14} />
                Prev
              </button>
              <button
                type="button"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 font-semibold hover:bg-slate-50 disabled:opacity-40"
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <AdminAssetFormModal
        open={formOpen}
        initialAsset={editingItem}
        categories={categories}
        defaultType={selectedType}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
      />

      {/* <BulkImportModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onImported={() => void Promise.all([loadAssets(), loadStatsAndCategories()])}
      /> */}
    </div>
  );
}
