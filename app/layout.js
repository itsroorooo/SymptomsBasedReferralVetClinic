import { Poppins } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata = {
  title: "SymptoVet",
  description: "Symptom-Based Referral System for Domestic Pets",
  icons: {
    icon: "/image/logo_blue.png",
    shortcut: "/image/logo_blue.png",
    apple: "/apple-touch-icon.png", // Recommended 180x180px for Apple devices
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body
        className={`${poppins.variable} font-sans h-full bg-white dark:bg-gray-900`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
