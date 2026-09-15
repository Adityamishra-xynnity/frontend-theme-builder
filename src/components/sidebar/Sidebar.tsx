
import { Link, useLocation } from "react-router-dom";

export default function Sidebar() {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <aside className="w-64 min-h-[calc(100vh-4rem)] bg-white border-r border-gray-200 p-4 sticky top-16">

      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Workspace
        </h2>
      </div>

      <div className="space-y-2">

        <Link
          to="/"
          className={`block px-4 py-3 rounded-lg text-sm font-medium transition ${
            isActive("/")
              ? "bg-black text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          🏠 Home
        </Link>

        <Link
          to="/templates"
          className={`block px-4 py-3 rounded-lg text-sm font-medium transition ${
            isActive("/templates")
              ? "bg-black text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          📄 Templates
        </Link>

        <Link
          to="/saved"
          className={`block px-4 py-3 rounded-lg text-sm font-medium transition ${
            isActive("/saved")
              ? "bg-black text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          💾 Saved Designs
        </Link>

      </div>

      <div className="mt-8">

        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Elements
        </h2>

        <div className="space-y-2">

          <button className="w-full text-left px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 text-sm">
            T&nbsp;&nbsp; Heading
          </button>

          <button className="w-full text-left px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 text-sm">
            T&nbsp;&nbsp; Subheading
          </button>

          <button className="w-full text-left px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 text-sm">
            T&nbsp;&nbsp; Text
          </button>

        </div>

      </div>

      <div className="mt-8">

        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Shapes
        </h2>

        <div className="grid grid-cols-2 gap-2">

          <button className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm">
            ▭
            <span className="block mt-1">Rectangle</span>
          </button>

          <button className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm">
            ○
            <span className="block mt-1">Circle</span>
          </button>

          <button className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm">
            △
            <span className="block mt-1">Triangle</span>
          </button>

          <button className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm">
            ━
            <span className="block mt-1">Line</span>
          </button>

        </div>

      </div>

    </aside>
  );
}

