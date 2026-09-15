import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-7rem)] flex items-center justify-center">
      <div className="text-center">

        <h1 className="text-7xl font-bold text-gray-900">
          404
        </h1>

        <h2 className="text-2xl font-semibold text-gray-800 mt-4">
          Page Not Found
        </h2>

        <p className="text-gray-500 mt-2">
          The page you are looking for does not exist.
        </p>

        <Link
          to="/"
          className="inline-block mt-6 bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition"
        >
          Go Home
        </Link>

      </div>
    </div>
  );
}