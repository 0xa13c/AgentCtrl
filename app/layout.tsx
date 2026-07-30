import type { Metadata } from "next";
import { Orbitron, JetBrains_Mono, Manrope } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { GridBackdrop } from "@/components/layout/grid-backdrop";
import { SettingsProvider } from "@/lib/settings-context";
import { NotificationListener } from "@/components/notifications/notification-listener";

const display = Orbitron({
  subsets: ["latin"],
  weight: ["500", "700", "900"],
  variable: "--font-display",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono",
});

const body = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "AgentCtrl // Mission Control",
  description: "Command and control deck for autonomous agents",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${display.variable} ${mono.variable} ${body.variable} min-h-screen`}>
        <SettingsProvider>
          <GridBackdrop />
          <div className="relative z-10 flex min-h-screen">
            <Sidebar />
            <div className="flex min-h-screen flex-1 flex-col">
              <Topbar />
              <main className="flex-1 overflow-y-auto px-6 pb-10 pt-6 lg:px-10">{children}</main>
            </div>
          </div>
          <NotificationListener />
          <Toaster
            theme="dark"
            position="bottom-right"
            toastOptions={{
              style: {
                background: "rgba(6,9,17,0.95)",
                border: "1px solid rgba(0,240,255,0.2)",
                color: "#e6f7fa",
                fontFamily: "var(--font-body)",
              },
            }}
          />
        </SettingsProvider>
      </body>
    </html>
  );
}
