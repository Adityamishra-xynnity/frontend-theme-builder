import { useCallback, useEffect, useState } from "react";
import {
  Search,
  X,
  FolderOpen,
  RefreshCw,
  AlertCircle,
  Copy,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";
import { useEmailEditor } from "../context/EmailEditorContext";
import {
  fetchEmailCampaignsPaginated,
  fetchEmailCampaignById,
  duplicateEmailCampaign,
  deleteEmailCampaign,
} from "../services/emailCampaignApi";
import type { EmailCampaignResponse } from "../types/campaign";

export default function EmailProjectsPanel() {
  const { currentCampaignId, loadCampaign, resetToBlank } = useEmailEditor();

  const [campaigns, setCampaigns] = useState<EmailCampaignResponse[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchEmailCampaignsPaginated(
        page,
        8,
        debouncedSearch || undefined
      );
      setCampaigns(result.content || []);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load saved campaigns."
      );
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleOpen = async (id: number) => {
    setBusyId(id);
    setError(null);
    try {
      const fullCampaign = await fetchEmailCampaignById(id);
      loadCampaign(fullCampaign);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `Failed to open campaign #${id}`
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleDuplicate = async (id: number) => {
    setBusyId(id);
    setError(null);
    try {
      await duplicateEmailCampaign(id);
      await loadProjects();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `Failed to duplicate campaign #${id}`
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: number) => {
    setBusyId(id);
    setError(null);
    try {
      await deleteEmailCampaign(id);
      if (currentCampaignId === id) {
        resetToBlank();
      }
      await loadProjects();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `Failed to delete campaign #${id}`
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Email Projects</h2>
          <span className="text-[11px] font-medium text-gray-400">
            {totalElements} saved
          </span>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Reopen, duplicate, or manage your saved email campaigns.
        </p>

        <div className="relative mt-3">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search saved campaigns..."
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-8 pr-7 text-xs outline-none focus:border-violet-500 focus:bg-white"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className="h-24 animate-pulse rounded-xl border border-gray-100 bg-gray-100"
              />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-100 bg-red-50/50 p-5 text-center">
            <AlertCircle size={22} className="mx-auto mb-2 text-red-500" />
            <p className="text-xs font-semibold text-gray-800">
              Could not load projects
            </p>
            <p className="mt-1 text-[11px] text-gray-500">{error}</p>
            <button
              type="button"
              onClick={loadProjects}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700"
            >
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center">
            <FolderOpen size={24} className="mx-auto mb-2 text-gray-300" />
            <p className="text-xs font-semibold text-gray-700">
              No saved campaigns found
            </p>
            <p className="mt-1 text-[11px] text-gray-400">
              Save a campaign from the top bar to see it here.
            </p>
          </div>
        ) : (
          campaigns.map((item) => {
            const isActive = currentCampaignId === item.id;
            const isBusy = busyId === item.id;
            return (
              <div
                key={item.id}
                className={`rounded-xl border p-3 transition ${
                  isActive
                    ? "border-violet-400 bg-violet-50/40"
                    : "border-gray-200 bg-white hover:border-violet-300"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-xs font-bold text-gray-800">
                      {item.name}
                    </h3>
                    <p className="mt-0.5 truncate text-[11px] text-gray-500">
                      {item.subject}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                    {item.status || "DRAFT"}
                  </span>
                </div>

                {item.updatedAt && (
                  <p className="mt-2 flex items-center gap-1 text-[10px] text-gray-400">
                    <Clock size={10} />
                    {new Date(item.updatedAt).toLocaleString()}
                  </p>
                )}

                <div className="mt-3 flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleOpen(item.id)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-violet-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
                  >
                    <ExternalLink size={11} />
                    {isActive ? "Reload" : "Open"}
                  </button>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleDuplicate(item.id)}
                    title="Duplicate campaign"
                    className="rounded-lg border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Copy size={12} />
                  </button>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleDelete(item.id)}
                    title="Delete campaign"
                    className="rounded-lg border border-red-200 p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2.5 text-xs text-gray-600">
          <button
            type="button"
            disabled={page === 0 || isLoading}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 font-medium hover:bg-gray-50 disabled:opacity-40"
          >
            <ChevronLeft size={13} /> Prev
          </button>
          <span className="text-[11px] text-gray-500">
            Page {page + 1} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page + 1 >= totalPages || isLoading}
            onClick={() => setPage((p) => p + 1)}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 font-medium hover:bg-gray-50 disabled:opacity-40"
          >
            Next <ChevronRight size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
