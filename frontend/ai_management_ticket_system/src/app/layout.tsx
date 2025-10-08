import "../styles/globals.css";
import Providers from "@/components/Providers";

export const metadata = {
  title: "AI Ticket Management System",
  description: "AI-driven workflow dashboard for project management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
