
import { useState } from "react";
import {
  Link,
  NavLink,
  useNavigate,
} from "react-router-dom";

import {
  Palette,
  LayoutTemplate,
  FolderHeart,
  Plus,
  Menu,
  X,
  ChevronDown,
  FilePlus2,
  Sparkles,
} from "lucide-react";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);

  const navigate = useNavigate();

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
      isActive
        ? "bg-violet-100 text-violet-700"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-950"
    }`;

  const closeMenus = () => {
    setMobileMenuOpen(false);
    setCreateMenuOpen(false);
  };

  const openEditor = () => {
    closeMenus();
    navigate("/editor");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/95 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link
          to="/"
          onClick={closeMenus}
          className="group flex shrink-0 items-center gap-3"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-200 transition-transform duration-200 group-hover:scale-105">
            <Palette size={23} strokeWidth={2.2} />
          </div>

          <div className="hidden sm:block">
            <span className="block text-lg font-extrabold tracking-tight text-gray-900">
              Theme Builder
            </span>
            <span className="block text-[11px] font-medium tracking-wide text-gray-500">
              DESIGN YOUR IDEAS
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-1 md:flex">
          <NavLink to="/" end className={navLinkClass}>
            <Sparkles size={17} />
            Home
          </NavLink>

          <NavLink to="/templates" className={navLinkClass}>
            <LayoutTemplate size={17} />
            Templates
          </NavLink>

          <NavLink to="/saved-designs" className={navLinkClass}>
            <FolderHeart size={17} />
            Saved Designs
          </NavLink>
        </div>

        {/* Desktop Create Button */}
        <div className="relative hidden md:block">
          <button
            type="button"
            onClick={() => setCreateMenuOpen((open) => !open)}
            aria-expanded={createMenuOpen}
            aria-haspopup="menu"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-violet-200 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-200 active:translate-y-0"
          >
            <Plus size={18} strokeWidth={2.5} />
            Create Design
            <ChevronDown
              size={16}
              className={`transition-transform duration-200 ${
                createMenuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {createMenuOpen && (
            <>
              <button
                type="button"
                aria-label="Close create menu"
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setCreateMenuOpen(false)}
              />

              <div
                role="menu"
                className="absolute right-0 top-full z-50 mt-3 w-64 overflow-hidden rounded-2xl border border-gray-100 bg-white p-2 shadow-xl shadow-gray-200/70"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={openEditor}
                  className="flex w-full items-start gap-3 rounded-xl p-3 text-left transition-colors hover:bg-violet-50"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                    <FilePlus2 size={20} />
                  </span>

                  <span>
                    <span className="block text-sm font-bold text-gray-900">
                      Blank Certificate
                    </span>
                    <span className="mt-1 block text-xs text-gray-500">
                      Start with a fresh design
                    </span>
                  </span>
                </button>

                <Link
                  to="/templates"
                  onClick={closeMenus}
                  role="menuitem"
                  className="flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-violet-50"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                    <LayoutTemplate size={20} />
                  </span>

                  <span>
                    <span className="block text-sm font-bold text-gray-900">
                      Use a Template
                    </span>
                    <span className="mt-1 block text-xs text-gray-500">
                      Choose a ready-made design
                    </span>
                  </span>
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          type="button"
          aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 text-gray-700 transition-colors hover:bg-gray-100 md:hidden"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="border-t border-gray-100 bg-white px-4 pb-5 pt-3 shadow-lg md:hidden">
          <div className="mx-auto flex max-w-[1600px] flex-col gap-1">
            <NavLink
              to="/"
              end
              onClick={closeMenus}
              className={navLinkClass}
            >
              <Sparkles size={18} />
              Home
            </NavLink>

            <NavLink
              to="/templates"
              onClick={closeMenus}
              className={navLinkClass}
            >
              <LayoutTemplate size={18} />
              Templates
            </NavLink>

            <NavLink
              to="/saved-designs"
              onClick={closeMenus}
              className={navLinkClass}
            >
              <FolderHeart size={18} />
              Saved Designs
            </NavLink>

            <button
              type="button"
              onClick={openEditor}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3.5 text-sm font-bold text-white shadow-md shadow-violet-200 transition-all hover:shadow-lg"
            >
              <Plus size={19} />
              Create Design
            </button>

            <Link
              to="/templates"
              onClick={closeMenus}
              className="mt-1 flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              <LayoutTemplate size={18} />
              Explore Templates
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

