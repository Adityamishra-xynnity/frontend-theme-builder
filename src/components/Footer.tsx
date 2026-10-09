
import { Link } from "react-router-dom";
import {
  Palette,
  ArrowRight,
  ArrowUp,
  Heart,
  LayoutTemplate,
  FolderHeart,
  House,
  Sparkles,
  Mail,
} from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const linkClass =
    "group flex w-fit items-center gap-2 text-sm text-slate-500 transition-all duration-200 hover:translate-x-1 hover:text-blue-700";

  return (
    <footer className="mt-12 border-t border-blue-100 bg-gradient-to-b from-sky-50 via-white to-blue-50">

      <div className="mx-auto max-w-7xl px-5 sm:px-8">

        {/* Main Footer */}
        <div className="grid grid-cols-1 gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12 lg:py-14">

          {/* Brand Section */}
          <div>
            <Link
              to="/"
              className="group inline-flex items-center gap-3"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-200 transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-blue-300">
                <Palette size={25} />
              </span>

              <span>
                <span className="block text-xl font-extrabold tracking-tight text-slate-900">
                  Theme Builder
                </span>

                <span className="mt-1 block text-xs font-medium tracking-wide text-blue-600">
                  CREATE YOUR OWN STYLE
                </span>
              </span>
            </Link>

            <p className="mt-5 max-w-xs text-sm leading-7 text-slate-500">
              Design beautiful certificates with creative templates and an
              easy-to-use editor. Bring your ideas to life in just a few clicks.
            </p>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-2 text-xs font-medium text-blue-700 shadow-sm">
              <Sparkles size={14} />
              Made for creative minds
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="mb-5 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-900">
              <LayoutTemplate size={17} className="text-blue-600" />
              Product
            </h3>

            <div className="flex flex-col items-start gap-4">
              <Link to="/templates" className={linkClass}>
                Explore Templates
                <ArrowRight
                  size={14}
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                />
              </Link>

              <Link to="/editor" className={linkClass}>
                Certificate Editor
              </Link>

              <Link to="/saved-designs" className={linkClass}>
                Saved Designs
              </Link>

              <Link to="/editor" className={linkClass}>
                Create Certificate
              </Link>
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h3 className="mb-5 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-900">
              <House size={17} className="text-blue-600" />
              Quick Links
            </h3>

            <div className="flex flex-col items-start gap-4">
              <Link to="/" className={linkClass}>
                Home
              </Link>

              <Link to="/templates" className={linkClass}>
                Certificate Templates
              </Link>

              <Link to="/saved-designs" className={linkClass}>
                My Designs
              </Link>

              <a href="mailto:hello@example.com" className={linkClass}>
                <Mail size={15} />
                Contact Us
              </a>
            </div>
          </div>

          {/* Blue CTA Card */}
          <div>
            <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-100">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Sparkles size={21} />
              </div>

              <h3 className="mt-4 text-lg font-bold text-slate-900">
                Ready to create?
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Start designing your next professional certificate today.
              </p>

              <Link
                to="/editor"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-blue-200 transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg active:scale-[0.98]"
              >
                Create Design
                <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </div>

        {/* Blue Highlight Strip */}
        <div className="h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent" />

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between gap-4 py-6 sm:flex-row">

          <p className="text-center text-xs leading-6 text-slate-500 sm:text-left sm:text-sm">
            © {currentYear} Theme Builder. All rights reserved.
          </p>

          <p className="flex items-center gap-1.5 text-xs text-slate-500 sm:text-sm">
            Designed with
            <Heart
              size={14}
              className="fill-rose-500 text-rose-500"
            />
            for creative people
          </p>

          <button
            type="button"
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              })
            }
            className="inline-flex items-center gap-2 rounded-lg border border-blue-100 bg-white px-3 py-2 text-xs font-semibold text-blue-700 shadow-sm transition-all hover:border-blue-300 hover:bg-blue-50 sm:text-sm"
          >
            Back to top
            <ArrowUp size={15} />
          </button>
        </div>
      </div>
    </footer>
  );
}

