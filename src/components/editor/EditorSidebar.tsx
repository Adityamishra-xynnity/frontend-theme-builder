
import {
  LayoutTemplate,
  Shapes,
  Type,
  Upload,
  Wrench,
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
      label: "Templates",
      icon: LayoutTemplate,
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
      icon: Upload,
    },
    {
      id: "tools",
      label: "Tools",
      icon: Wrench,
    },
  ];

  return (
    <aside className="relative z-20 flex h-full w-[76px] shrink-0 flex-col items-center gap-2 overflow-y-auto border-r border-slate-200 bg-white px-2 py-4">
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
            className={`group flex min-h-[68px] w-full shrink-0 flex-col items-center justify-center gap-2 rounded-xl px-1 py-2 text-[11px] font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              isActive
                ? "bg-blue-50 text-blue-700 shadow-sm"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                isActive
                  ? "bg-blue-100 text-blue-700"
                  : "bg-transparent text-slate-500 group-hover:bg-slate-100 group-hover:text-slate-800"
              }`}
            >
              <Icon size={21} strokeWidth={isActive ? 2.2 : 1.8} />
            </span>

            <span className="max-w-full truncate">
              {item.label}
            </span>
          </button>
        );
      })}
    </aside>
  );
}

