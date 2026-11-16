
import { useEffect } from "react";
import { getElements } from "./api/elementApi";

import { Routes, Route, useLocation } from "react-router-dom";

import Navbar from "./components/navbar/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Templates from "./pages/Templates";
import Editor from "./pages/Editor";
import SavedDesigns from "./pages/SavedDesigns";
import NotFound from "./pages/NotFound";

import { EditorProvider } from "./context/EditorContext";
import { FabricProvider } from "./context/FabricContext";

export default function App() {
  const location = useLocation();

  const isEditorPage =
    location.pathname === "/editor" ||
    location.pathname.startsWith("/editor/");

  useEffect(() => {
    getElements()
      .then((data) => {
        console.log("Elements from backend:", data);
      })
      .catch((error) => {
        console.error("Backend connection failed:", error);
      });
  }, []);

  return (
    <EditorProvider>
      <FabricProvider>
        <div className="min-h-screen bg-gray-100 flex flex-col">
          <Navbar />

          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />

              <Route path="/templates" element={<Templates />} />

              <Route path="/editor" element={<Editor />} />

              <Route path="/editor/:id" element={<Editor />} />

              <Route path="/saved-designs" element={<SavedDesigns />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>

          {!isEditorPage && <Footer />}
        </div>
      </FabricProvider>
    </EditorProvider>
  );
}
