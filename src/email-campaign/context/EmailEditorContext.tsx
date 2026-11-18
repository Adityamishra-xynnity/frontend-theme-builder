
import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

export type EmailNodeType =
  | "logo"
  | "heading"
  | "text"
  | "button"
  | "image"
  | "link"
  | "container";

// Position and size of an object on the canvas
export interface EmailBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Individual editable elements
export interface EmailNode extends EmailBounds {
  id: string;
  type: EmailNodeType;
  content: string;
  fontSize?: number;
  url?: string;
  tagName?: "div" | "section";
  backgroundColor?: string;
}

// Complete section on the canvas
export interface EmailSection extends EmailBounds {
  id: string;
  templateId: string;
  category: string;
  name: string;
  backgroundColor: string;
  padding: string;
  nodes: EmailNode[];
}

// Ready-made section template
export interface EmailSectionTemplate {
  id: string;
  category: string;
  name: string;
  backgroundColor: string;
  padding: string;
  nodes: Omit<EmailNode, "id" | "x" | "y" | "width" | "height">[];
}

interface EmailEditorContextType {
  sections: EmailSection[];
  selectedSectionId: string | null;
  selectedNodeId: string | null;

  addSection: (template: EmailSectionTemplate) => void;
  addImage: (imageUrl: string) => void;

  updateNodeContent: (
    sectionId: string,
    nodeId: string,
    content: string
  ) => void;

  updateSectionBounds: (
    sectionId: string,
    bounds: Partial<EmailBounds>
  ) => void;

  updateNodeBounds: (
    sectionId: string,
    nodeId: string,
    bounds: Partial<EmailBounds & Pick<EmailNode, "fontSize">>
  ) => void;

  selectSection: (sectionId: string | null) => void;

  selectNode: (
    sectionId: string,
    nodeId: string | null
  ) => void;

  removeNode: (sectionId: string, nodeId: string) => void;
  removeSection: (sectionId: string) => void;
}

const EmailEditorContext =
  createContext<EmailEditorContextType | undefined>(undefined);

export function EmailEditorProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [sections, setSections] = useState<EmailSection[]>([]);

  const [selectedSectionId, setSelectedSectionId] =
    useState<string | null>(null);

  const [selectedNodeId, setSelectedNodeId] =
    useState<string | null>(null);

  // Add a complete section with initial positions and dimensions
  const addSection = (template: EmailSectionTemplate) => {
    const sectionId = crypto.randomUUID();

    const newSection: EmailSection = {
      id: sectionId,
      templateId: template.id,
      category: template.category,
      name: template.name,
      backgroundColor: template.backgroundColor,
      padding: template.padding,

      x: 0,
      y: sections.length * 280,
      width: 600,
      height: 260,

      nodes: template.nodes.map((node, index) => ({
        ...node,
        id: crypto.randomUUID(),

        fontSize:
          node.fontSize ??
          (node.type === "heading"
            ? 24
            : node.type === "logo"
              ? 20
              : node.type === "button"
                ? 14
                : 14),

        x: 24,
        y: 24 + index * 52,
        width: 552,
        height: 44,
      })),
    };

    setSections((current) => [...current, newSection]);
    setSelectedSectionId(sectionId);
    setSelectedNodeId(null);
  };

  // Add an uploaded image to the email canvas
  const addImage = (imageUrl: string) => {
    const sectionId = crypto.randomUUID();
    const nodeId = crypto.randomUUID();

    const newSection: EmailSection = {
      id: sectionId,
      templateId: "uploaded-image",
      category: "images",
      name: "Uploaded Image",
      backgroundColor: "#FFFFFF",
      padding: "24px",
      x: 0,
      y: sections.length * 280,
      width: 600,
      height: 260,
      nodes: [
        {
          id: nodeId,
          type: "image",
          content: imageUrl,
          x: 24,
          y: 24,
          width: 552,
          height: 212,
        },
      ],
    };

    setSections((current) => [...current, newSection]);
    setSelectedSectionId(sectionId);
    setSelectedNodeId(nodeId);
  };

  // Update text or other element content
  const updateNodeContent = (
    sectionId: string,
    nodeId: string,
    content: string
  ) => {
    setSections((current) =>
      current.map((section) =>
        section.id === sectionId
          ? {
            ...section,
            nodes: section.nodes.map((node) =>
              node.id === nodeId
                ? { ...node, content }
                : node
            ),
          }
          : section
      )
    );
  };

  // Resize or move an entire section
  const updateSectionBounds = (
    sectionId: string,
    bounds: Partial<EmailBounds>
  ) => {
    setSections((current) =>
      current.map((section) =>
        section.id === sectionId
          ? { ...section, ...bounds }
          : section
      )
    );
  };

  // Resize or move an individual element
  const updateNodeBounds = (
    sectionId: string,
    nodeId: string,
    bounds: Partial<EmailBounds & Pick<EmailNode, "fontSize">>
  ) => {
    setSections((current) =>
      current.map((section) =>
        section.id === sectionId
          ? {
            ...section,
            nodes: section.nodes.map((node) =>
              node.id === nodeId
                ? { ...node, ...bounds }
                : node
            ),
          }
          : section
      )
    );
  };

  // Select a complete section
  const selectSection = (sectionId: string | null) => {
    setSelectedSectionId(sectionId);
    setSelectedNodeId(null);
  };

  // Select an individual element
  const selectNode = (
    sectionId: string,
    nodeId: string | null
  ) => {
    setSelectedSectionId(sectionId);
    setSelectedNodeId(nodeId);
  };

  // Remove an individual element
  const removeNode = (sectionId: string, nodeId: string) => {
    setSections((current) =>
      current.map((section) =>
        section.id === sectionId
          ? {
            ...section,
            nodes: section.nodes.filter(
              (node) => node.id !== nodeId
            ),
          }
          : section
      )
    );

    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  };

  // Remove a complete section
  const removeSection = (sectionId: string) => {
    setSections((current) =>
      current.filter((section) => section.id !== sectionId)
    );

    if (selectedSectionId === sectionId) {
      setSelectedSectionId(null);
      setSelectedNodeId(null);
    }
  };

  return (
    <EmailEditorContext.Provider
      value={{
        sections,
        selectedSectionId,
        selectedNodeId,
        addSection,
        addImage,
        updateNodeContent,
        updateSectionBounds,
        updateNodeBounds,
        selectSection,
        selectNode,
        removeNode,
        removeSection,
      }}
    >
      {children}
    </EmailEditorContext.Provider>
  );
}

export function useEmailEditor() {
  const context = useContext(EmailEditorContext);

  if (!context) {
    throw new Error(
      "useEmailEditor must be used inside EmailEditorProvider"
    );
  }

  return context;
}
