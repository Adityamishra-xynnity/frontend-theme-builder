
import type { EmailSectionTemplate } from "../context/EmailEditorContext";

export const footerTemplates: EmailSectionTemplate[] = [
  {
    id: "footer-minimal",
    category: "footer",
    name: "Minimal Footer",
    backgroundColor: "#F9FAFB",
    padding: "24px",
    nodes: [
      { type: "logo", content: "YOUR BRAND", fontSize: 18 },
      { type: "text", content: "Thank you for being with us.", fontSize: 13 },
      { type: "link", content: "Unsubscribe | Privacy Policy", fontSize: 12 },
    ],
  },
  {
    id: "footer-social",
    category: "footer",
    name: "Social Media Footer",
    backgroundColor: "#F3F0FF",
    padding: "24px",
    nodes: [
      { type: "heading", content: "Stay Connected", fontSize: 22 },
      { type: "text", content: "Follow us on our social media channels.", fontSize: 14 },
      { type: "link", content: "Instagram  |  Facebook  |  LinkedIn", fontSize: 13 },
      { type: "text", content: "© 2026 Your Brand. All rights reserved.", fontSize: 12 },
    ],
  },
  {
    id: "footer-business",
    category: "footer",
    name: "Business Footer",
    backgroundColor: "#172554",
    padding: "24px",
    nodes: [
      { type: "logo", content: "YOUR COMPANY", fontSize: 20 },
      { type: "text", content: "Your trusted partner for better solutions.", fontSize: 14 },
      { type: "link", content: "Contact Us  |  About Us  |  Privacy", fontSize: 13 },
      { type: "text", content: "© 2026 Your Company. All rights reserved.", fontSize: 12 },
    ],
  },
  {
    id: "footer-newsletter",
    category: "footer",
    name: "Newsletter Footer",
    backgroundColor: "#FFF7ED",
    padding: "24px",
    nodes: [
      { type: "heading", content: "Thanks for reading!", fontSize: 22 },
      { type: "text", content: "We hope you enjoyed this newsletter.", fontSize: 14 },
      { type: "button", content: "Visit Our Website", fontSize: 14 },
      { type: "link", content: "Manage preferences | Unsubscribe", fontSize: 12 },
    ],
  },
];
