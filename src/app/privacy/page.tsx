// app/privacy/page.tsx
import fs from "fs";
import path from "path";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import LegalLayout from "../components/shared/LegalLayout";

export const metadata = {
  title: "Privacy Policy | Keychain Forge",
  description:
    "Read the Privacy Policy for Keychain Forge, explaining how we collect, use, and protect your personal information under GDPR.",
};

export default function PrivacyPage() {
  const filePath = path.join(process.cwd(), "public", "legal", "privacy.md");
  const privacyContent = fs.readFileSync(filePath, "utf8");

  return (
    <LegalLayout title="Privacy Policy">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{privacyContent}</ReactMarkdown>
    </LegalLayout>
  );
}
