import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type {
  EmailBounds,
  EmailNode,
  EmailNodeType,
  EmailSection,
  EmailSectionTemplate,
  EmailTemplateResponse,
} from "../types/campaign";

// Re-export types for backward compatibility across existing components
export type {
  EmailBounds,
  EmailNode,
  EmailNodeType,
  EmailSection,
  EmailSectionTemplate,
};

export interface EmailEditorContextType {
  sections: EmailSection[];
  setSections: React.Dispatch<React.SetStateAction<EmailSection[]>>;
  selectedSectionId: string | null;
  selectedNodeId: string | null;

  campaignName: string;
  setCampaignName: (name: string) => void;
  campaignSubject: string;
  setCampaignSubject: (subject: string) => void;
  currentCampaignId: number | null;
  setCurrentCampaignId: (id: number | null) => void;

  addSection: (template: EmailSectionTemplate) => void;
  addImage: (imageUrl: string) => void;

  loadTemplate: (template: EmailTemplateResponse) => void;
  resetToBlank: () => void;

  updateNodeContent: (
    sectionId: string,
    nodeId: string,
    content: string
  ) => void;

  updateNodeLink: (
    sectionId: string,
    nodeId: string,
    url: string | undefined
  ) => void;

  duplicateNode: (sectionId: string, nodeId: string) => void;

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
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Campaign metadata
  const [campaignName, setCampaignName] = useState<string>("Untitled Campaign");
  const [campaignSubject, setCampaignSubject] = useState<string>("");
  const [currentCampaignId, setCurrentCampaignId] = useState<number | null>(null);

  /**
   * Load an email template into the editor canvas:
   * - Deep clones all sections and nodes.
   * - Regenerates fresh unique UUIDs for every section and node.
   * - Preserves coordinates, dimensions, typography, styles, and background colors.
   * - Sets template name as campaign name/subject.
   * - Clears currentCampaignId to prevent overwriting unrelated saved campaigns.
   */
  const loadTemplate = (template: EmailTemplateResponse) => {
    if (!template) return;

    const sourceSections = Array.isArray(template.sectionsData)
      ? template.sectionsData
      : [];

    const clonedSections: EmailSection[] = sourceSections.map((sec, sIdx) => {
      const freshSectionId = crypto.randomUUID();
      const clonedNodes: EmailNode[] = (sec.nodes || []).map((node, nIdx) => ({
        ...node,
        id: crypto.randomUUID(),
        type: node.type || "text",
        content: node.content ?? "",
        fontSize: node.fontSize ?? (node.type === "heading" ? 24 : 14),
        url: node.url,
        linkUrl: node.linkUrl || node.url,
        textAlign: node.textAlign,
        tagName: node.tagName,
        backgroundColor: node.backgroundColor,
        color: node.color,
        x: typeof node.x === "number" ? node.x : 24,
        y: typeof node.y === "number" ? node.y : 24 + nIdx * 50,
        width: typeof node.width === "number" ? node.width : 552,
        height: typeof node.height === "number" ? node.height : 40,
      }));

      return {
        ...sec,
        id: freshSectionId,
        templateId: sec.templateId || `sec-template-${sIdx}`,
        category: sec.category || "custom",
        name: sec.name || `Section ${sIdx + 1}`,
        backgroundColor: sec.backgroundColor || "#ffffff",
        padding: sec.padding || "24px",
        x: typeof sec.x === "number" ? sec.x : 0,
        y: typeof sec.y === "number" ? sec.y : sIdx * 240,
        width: typeof sec.width === "number" ? sec.width : 600,
        height: typeof sec.height === "number" ? sec.height : 240,
        nodes: clonedNodes,
      };
    });

    setSections(clonedSections);
    setSelectedSectionId(clonedSections[0]?.id ?? null);
    setSelectedNodeId(null);

    // Reset campaign ID so new design doesn't overwrite any existing campaign
    setCurrentCampaignId(null);
    setCampaignName(template.name || "Untitled Campaign");
    setCampaignSubject(template.name || "New Email Campaign");
  };

  /**
   * Reset the editor canvas safely to a blank state.
   */
  const resetToBlank = () => {
    setSections([]);
    setSelectedSectionId(null);
    setSelectedNodeId(null);
    setCurrentCampaignId(null);
    setCampaignName("Untitled Campaign");
    setCampaignSubject("");
  };

  // Add a complete section with initial positions and dimensions
  const addSection = (template: EmailSectionTemplate) => {
    const sectionId = crypto.randomUUID();
    const sectionHeight = template.height ?? 240;

    // Place section immediately below the lowest existing section
    const nextY = sections.reduce(
      (acc, sec) => Math.max(acc, (sec.y || 0) + (sec.height || 200)),
      0
    );

    const newSection: EmailSection = {
      id: sectionId,
      templateId: template.id,
      category: template.category,
      name: template.name,
      backgroundColor: template.backgroundColor,
      padding: template.padding,

      x: 0,
      y: nextY,
      width: 600,
      height: sectionHeight,

      nodes: template.nodes.map((node, index) => ({
        ...node,
        id: crypto.randomUUID(),
        type: node.type,
        content: node.content,
        color: node.color,
        backgroundColor: node.backgroundColor,
        borderRadius: node.borderRadius,
        url: node.url,
        linkUrl: node.linkUrl || node.url,
        textAlign: node.textAlign,
        tagName: node.tagName,

        fontSize:
          node.fontSize ??
          (node.type === "heading"
            ? 24
            : node.type === "logo"
              ? 20
              : node.type === "button"
                ? 14
                : 14),

        x: typeof node.x === "number" ? node.x : 24,
        y: typeof node.y === "number" ? node.y : 24 + index * 52,
        width: typeof node.width === "number" ? node.width : 552,
        height: typeof node.height === "number" ? node.height : 44,
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

  // Update or remove hyperlink on an individual element
  const updateNodeLink = (
    sectionId: string,
    nodeId: string,
    url: string | undefined
  ) => {
    const cleanUrl = url && url.trim() ? url.trim() : undefined;

    setSections((current) =>
      current.map((section) =>
        section.id === sectionId
          ? {
            ...section,
            nodes: section.nodes.map((node) =>
              node.id === nodeId
                ? {
                  ...node,
                  linkUrl: cleanUrl,
                  url: cleanUrl,
                }
                : node
            ),
          }
          : section
      )
    );
  };

  // Duplicate an individual element with a slight offset
  const duplicateNode = (sectionId: string, nodeId: string) => {
    const targetSection = sections.find((s) => s.id === sectionId);
    if (!targetSection) return;

    const targetNode = targetSection.nodes.find((n) => n.id === nodeId);
    if (!targetNode) return;

    const freshNodeId = crypto.randomUUID();
    const clonedNode: EmailNode = {
      ...targetNode,
      id: freshNodeId,
      x: Math.min(Math.max(0, targetSection.width - targetNode.width), targetNode.x + 16),
      y: Math.min(Math.max(0, targetSection.height - targetNode.height), targetNode.y + 16),
    };

    setSections((current) =>
      current.map((section) =>
        section.id === sectionId
          ? {
            ...section,
            nodes: [...section.nodes, clonedNode],
          }
          : section
      )
    );

    setSelectedNodeId(freshNodeId);
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
        setSections,
        selectedSectionId,
        selectedNodeId,
        campaignName,
        setCampaignName,
        campaignSubject,
        setCampaignSubject,
        currentCampaignId,
        setCurrentCampaignId,
        loadTemplate,
        resetToBlank,
        addSection,
        addImage,
        updateNodeContent,
        updateNodeLink,
        duplicateNode,
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
