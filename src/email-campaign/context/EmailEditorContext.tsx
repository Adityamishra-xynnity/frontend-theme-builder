import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type {
  EmailBounds,
  EmailCampaignResponse,
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

import {
  EMAIL_CANVAS_WIDTH,
  computeScaledSectionFromSnapshot,
  computeSymmetricHorizontalBounds,
  enforceSectionBounds,
  getNodeMinDimensions,
  getSectionMinDimensions,
  sanitizeNodeStylePatch,
} from "../utils/emailCompatibilityEngine";

export {
  EMAIL_CANVAS_WIDTH,
  computeScaledSectionFromSnapshot,
  computeSymmetricHorizontalBounds,
  enforceSectionBounds,
  getNodeMinDimensions,
  getSectionMinDimensions,
  sanitizeNodeStylePatch,
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
  addButtonElement: (template: EmailSectionTemplate) => void;
  addImage: (imageUrl: string) => void;

  loadTemplate: (template: EmailTemplateResponse) => void;
  loadCampaign: (campaign: EmailCampaignResponse) => void;
  resetToBlank: () => void;

  updateNodeContent: (
    sectionId: string,
    nodeId: string,
    content: string
  ) => void;

  updateNodeStyle: (
    sectionId: string,
    nodeId: string,
    patch: Partial<EmailNode>
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

  updateSectionStyle: (
    sectionId: string,
    patch: Partial<Pick<EmailSection, "backgroundColor" | "padding">>
  ) => void;

  duplicateSection: (sectionId: string) => void;

  replaceSection: (updatedSection: EmailSection) => void;

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

      return enforceSectionBounds({
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
      });
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
   * Load a saved EmailCampaign into the editor canvas without destructive regeneration.
   * Preserves IDs, positions, styles, Cloudinary image URLs, and button properties,
   * while safely defaulting missing optional fields on older saved campaigns.
   */
  const loadCampaign = useCallback((campaign: EmailCampaignResponse) => {
    if (!campaign) return;

    const sourceSections = Array.isArray(campaign.sectionsData)
      ? campaign.sectionsData
      : [];

    const restoredSections: EmailSection[] = sourceSections.map((sec, sIdx) =>
      enforceSectionBounds({
        ...sec,
        id: sec.id || crypto.randomUUID(),
        templateId: sec.templateId || `sec-${sIdx}`,
        category: sec.category || "custom",
        name: sec.name || `Section ${sIdx + 1}`,
        backgroundColor: sec.backgroundColor || "#ffffff",
        padding: sec.padding ?? "24px",
        x: typeof sec.x === "number" ? sec.x : 0,
        y: typeof sec.y === "number" ? sec.y : sIdx * 200,
        width: typeof sec.width === "number" ? sec.width : 600,
        height: typeof sec.height === "number" ? sec.height : 200,
        nodes: (Array.isArray(sec.nodes) ? sec.nodes : []).map((node, nIdx) => ({
          ...node,
          id: node.id || crypto.randomUUID(),
          type: node.type || "text",
          content: node.content ?? "",
          x: typeof node.x === "number" ? node.x : 24,
          y: typeof node.y === "number" ? node.y : 24 + nIdx * 48,
          width: typeof node.width === "number" ? node.width : 200,
          height: typeof node.height === "number" ? node.height : 40,
        })),
      })
    );

    setSections(restoredSections);
    setCurrentCampaignId(campaign.id);
    setCampaignName(campaign.name || "Untitled Campaign");
    setCampaignSubject(campaign.subject || campaign.name || "");
    setSelectedSectionId(restoredSections[0]?.id ?? null);
    setSelectedNodeId(null);
  }, []);

  /**
   * Reset the editor canvas safely to a blank state.
   */
  const resetToBlank = useCallback(() => {
    setSections([]);
    setSelectedSectionId(null);
    setSelectedNodeId(null);
    setCurrentCampaignId(null);
    setCampaignName("Untitled Campaign");
    setCampaignSubject("");
  }, []);

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

    setSections((current) => [...current, enforceSectionBounds(newSection)]);
    setSelectedSectionId(sectionId);
    setSelectedNodeId(null);
  };

  // Insert an independent Canva-style button element directly onto the canvas
  // without a visible container or 600px wrapper block.
  const addButtonElement = (template: EmailSectionTemplate) => {
    const sourceNode = template.nodes[0];
    if (!sourceNode) return;

    const sectionId = crypto.randomUUID();
    const nodeId = crypto.randomUUID();
    const btnWidth = typeof sourceNode.width === "number" ? sourceNode.width : 180;
    const btnHeight = typeof sourceNode.height === "number" ? sourceNode.height : 44;
    const defaultX =
      typeof sourceNode.x === "number"
        ? sourceNode.x
        : Math.round((600 - btnWidth) / 2);

    const nextY = sections.reduce(
      (acc, sec) => Math.max(acc, (sec.y || 0) + (sec.height || 0)),
      0
    );
    const defaultY = nextY === 0 ? 40 : nextY + 20;

    const newButtonSection: EmailSection = {
      id: sectionId,
      templateId: template.id,
      category: "button-element",
      name: template.name || "Button",
      backgroundColor: "transparent",
      padding: "0",
      x: defaultX,
      y: defaultY,
      width: btnWidth,
      height: btnHeight,
      nodes: [
        {
          ...sourceNode,
          id: nodeId,
          type: "button",
          content: sourceNode.content || "Button",
          fontSize: sourceNode.fontSize ?? 15,
          fontFamily: sourceNode.fontFamily,
          fontWeight: sourceNode.fontWeight || "bold",
          color: sourceNode.color || "#ffffff",
          backgroundColor: sourceNode.backgroundColor || "#6d28d9",
          gradient: sourceNode.gradient,
          borderColor: sourceNode.borderColor,
          borderWidth: sourceNode.borderWidth,
          borderRadius: sourceNode.borderRadius ?? 6,
          padding: sourceNode.padding || "10px 20px",
          url: sourceNode.url,
          linkUrl: sourceNode.linkUrl || sourceNode.url,
          x: 0,
          y: 0,
          width: btnWidth,
          height: btnHeight,
        },
      ],
    };

    setSections((current) => [...current, enforceSectionBounds(newButtonSection)]);
    setSelectedSectionId(sectionId);
    setSelectedNodeId(nodeId);
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

    setSections((current) => [...current, enforceSectionBounds(newSection)]);
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

  // Update styling, dimensions, or properties on an individual element
  const updateNodeStyle = (
    sectionId: string,
    nodeId: string,
    patch: Partial<EmailNode>
  ) => {
    const safePatch = sanitizeNodeStylePatch(patch);
    setSections((current) =>
      current.map((section) => {
        if (section.id !== sectionId) return section;
        const isStandalone =
          section.backgroundColor === "transparent" &&
          section.nodes.length === 1 &&
          section.nodes[0].id === nodeId;

        return enforceSectionBounds({
          ...section,
          width: isStandalone && typeof safePatch.width === "number" ? safePatch.width : section.width,
          height: isStandalone && typeof safePatch.height === "number" ? safePatch.height : section.height,
          nodes: section.nodes.map((node) =>
            node.id === nodeId ? { ...node, ...safePatch } : node
          ),
        });
      })
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

    // If standalone button element, clone as an independent button on the canvas
    const isStandalone =
      targetSection.backgroundColor === "transparent" &&
      targetSection.nodes.length === 1 &&
      targetNode.type === "button";

    if (isStandalone) {
      const freshSectionId = crypto.randomUUID();
      const freshNodeId = crypto.randomUUID();
      const nextX = Math.min(Math.max(0, 600 - targetSection.width), targetSection.x + 16);
      const nextY = targetSection.y + 16;

      const clonedSection: EmailSection = {
        ...targetSection,
        id: freshSectionId,
        x: nextX,
        y: nextY,
        nodes: [
          {
            ...targetNode,
            id: freshNodeId,
            x: 0,
            y: 0,
          },
        ],
      };

      setSections((current) => [...current, clonedSection]);
      setSelectedSectionId(freshSectionId);
      setSelectedNodeId(freshNodeId);
      return;
    }

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
          ? enforceSectionBounds({ ...section, ...bounds })
          : section
      )
    );
  };

  // Update backgroundColor or padding on a non-standalone section
  const updateSectionStyle = (
    sectionId: string,
    patch: Partial<Pick<EmailSection, "backgroundColor" | "padding">>
  ) => {
    setSections((current) =>
      current.map((section) => {
        if (section.id !== sectionId) return section;
        const isStandaloneButton =
          section.backgroundColor === "transparent" &&
          section.nodes.length === 1 &&
          section.nodes[0].type === "button";
        if (isStandaloneButton) return section;
        return { ...section, ...patch };
      })
    );
  };

  // Duplicate an entire section and all its child nodes
  const duplicateSection = (sectionId: string) => {
    const target = sections.find((s) => s.id === sectionId);
    if (!target) return;

    const freshSectionId = crypto.randomUUID();
    const cloned: EmailSection = {
      ...target,
      id: freshSectionId,
      y: (target.y || 0) + (target.height || 100) + 16,
      nodes: target.nodes.map((node) => ({
        ...node,
        id: crypto.randomUUID(),
      })),
    };

    setSections((current) => [...current, cloned]);
    setSelectedSectionId(freshSectionId);
    setSelectedNodeId(null);
  };

  // Atomically replace a section and all its child nodes (e.g. during live/final section resize)
  const replaceSection = (updatedSection: EmailSection) => {
    const normalized = enforceSectionBounds(updatedSection);
    setSections((current) =>
      current.map((section) =>
        section.id === normalized.id ? normalized : section
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
          ? enforceSectionBounds({
              ...section,
              nodes: section.nodes.map((node) =>
                node.id === nodeId
                  ? { ...node, ...bounds }
                  : node
              ),
            })
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

  // Remove an individual element (and its wrapper if it was a standalone button)
  const removeNode = (sectionId: string, nodeId: string) => {
    setSections((current) =>
      current
        .map((section) => {
          if (section.id !== sectionId) return section;
          const remaining = section.nodes.filter((node) => node.id !== nodeId);
          if (section.backgroundColor === "transparent" && remaining.length === 0) {
            return null;
          }
          return {
            ...section,
            nodes: remaining,
          };
        })
        .filter((s): s is EmailSection => s !== null)
    );

    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
      if (selectedSectionId === sectionId) {
        setSelectedSectionId(null);
      }
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
        loadCampaign,
        resetToBlank,
        addSection,
        addButtonElement,
        addImage,
        updateNodeContent,
        updateNodeStyle,
        updateNodeLink,
        duplicateNode,
        updateSectionBounds,
        updateSectionStyle,
        duplicateSection,
        replaceSection,
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
