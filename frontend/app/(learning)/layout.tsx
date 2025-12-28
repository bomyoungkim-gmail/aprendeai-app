/**
 * Learning Route Group Layout
 * 
 * Minimal layout for immersive learning experiences (reader, reading sessions, games)
 */

export default function LearningLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {children}
    </div>
  );
}
