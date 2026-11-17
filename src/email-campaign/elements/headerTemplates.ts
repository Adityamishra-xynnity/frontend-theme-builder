import type { EmailSectionTemplate } from "../context/EmailEditorContext";

export const headerTemplates: EmailSectionTemplate[] = [
  {
    id: "header-minimal",
    category: "header",
    name: "Minimal Brand",
    backgroundColor: "#FFFFFF",
    padding: "32px",
    nodes: [
      {
        type: "logo",
        content: "NOVA",
      },
      {
        type: "heading",
        content: "A little something for you",
      },
      {
        type: "text",
        content: "Discover what's new in our collection.",
      },
      {
        type: "button",
        content: "Explore now",
      },
    ],
  },
  {
    id: "header-bold",
    category: "header",
    name: "Bold Promotion",
    backgroundColor: "#172554",
    padding: "40px 32px",
    nodes: [
      {
        type: "logo",
        content: "YOUR BRAND",
      },
      {
        type: "heading",
        content: "BIG NEWS. BIGGER SAVINGS.",
      },
      {
        type: "text",
        content: "Don't miss our exclusive offers. Shop your favourites today.",
      },
      {
        type: "button",
        content: "Shop now",
      },
    ],
  },
  {
    id: "header-elegant",
    category: "header",
    name: "Elegant Welcome",
    backgroundColor: "#F5EFE6",
    padding: "40px 32px",
    nodes: [
      {
        type: "logo",
        content: "MAISON",
      },
      {
        type: "heading",
        content: "Welcome to something beautiful",
      },
      {
        type: "text",
        content: "Thoughtfully selected just for you.",
      },
      {
        type: "button",
        content: "Discover more",
      },
    ],
  },
  {
    id: "header-modern",
    category: "header",
    name: "Modern Announcement",
    backgroundColor: "#F3E8FF",
    padding: "36px 32px",
    nodes: [
      {
        type: "logo",
        content: "STUDIO 01",
      },
      {
        type: "heading",
        content: "Meet the latest collection",
      },
      {
        type: "text",
        content: "Fresh ideas. New arrivals. Made for you.",
      },
      {
        type: "button",
        content: "View collection",
      },
    ],
  },
];