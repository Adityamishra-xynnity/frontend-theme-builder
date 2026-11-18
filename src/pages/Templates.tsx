import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Eye,
  Filter,
  LayoutTemplate,
  Palette,
  Search,
  Sparkles,
  WandSparkles,
  X,
} from "lucide-react";

import {
  getTemplatesPage,
  type CertificateTemplate,
} from "../api/templateApi";
import CertificatePreview from "../components/common/CertificatePreview";

const CATEGORIES = [
  "All Templates",
  "Academic",
  "Achievement",
  "Appreciation",
  "Participation",
  "Professional",
  "Completion",
] as const;

type CategoryType = (typeof CATEGORIES)[number];

export default function Templates() {
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>("All Templates");

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // Fetch all templates (size 50 covers the complete collection)
      const response = await getTemplatesPage(0, 50);
      const uniqueTemplates = new Map(
        response.content.map((template) => [template.templateKey, template])
      );
      setTemplates(Array.from(uniqueTemplates.values()));
    } catch (err) {
      console.error("Template loading error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load templates."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  // Compute category counts for badge indicators
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      "All Templates": templates.length,
    };
    for (const cat of CATEGORIES) {
      if (cat === "All Templates") continue;
      counts[cat] = templates.filter(
        (t) => t.category?.toLowerCase() === cat.toLowerCase()
      ).length;
    }
    return counts;
  }, [templates]);

  // Live filter templates by category and search query
  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const matchesCategory =
        selectedCategory === "All Templates" ||
        template.category?.toLowerCase() === selectedCategory.toLowerCase();

      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        (template.category && template.category.toLowerCase().includes(query));

      return matchesCategory && matchesSearch;
    });
  }, [templates, selectedCategory, searchQuery]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All Templates");
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* --- HERO HEADER SECTION --- */}
      <section className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-indigo-200/40 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-white/90 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-blue-700 shadow-sm backdrop-blur-sm">
              <Sparkles size={15} className="text-blue-600" />
              Canva-Inspired Certificate Collection
            </div>

            <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
              Certificate Templates
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
              Choose a professionally designed certificate and customize it your way.
            </p>

            {/* Feature Highlights */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <Check size={16} className="text-blue-600" />
                100% Vector & Editable
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium">
                <Check size={16} className="text-blue-600" />
                Pixel-Perfect Canvas Match
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium">
                <Check size={16} className="text-blue-600" />
                Instant Customization
              </span>
            </div>

            {/* Live Search Input */}
            <div className="mx-auto mt-8 max-w-xl">
              <div className="relative flex items-center">
                <div className="pointer-events-none absolute left-4 text-slate-400">
                  <Search size={20} />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search certificate templates..."
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-11 text-sm font-medium text-slate-900 shadow-sm placeholder:text-slate-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 sm:text-base"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3.5 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    title="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- CATEGORY FILTERS & CONTROLS --- */}
      <section className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-5 py-4 sm:px-8 lg:px-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <span className="flex items-center gap-1.5 pl-1 pr-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <Filter size={13} />
                Category:
              </span>
              {CATEGORIES.map((category) => {
                const count = categoryCounts[category] ?? 0;
                const isActive = selectedCategory === category;

                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 sm:text-sm ${
                      isActive
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-600/20"
                        : "border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50/60 hover:text-blue-700"
                    }`}
                  >
                    <span>{category}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                        isActive
                          ? "bg-white/25 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Template Count Badge */}
            <div className="hidden shrink-0 items-center gap-2 text-xs font-semibold text-slate-500 sm:flex">
              <LayoutTemplate size={15} className="text-blue-600" />
              Showing {filteredTemplates.length} of {templates.length} templates
            </div>
          </div>
        </div>
      </section>

      {/* --- TEMPLATES GRID SECTION --- */}
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-12 lg:px-10">
        {/* Error State */}
        {error && templates.length === 0 ? (
          <div className="rounded-2xl border border-red-200 bg-white px-6 py-12 text-center shadow-sm">
            <h3 className="text-xl font-bold text-slate-900">
              Unable to load templates
            </h3>
            <p className="mt-2 text-sm text-slate-500">{error}</p>
            <button
              onClick={() => void loadTemplates()}
              className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : loading && templates.length === 0 ? (
          /* Loading Skeleton Grid */
          <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm animate-pulse"
              >
                <div className="aspect-[900/650] w-full rounded-xl bg-slate-100" />
                <div className="mt-4 h-5 w-2/3 rounded-md bg-slate-100" />
                <div className="mt-2 h-4 w-full rounded-md bg-slate-100" />
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <div className="h-4 w-20 rounded-md bg-slate-100" />
                  <div className="h-8 w-24 rounded-lg bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredTemplates.length > 0 ? (
          /* Template Cards Grid */
          <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3 xl:gap-8">
            {filteredTemplates.map((template) => {
              const heading = template.elementsData?.find(
                (el) => el.type === "heading"
              );
              const mainAccentColor =
                heading?.type === "heading" && heading.color
                  ? heading.color
                  : "#1e3a8a";

              return (
                <article
                  key={template.templateKey}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/10 focus-within:ring-2 focus-within:ring-blue-500"
                >
                  {/* Certificate Preview Thumbnail */}
                  <div className="relative overflow-hidden bg-slate-50/70 p-4 sm:p-5">
                    <div className="relative aspect-[900/650] w-full overflow-hidden rounded-xl border border-slate-200/80 shadow-md transition-transform duration-300 group-hover:scale-[1.01]">
                      <CertificatePreview
                        backgroundColor={template.backgroundColor}
                        elements={template.elementsData}
                      />

                      {/* Hover Overlay with "Use This Template" Action */}
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-950/45 opacity-0 backdrop-blur-[2px] transition-all duration-200 group-hover:opacity-100">
                        <Link
                          to={`/editor/${template.templateKey}`}
                          className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-slate-900 shadow-xl transition-all duration-200 hover:scale-105 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-4 focus:ring-white/60"
                        >
                          <Eye size={17} className="text-blue-600" />
                          Use This Template
                          <ArrowRight size={16} />
                        </Link>
                      </div>

                      {/* Top Badges */}
                      <div className="pointer-events-none absolute left-2.5 top-2.5 flex items-center gap-1.5">
                        <span className="rounded-md border border-white/80 bg-white/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700 shadow-sm">
                          900 × 650
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Content & Meta */}
                  <div className="flex flex-1 flex-col justify-between p-5">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          {template.category && (
                            <span className="inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-blue-700 border border-blue-200/50">
                              {template.category}
                            </span>
                          )}
                          <h3 className="mt-1.5 text-base font-bold text-slate-900 transition-colors group-hover:text-blue-700 sm:text-lg">
                            {template.name}
                          </h3>
                        </div>

                        {/* Accent Color Dot */}
                        <div
                          className="mt-1 h-6 w-6 shrink-0 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-200"
                          style={{ backgroundColor: mainAccentColor }}
                          title={`Accent: ${mainAccentColor}`}
                        />
                      </div>

                      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500 sm:text-sm">
                        {template.description}
                      </p>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-3.5">
                      <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                        <Palette size={14} className="text-blue-600" />
                        <span>Editable elements</span>
                      </div>

                      <Link
                        to={`/editor/${template.templateKey}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white transition-all duration-200 hover:bg-blue-600 hover:shadow-md hover:shadow-blue-600/20 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                      >
                        Customize
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          /* Empty Search / Filter State */
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Search size={26} />
            </div>

            <h3 className="mt-4 text-xl font-bold text-slate-900">
              No matching templates found
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              No certificate templates matched &quot;{searchQuery}&quot;{" "}
              {selectedCategory !== "All Templates" && `in ${selectedCategory}`}.
              Try adjusting your search terms or filter.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={clearFilters}
                className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
              >
                Clear Filters
              </button>
              <Link
                to="/editor"
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Start Blank Certificate
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* --- BOTTOM CALL TO ACTION: START FROM SCRATCH --- */}
      <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8 sm:pb-20 lg:px-10">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-6 py-10 sm:px-10 sm:py-12 lg:px-14 shadow-xl">
          <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border-[35px] border-white/5" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />

          <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
                <WandSparkles size={16} />
                Create Something Unique
              </div>

              <h2 className="mt-2 text-2xl font-bold leading-tight text-white sm:text-3xl">
                Have your own custom certificate design in mind?
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
                Start with a blank canvas and build your certificate from scratch with full access to typography, shapes, graphics, and animations.
              </p>
            </div>

            <Link
              to="/editor"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 font-bold text-slate-900 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-50 hover:text-blue-700"
            >
              Start From Scratch
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
