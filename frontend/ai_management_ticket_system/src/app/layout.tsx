import "../styles/globals.css";
import AppRootClient from '@/components/AppRootClient';

export const metadata = {
  title: "AI Ticket Management System",
  description: "AI-driven workflow dashboard for project management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppRootClient>{children}</AppRootClient>
      </body>
    </html>
  );
}
