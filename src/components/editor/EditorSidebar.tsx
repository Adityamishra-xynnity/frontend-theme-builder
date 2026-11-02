
import {
  Shapes,
  Type,
  CloudUpload,
  Sparkles,
  PanelsTopLeft,
  Code2,
  FileText,
} from "lucide-react";

interface EditorSidebarProps {
  onPanelChange: (panel: string) => void;
  activePanel: string;
}

export default function EditorSidebar({
  onPanelChange,
  activePanel,
}: EditorSidebarProps) {
  const sidebarItems = [
    {
      id: "templates",
      label: "Design",
      icon: PanelsTopLeft,
    },
    {
      id: "elements",
      label: "Elements",
      icon: Shapes,
    },
    {
      id: "text",
      label: "Text",
      icon: Type,
    },
    {
      id: "uploads",
      label: "Uploads",
      icon: CloudUpload,
    },
    {
      id: "tools",
      label: "Tools",
      icon: Sparkles,
    },
    {
      id: "html-import",
      label: "HTML Import",
      icon: Code2,
    },
    {
      id: "page-size",
      label: "Page Size",
      icon: FileText,
    },
  ];

  return (
    <aside className="relative z-30 flex h-full w-[76px] shrink-0 flex-col items-center gap-1 overflow-y-auto border-r border-gray-200 bg-gray-50/80 px-1.5 py-3">
      {sidebarItems.map((item) => {
        const Icon = item.icon;
        const isActive = activePanel === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onPanelChange(item.id)}
            aria-label={item.label}
            aria-pressed={isActive}
            title={item.label}
            className={`group relative flex min-h-[64px] w-full shrink-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 text-[11px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
              isActive
                ? "bg-violet-50 text-violet-700"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            {isActive && (
              <span className="absolute -left-1.5 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-blue-600" />
            )}

            <span
              className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-200 ${
                isActive
                  ? "bg-violet-600 text-white shadow-md shadow-violet-200"
                  : "text-gray-700 group-hover:bg-gray-100 group-hover:text-gray-900"
              }`}
            >
              <Icon
                size={24}
                strokeWidth={2.5}
                className="transition-transform duration-200 group-hover:scale-110"
              />
            </span>

            <span className="max-w-full truncate text-[11px] font-semibold tracking-tight">
              {item.label}
            </span>
          </button>
        );
      })}
    </aside>
  );
}
