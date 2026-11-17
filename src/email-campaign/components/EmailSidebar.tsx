
import {
  LayoutTemplate,
  Shapes,
  Image,
  FolderOpen,
} from "lucide-react";

export type EmailPanelType =
  | "templates"
  | "elements"
  | "uploads"
  | "projects";

interface EmailSidebarProps {
  activePanel: EmailPanelType | null ;
  onPanelChange: (panel: EmailPanelType) => void;
}

export default function EmailSidebar({
  activePanel,
  onPanelChange,
}: EmailSidebarProps) {
  const menuItems = [
    {
      id: "templates" as const,
      label: "Templates",
      icon: LayoutTemplate,
    },
    {
      id: "elements" as const,
      label: "Elements",
      icon: Shapes,
    },
    {
      id: "uploads" as const,
      label: "Uploads",
      icon: Image,
    },
    {
      id: "projects" as const,
      label: "Projects",
      icon: FolderOpen,
    },
  ];

  return (
    <aside className="flex h-full w-24 flex-col items-center border-r border-gray-200 bg-white py-5">
      <div className="flex w-full flex-col gap-3 px-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePanel === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onPanelChange(item.id)}
              className={`flex flex-col items-center gap-2 rounded-xl px-2 py-3 text-xs font-semibold transition-colors ${
                isActive
                  ? "bg-violet-100 text-violet-700"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Icon size={23} strokeWidth={1.8} />
              {item.label}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
