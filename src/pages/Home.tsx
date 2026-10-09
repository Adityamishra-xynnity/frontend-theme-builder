
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Award,
  Check,
  Download,
  FileText,
  FolderOpen,
  LayoutTemplate,
  MousePointer2,
  Palette,
  Shapes,
  Sparkles,
  Type,
} from "lucide-react";

const features = [
  {
    icon: Type,
    title: "Powerful text editor",
    description:
      "Add headings, subheadings and custom text. Personalize fonts, colors and text styles.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Shapes,
    title: "Creative elements",
    description:
      "Build your design with shapes and visual elements to match your certificate style.",
    color: "bg-violet-50 text-violet-600",
  },
  {
    icon: Palette,
    title: "Customize everything",
    description:
      "Make every design your own with flexible colors, typography and layout controls.",
    color: "bg-pink-50 text-pink-600",
  },
  {
    icon: LayoutTemplate,
    title: "Ready-made templates",
    description:
      "Start with a certificate template and customize it instead of designing from scratch.",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: FolderOpen,
    title: "Save your designs",
    description:
      "Keep your certificates organized and return to your saved work when you need it.",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: Download,
    title: "Export your certificate",
    description:
      "Download your finished design in supported formats from the certificate editor.",
    color: "bg-cyan-50 text-cyan-600",
  },
];

const steps = [
  {
    number: "01",
    title: "Choose a template",
    description:
      "Explore the available designs and pick a certificate that fits your purpose.",
    icon: LayoutTemplate,
  },
  {
    number: "02",
    title: "Make it yours",
    description:
      "Edit text, experiment with styles and arrange the elements the way you want.",
    icon: MousePointer2,
  },
  {
    number: "03",
    title: "Save and export",
    description:
      "Save your work and download your finished certificate using the available options.",
    icon: Download,
  },
];

