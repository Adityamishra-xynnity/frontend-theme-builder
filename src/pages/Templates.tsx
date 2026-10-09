
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Award,
  Check,
  Eye,
  LayoutTemplate,
  Palette,
  Sparkles,
  WandSparkles,
} from "lucide-react";

import { templates } from "../data/templates";

export default function Templates() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Page Header */}
      <section className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50">
        <div className="pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-indigo-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-violet-200/40 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm">
              <Sparkles size={16} />
              Certificate Collection
            </div>

            <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
              Find a template that
              <span className="mt-2 block bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                inspires your creativity.
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              Explore certificate designs, choose your favorite, and customize
              the details to create a certificate that is uniquely yours.
            </p>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-slate-600">
              <span className="inline-flex items-center gap-2">
                <Check size={17} className="text-emerald-600" />
                Editable designs
              </span>
              <span className="inline-flex items-center gap-2">
                <Check size={17} className="text-emerald-600" />
                Personalized colors
              </span>
              <span className="inline-flex items-center gap-2">
                <Check size={17} className="text-emerald-600" />
                Easy to customize
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Collection Toolbar */}
      <section className="mx-auto max-w-7xl px-5 pt-10 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
              Explore designs
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Choose your starting point
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Select a design to open it in the editor.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm">
            <LayoutTemplate size={17} className="text-indigo-600" />
            {templates.length} {templates.length === 1 ? "Template" : "Templates"}
          </div>
        </div>
      </section>

      {/* Template Cards */}
      <section className="mx-auto max-w-7xl px-5 pb-16 pt-7 sm:px-8 lg:px-10">
        {templates.length > 0 ? (
          <div className="grid grid-cols-1 gap-7 md:grid-cols-2 xl:gap-9">
            {templates.map((template) => {
              const heading = template.elements.find(
                (element) => element.type === "heading"
              );

              const mainColor =
                heading?.type === "heading"
                  ? heading.color
                  : "#374151";

              return (
                <article
                  key={template.id}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/40"
                >
                  {/* Preview Area */}
                  <div className="relative overflow-hidden bg-slate-100 p-4 sm:p-7">
                    <div
                      className="relative aspect-[900/650] w-full overflow-hidden rounded-lg shadow-lg"
                      style={{
                        backgroundColor: template.backgroundColor,
                      }}
                    >
                      {/* Certificate Borders */}
                      <div
                        className="pointer-events-none absolute inset-[3%] border-2"
                        style={{
                          borderColor: mainColor,
                        }}
                      />

                      <div
                        className="pointer-events-none absolute inset-[5%] border"
                        style={{
                          borderColor: `${mainColor}55`,
                        }}
                      />

                      {/* Actual Template Elements */}
                      {template.elements.map((element) => {
                        const left = (element.x / 900) * 100;
                        const top = (element.y / 650) * 100;
                        const width = (element.width / 900) * 100;
                        const height = (element.height / 650) * 100;

                        const baseStyle = {
                          position: "absolute" as const,
                          left: `${left}%`,
                          top: `${top}%`,
                          width: `${width}%`,
                          height: `${height}%`,
                        };

                        if (element.type === "rectangle") {
                          return (
                            <div
                              key={element.id}
                              style={{
                                ...baseStyle,
                                backgroundColor: element.backgroundColor,
                              }}
                            />
                          );
                        }

                        if (element.type === "circle") {
                          return (
                            <div
                              key={element.id}
                              style={{
                                ...baseStyle,
                                backgroundColor: element.backgroundColor,
                                borderRadius: "50%",
                              }}
                            />
                          );
                        }

                        if (element.type === "triangle") {
                          return (
                            <div
                              key={element.id}
                              style={{
                                ...baseStyle,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <div
                                style={{
                                  width: 0,
                                  height: 0,
                                  borderLeft: `${element.width / 2}px solid transparent`,
                                  borderRight: `${element.width / 2}px solid transparent`,
                                  borderBottom: `${element.height}px solid ${element.backgroundColor}`,
                                  transform: "scale(0.45)",
                                  transformOrigin: "center",
                                }}
                              />
                            </div>
                          );
                        }

                        return (
                          <div
                            key={element.id}
                            style={{
                              ...baseStyle,
                              fontSize: `${Math.max(
                                6,
                                ((element.fontSize ?? 18) / 900) * 900 * 0.55
                              )}px`,
                              fontFamily: element.fontFamily,
                              color: element.color,
                              fontWeight: element.fontWeight,
                              fontStyle:
                                "fontStyle" in element &&
                                element.fontStyle === "italic"
                                  ? "italic"
                                  : "normal",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              textAlign: "center",
                              lineHeight: "1.2",
                              padding: "2px",
                              overflow: "hidden",
                              overflowWrap: "anywhere",
                            }}
                          >
                            {element.text}
                          </div>
                        );
                      })}

                      {/* Hover Action */}
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-950/55 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100">
                        <Link
                          to={`/editor/${template.id}`}
                          className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900 shadow-xl transition-all duration-200 hover:scale-105 hover:bg-indigo-50 focus:outline-none focus:ring-4 focus:ring-white/50 sm:px-7 sm:text-base"
                        >
                          <Eye size={18} />
                          Use This Template
                          <ArrowRight size={17} />
                        </Link>
                      </div>

                      {/* Preview Label */}
                      <div className="absolute left-3 top-3 rounded-lg border border-white/70 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
                        Certificate Preview
                      </div>
                    </div>
                  </div>

                  {/* Template Details */}
                  <div className="p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="text-lg font-bold text-slate-900 transition-colors group-hover:text-indigo-700 sm:text-xl">
                          {template.name}
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          {template.description}
                        </p>
                      </div>

                      <div
                        className="mt-1 h-9 w-9 shrink-0 rounded-full border-4 border-white shadow-md ring-1 ring-slate-100"
                        style={{
                          backgroundColor: mainColor,
                        }}
                        title="Template accent color"
                      />
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                      <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
                        <Palette size={15} className="text-indigo-500" />
                        Customizable design
                      </div>

                      <Link
                        to={`/editor/${template.id}`}
                        className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                      >
                        Customize
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <LayoutTemplate size={27} />
            </div>

            <h3 className="mt-5 text-xl font-bold text-slate-900">
              No templates available yet
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              You can start with a blank certificate and create your own
              design in the editor.
            </p>

            <Link
              to="/editor"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              Open Blank Editor
              <ArrowRight size={18} />
            </Link>
          </div>
        )}
      </section>

      {/* Bottom CTA */}
      <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8 sm:pb-20 lg:px-10">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-indigo-900 px-6 py-10 sm:px-10 sm:py-12 lg:px-14">
          <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border-[35px] border-white/5" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl" />

          <div className="relative flex flex-col items-start justify-between gap-7 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-300">
                <WandSparkles size={17} />
                Create something unique
              </div>

              <h2 className="mt-3 text-2xl font-bold leading-tight text-white sm:text-3xl">
                Have your own design in mind?
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                Start with a blank certificate and build your design from
                scratch using the editor.
              </p>
            </div>

            <Link
              to="/editor"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 font-bold text-indigo-800 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-50"
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