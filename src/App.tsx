
import { Routes, Route, useLocation } from "react-router-dom";

import Navbar from "./components/navbar/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Templates from "./pages/Templates";
import Editor from "./pages/Editor";
import SavedDesigns from "./pages/SavedDesigns";
import AdminPanel from "./pages/AdminPanel";
import EmailProjects from "./pages/EmailProjects";
import NotFound from "./pages/NotFound";

import { EditorProvider } from "./context/EditorContext";
import { FabricProvider } from "./context/FabricContext";
import EmailCampaign from "./email-campaign/EmailCampaign";
import AppDialogHost from "./components/common/AppDialogHost";

export default function App() {
  const location = useLocation();

  const isEditorPage =
    location.pathname === "/editor" ||
    location.pathname.startsWith("/editor/");

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
              <Route path="/email-projects" element={<EmailProjects />} />
              <Route path="/email-campaign" element={<EmailCampaign />} />
              <Route path="/email-campaign/:id" element={<EmailCampaign />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>

          {!isEditorPage && <Footer />}
          <AppDialogHost />
        </div>
      </FabricProvider>
    </EditorProvider>
  );
}