export default function Home() {
  return (
    <main className="overflow-hidden bg-white text-slate-900">
      {/* Hero Section */}
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-violet-50">
        <div className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-violet-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-blue-200/40 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-2 lg:gap-12 lg:px-10 lg:py-24">
          <div className="max-w-2xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-4 py-2 text-sm font-medium text-indigo-700 shadow-sm">
              <Sparkles size={16} />
              <span>Your ideas, beautifully designed</span>
            </div>

            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Design certificates
              <span className="mt-2 block bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                your way.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
              Create beautiful, personalized certificates with an easy-to-use
              editor. Start with a template, customize every detail, and bring
              your design to life.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/editor"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-xl"
              >
                Start designing
                <ArrowRight
                  size={19}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>

              <Link
                to="/templates"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 font-semibold text-slate-700 transition-all duration-200 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
              >
                <LayoutTemplate size={19} />
                Explore templates
              </Link>
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-600">
              <span className="inline-flex items-center gap-2">
                <Check size={17} className="text-emerald-600" />
                Easy customization
              </span>
              <span className="inline-flex items-center gap-2">
                <Check size={17} className="text-emerald-600" />
                Creative freedom
              </span>
              <span className="inline-flex items-center gap-2">
                <Check size={17} className="text-emerald-600" />
                Simple workflow
              </span>
            </div>
          </div>

          {/* Certificate Preview */}
          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -left-5 top-10 hidden rounded-2xl border border-white/80 bg-white p-4 shadow-xl shadow-slate-200/70 sm:block">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Type size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Text styling
                  </p>
                  <p className="text-xs text-slate-500">Make it personal</p>
                </div>
              </div>
            </div>

            <div className="absolute -right-3 bottom-12 z-10 hidden rounded-2xl border border-white/80 bg-white p-4 shadow-xl shadow-slate-200/70 sm:block">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Award size={21} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Your design
                  </p>
                  <p className="text-xs text-slate-500">Ready to personalize</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/80 bg-white/70 p-3 shadow-2xl shadow-indigo-200/40 backdrop-blur-sm sm:p-5">
              <div className="mb-3 flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                    <FileText size={17} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Certificate Preview
                    </p>
                    <p className="text-xs text-slate-500">Design workspace</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  Preview
                </span>
              </div>

              <div className="rounded-xl bg-slate-100 p-3 sm:p-5">
                <div className="relative flex aspect-[1.414/1] flex-col items-center justify-center overflow-hidden border-[7px] border-double border-amber-500 bg-[#fffdf6] px-3 text-center sm:border-[10px] sm:px-8">
                  <div className="absolute inset-2 border border-amber-200 sm:inset-3" />

                  <div className="relative mb-3 flex h-11 w-11 items-center justify-center rounded-full border-2 border-amber-500 text-amber-600 sm:mb-4 sm:h-14 sm:w-14">
                    <Award size={29} strokeWidth={1.5} />
                  </div>

                  <p className="relative text-[8px] font-semibold uppercase tracking-[0.28em] text-amber-700 sm:text-xs sm:tracking-[0.4em]">
                    Certificate of
                  </p>

                  <h2 className="relative mt-1 font-serif text-xl font-bold tracking-wide text-slate-800 sm:mt-2 sm:text-3xl">
                    Achievement
                  </h2>

                  <div className="relative mt-2 h-px w-20 bg-amber-400 sm:mt-3 sm:w-28" />

                  <p className="relative mt-3 text-[8px] text-slate-500 sm:mt-5 sm:text-sm">
                    This certificate is proudly presented to
                  </p>

                  <p className="relative mt-1 font-serif text-lg italic text-indigo-800 sm:mt-2 sm:text-2xl">
                    Your Name Here
                  </p>

                  <p className="relative mt-2 max-w-xs text-[7px] leading-relaxed text-slate-600 sm:mt-3 sm:text-xs">
                    In recognition of dedication, effort and outstanding
                    achievement.
                  </p>

                  <div className="relative mt-4 flex w-full max-w-xs items-end justify-between gap-4 sm:mt-7">
                    <div className="w-20 border-t border-slate-400 pt-1 sm:w-28 sm:pt-2">
                      <p className="text-[7px] text-slate-500 sm:text-[10px]">
                        Date
                      </p>
                    </div>
                    <div className="w-20 border-t border-slate-400 pt-1 sm:w-28 sm:pt-2">
                      <p className="text-[7px] text-slate-500 sm:text-[10px]">
                        Signature
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between px-1 pb-1">
                <p className="text-xs text-slate-500">
                  A little creativity goes a long way.
                </p>
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                  <span className="h-2.5 w-2.5 rounded-full bg-violet-500" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                </div>
              </div>
            </div>

            <div className="absolute -bottom-5 left-1/3 -z-10 h-24 w-48 rounded-full bg-violet-300/40 blur-3xl" />
          </div>
        </div>
      </section>

      {/* Quick Benefits */}
      <section className="border-y border-slate-100 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-5 py-8 sm:px-8 md:grid-cols-4 lg:px-10">
          {[
            { title: "Easy to use", subtitle: "Simple editing tools" },
            { title: "Your style", subtitle: "Personalized designs" },
            { title: "Flexible", subtitle: "Make changes anytime" },
            { title: "All in one place", subtitle: "Design and manage" },
          ].map((item) => (
            <div key={item.title} className="text-center">
              <p className="text-sm font-bold text-slate-800 sm:text-base">
                {item.title}
              </p>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                {item.subtitle}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="scroll-mt-24 bg-slate-50/80">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-2 text-sm font-semibold text-indigo-700">
              <Sparkles size={16} />
              Made for your creativity
            </span>

            <h2 className="mt-5 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Everything you need to
              <span className="text-indigo-600"> design better</span>
            </h2>

            <p className="mt-4 leading-7 text-slate-600">
              From your first template to the finishing touches, create a
              certificate that feels uniquely yours.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="group rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/50 sm:p-7"
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${feature.color} transition-transform duration-300 group-hover:scale-110`}
                  >
                    <Icon size={23} />
                  </div>

                  <h3 className="mt-5 text-lg font-bold text-slate-900">
                    {feature.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {feature.description}
                  </p>

                  <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-indigo-600">
                    <span>Explore your options</span>
                    <ArrowRight
                      size={16}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="scroll-mt-24 bg-white"
      >
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-600">
              Simple process
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              From idea to certificate
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              A straightforward workflow that helps you focus on creating a
              great design.
            </p>
          </div>

          <div className="relative mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
            <div className="absolute left-[17%] right-[17%] top-8 hidden border-t-2 border-dashed border-indigo-100 md:block" />

            {steps.map((step) => {
              const Icon = step.icon;

              return (
                <div key={step.number} className="relative text-center">
                  <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 text-indigo-600 shadow-sm">
                    <Icon size={27} />
                    <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-indigo-600 text-xs font-bold text-white">
                      {step.number.slice(1)}
                    </span>
                  </div>

                  <p className="mt-6 text-xs font-bold tracking-[0.2em] text-indigo-600">
                    STEP {step.number}
                  </p>

                  <h3 className="mt-2 text-xl font-bold text-slate-900">
                    {step.title}
                  </h3>

                  <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-slate-600">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section
        id="templates"
        className="scroll-mt-24 px-5 pb-16 sm:px-8 sm:pb-20 lg:px-10 lg:pb-24"
      >
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-600 px-6 py-12 shadow-xl shadow-indigo-200/50 sm:px-12 sm:py-16 lg:px-16">
          <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border-[40px] border-white/10" />
          <div className="pointer-events-none absolute -bottom-32 right-1/3 h-64 w-64 rounded-full bg-violet-400/20 blur-3xl" />

          <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-medium text-indigo-50">
                <Sparkles size={16} />
                Your next design starts here
              </div>

              <h2 className="mt-5 text-3xl font-extrabold leading-tight text-white sm:text-4xl">
                Ready to create something special?
              </h2>

              <p className="mt-4 max-w-xl leading-7 text-indigo-100">
                Open the editor, choose your starting point and turn your
                certificate idea into a design you can call your own.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link
                to="/editor"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 font-bold text-indigo-700 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-50"
              >
                Open editor
                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>

              <Link
                to="/templates"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 font-semibold text-white transition-colors hover:bg-white/20"
              >
                <LayoutTemplate size={18} />
                Browse templates
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}