// app/components/shared/LegalLayout.tsx
export default function LegalLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-gray-50 mb-8">{title}</h1>

        {/* Legal content container */}
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-8 border border-gray-200 dark:border-gray-700">
          <div className="prose prose-gray dark:prose-invert max-w-none">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
