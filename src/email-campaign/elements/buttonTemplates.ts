import type { EmailSectionTemplate } from "../context/EmailEditorContext";

export const buttonTemplates: EmailSectionTemplate[] = [
  {
    id: "button-shop",
    category: "buttons",
    name: "Shop Now",
    backgroundColor: "#FFFFFF",
    padding: "24px",
    nodes: [
      {
        type: "button",
        content: "Shop Now",
        fontSize: 16,
      },
    ],
  },
  {
    id: "button-learn",
    category: "buttons",
    name: "Learn More",
    backgroundColor: "#F9FAFB",
    padding: "24px",
    nodes: [
      {
        type: "button",
        content: "Learn More",
        fontSize: 16,
      },
    ],
  },
  {
    id: "button-start",
    category: "buttons",
    name: "Get Started",
    backgroundColor: "#FFFFFF",
    padding: "24px",
    nodes: [
      {
        type: "button",
        content: "Get Started",
        fontSize: 16,
      },
    ],
  },
  {
    id: "button-contact",
    category: "buttons",
    name: "Contact Us",
    backgroundColor: "#F3F0FF",
    padding: "24px",
    nodes: [
      {
        type: "button",
        content: "Contact Us",
        fontSize: 16,
      },
    ],
  },
];