// app/terms/page.tsx
import fs from "fs";
import path from "path";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import LegalLayout from "../components/shared/LegalLayout";

export const metadata = {
  title: "Terms of Service | Keychain Forge",
  description:
    "Read the Terms of Service for Keychain Forge, including user responsibilities, ordering policies, and legal information.",
};

export default function TermsPage() {
  // Read the Markdown file from public/legal
  const filePath = path.join(process.cwd(), "public", "legal", "terms.md");
  const termsContent = fs.readFileSync(filePath, "utf8");

  return (
    <LegalLayout title="Terms of Service">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{termsContent}</ReactMarkdown>
    </LegalLayout>
  );
}
