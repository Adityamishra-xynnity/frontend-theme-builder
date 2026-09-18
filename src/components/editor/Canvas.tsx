import {
  ZoomIn,
  ZoomOut,
  Maximize,
} from "lucide-react";

import { useState } from "react";

import FabricCanvas from "./fabric/FabricCanvas";

export default function Canvas() {
  const [zoom, setZoom] = useState(100);

  function handleZoomIn() {
    setZoom((previous) =>
      Math.min(previous + 10, 150)
    );
  }

  function handleZoomOut() {
    setZoom((previous) =>
      Math.max(previous - 10, 50)
    );
  }

  function handleResetZoom() {
    setZoom(100);
  }

  return (
    <section className="flex-1 min-w-0 h-full bg-gray-100 relative overflow-hidden">

      {/* Canvas Workspace */}
      <div className="absolute inset-0 overflow-auto">

        <div className="min-h-full min-w-full flex items-center justify-center p-10">

          {/* Certificate Container */}
          <div
            className="relative shrink-0 transition-transform duration-200 ease-out"
            style={{
              transform: `scale(${zoom / 100})`,
            }}
          >
            <div className="bg-white shadow-2xl rounded-sm overflow-hidden">
              <FabricCanvas />
            </div>
          </div>

        </div>
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-5 right-5 z-30">

        <div className="flex items-center gap-1 bg-white border border-gray-200 shadow-lg rounded-xl p-1.5">

          {/* Zoom Out */}
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoom <= 50}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition disabled:opacity-30 disabled:cursor-not-allowed"
            title="Zoom out"
          >
            <ZoomOut size={17} />
          </button>

          {/* Zoom Percentage */}
          <button
            type="button"
            onClick={handleResetZoom}
            className="min-w-[58px] h-9 px-2 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 transition"
            title="Reset zoom"
          >
            {zoom}%
          </button>

          {/* Zoom In */}
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoom >= 150}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition disabled:opacity-30 disabled:cursor-not-allowed"
            title="Zoom in"
          >
            <ZoomIn size={17} />
          </button>

          {/* Reset */}
          <div className="w-px h-5 bg-gray-200 mx-1" />

          <button
            type="button"
            onClick={handleResetZoom}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition"
            title="Reset zoom"
          >
            <Maximize size={16} />
          </button>

        </div>
      </div>

      {/* Bottom Status */}
      <div className="absolute bottom-5 left-5 z-30 hidden md:block">

        <div className="px-3 py-2 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg shadow-sm">

          <p className="text-[11px] text-gray-500">
            Certificate Editor
          </p>

        </div>

      </div>

    </section>
  );
}