import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-white mt-16">

      <div className="max-w-7xl mx-auto px-6 py-14">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="lg:col-span-1">

            <Link
              to="/"
              className="flex items-center gap-2 text-white no-underline"
            >
              <span className="text-3xl">
                🎨
              </span>

              <span className="text-2xl font-bold">
                Theme Builder
              </span>
            </Link>

            <p className="text-gray-400 mt-4 leading-7">
              Create beautiful, professional certificates
              with an easy-to-use visual editor.
            </p>

            <div className="flex gap-3 mt-6">

              <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition cursor-pointer">
                f
              </div>

              <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition cursor-pointer">
                X
              </div>

              <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition cursor-pointer">
                in
              </div>

              <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition cursor-pointer">
                ◎
              </div>

            </div>

          </div>

          {/* Product */}
          <div>

            <h3 className="text-lg font-semibold mb-5">
              Product
            </h3>

            <div className="flex flex-col gap-3">

              <Link
                to="/templates"
                className="text-gray-400 hover:text-white transition"
              >
                Templates
              </Link>

              <Link
                to="/editor"
                className="text-gray-400 hover:text-white transition"
              >
                Certificate Editor
              </Link>

              <Link
                to="/saved-designs"
                className="text-gray-400 hover:text-white transition"
              >
                Saved Designs
              </Link>

              <Link
                to="/editor"
                className="text-gray-400 hover:text-white transition"
              >
                Create Certificate
              </Link>

            </div>

          </div>

          {/* Resources */}
          <div>

            <h3 className="text-lg font-semibold mb-5">
              Resources
            </h3>

            <div className="flex flex-col gap-3">

              <a
                href="#features"
                className="text-gray-400 hover:text-white transition"
              >
                Features
              </a>

              <a
                href="#how-it-works"
                className="text-gray-400 hover:text-white transition"
              >
                How It Works
              </a>

              <a
                href="#templates"
                className="text-gray-400 hover:text-white transition"
              >
                Certificate Templates
              </a>

              <Link
                to="/"
                className="text-gray-400 hover:text-white transition"
              >
                Home
              </Link>

            </div>

          </div>

          {/* Contact */}
          <div>

            <h3 className="text-lg font-semibold mb-5">
              Get Started
            </h3>

            <p className="text-gray-400 leading-6 mb-5">
              Start creating your professional certificate
              in just a few clicks.
            </p>

            <Link
              to="/editor"
              className="inline-flex items-center gap-2 bg-white text-gray-950 px-5 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
            >
              Create Design
              <span>→</span>
            </Link>

          </div>

        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 mt-12 pt-7 flex flex-col md:flex-row items-center justify-between gap-4">

          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Theme Builder. All rights reserved.
          </p>

          <div className="flex gap-6 text-sm">

            <span className="text-gray-500 hover:text-white cursor-pointer transition">
              Privacy
            </span>

            <span className="text-gray-500 hover:text-white cursor-pointer transition">
              Terms
            </span>

          </div>

        </div>

      </div>

    </footer>
  );
}