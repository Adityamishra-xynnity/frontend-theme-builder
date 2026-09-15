import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-7 sticky top-0 z-50">

      {/* Logo */}
      <Link
        to="/"
        className="flex items-center gap-2 no-underline"
      >
        <span className="text-2xl">
          🎨
        </span>

        <span className="text-xl font-bold text-gray-900">
          Theme Builder
        </span>
      </Link>

      {/* Navigation */}
      <div className="flex items-center gap-7">

        <Link
          to="/templates"
          className="text-gray-700 font-medium hover:text-black transition"
        >
          Templates
        </Link>

        <Link
          to="/saved-designs"
          className="text-gray-700 font-medium hover:text-black transition"
        >
          Saved Designs
        </Link>

        <Link
          to="/editor"
          className="bg-black text-white px-5 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition"
        >
          Create Design
        </Link>

      </div>

    </nav>
  );
}