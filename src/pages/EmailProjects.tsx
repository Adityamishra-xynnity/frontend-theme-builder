import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  X,
  Plus,
  Mail,
  Copy,
  Trash2,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";
import {
  fetchEmailCampaignsPaginated,
  duplicateEmailCampaign,
  deleteEmailCampaign,
} from "../email-campaign/services/emailCampaignApi";
import type { EmailCampaignResponse } from "../email-campaign/types/campaign";

export default function EmailProjects() {
  const navigate = useNavigate();

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

  const loadCampaigns = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchEmailCampaignsPaginated(
        page,
        12,
        debouncedSearch || undefined
      );
      setCampaigns(result.content || []);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load saved email campaigns."
      );
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  const handleDuplicate = async (id: number) => {
    setBusyId(id);
    setError(null);
    try {
      await duplicateEmailCampaign(id);
      await loadCampaigns();
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
      await loadCampaigns();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `Failed to delete campaign #${id}`
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-200">
            <Mail size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">
              Email Projects
            </h1>
            <p className="text-sm text-gray-500">
              {totalElements} saved email {totalElements === 1 ? "campaign" : "campaigns"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search campaigns..."
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-8 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() =>
              navigate("/email-campaign", { state: { newBlank: Date.now() } })
            }
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-700"
          >
            <Plus size={16} />
            New Campaign
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <div
              key={s}
              className="h-44 animate-pulse rounded-2xl border border-gray-200 bg-white"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50/60 p-10 text-center">
          <AlertCircle size={32} className="mx-auto mb-3 text-red-500" />
          <h2 className="text-base font-bold text-gray-900">
            Could not load email campaigns
          </h2>
          <p className="mt-1 text-sm text-gray-600">{error}</p>
          <button
            type="button"
            onClick={loadCampaigns}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
          >
            <RefreshCw size={15} /> Retry
          </button>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
          <FolderOpen size={36} className="mx-auto mb-3 text-gray-300" />
          <h2 className="text-base font-bold text-gray-800">
            No saved email campaigns yet
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Create a campaign in the Email Campaign editor and click Save.
          </p>
          <button
            type="button"
            onClick={() =>
              navigate("/email-campaign", { state: { newBlank: Date.now() } })
            }
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
          >
            <Plus size={16} /> Create Email Campaign
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((campaign) => {
              const isBusy = busyId === campaign.id;
              const sectionCount = Array.isArray(campaign.sectionsData)
                ? campaign.sectionsData.length
                : 0;
              return (
                <div
                  key={campaign.id}
                  className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs transition hover:border-violet-300 hover:shadow-md"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="truncate text-base font-bold text-gray-900">
                        {campaign.name}
                      </h3>
                      <span className="shrink-0 rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
                        {campaign.status || "DRAFT"}
                      </span>
                    </div>

                    <p className="mt-1.5 truncate text-sm text-gray-600">
                      Subject: {campaign.subject}
                    </p>

                    <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
                      <span>{sectionCount} sections</span>
                      {campaign.updatedAt && (
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(campaign.updatedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 flex items-center gap-2 border-t border-gray-100 pt-4">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => navigate(`/email-campaign/${campaign.id}`)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
                    >
                      <ExternalLink size={13} /> Open in Editor
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleDuplicate(campaign.id)}
                      title="Duplicate campaign"
                      className="rounded-xl border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleDelete(campaign.id)}
                      title="Delete campaign"
                      className="rounded-xl border border-red-200 p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-4 text-sm text-gray-600">
              <button
                type="button"
                disabled={page === 0 || isLoading}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 font-medium hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <span className="text-xs font-medium text-gray-500">
                Page {page + 1} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page + 1 >= totalPages || isLoading}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 font-medium hover:bg-gray-50 disabled:opacity-40"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
