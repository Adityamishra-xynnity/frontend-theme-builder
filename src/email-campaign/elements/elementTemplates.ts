import type { EmailSectionTemplate } from "../context/EmailEditorContext";

export const elementTemplates: EmailSectionTemplate[] = [
  {
    id: "empty-div",
    category: "elements",
    name: "Empty Div",
    backgroundColor: "#FFFFFF",
    padding: "0",
    nodes: [
      {
        type: "container",
        content: "",
        tagName: "div",
        backgroundColor: "#F3F4F6",
      },
    ],
  },
];