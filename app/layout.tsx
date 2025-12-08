// app/layout.tsx

import type { Metadata } from "next";
// אם אתה משתמש בפונט אחר, שנה את השורה הזו בהתאם
import { Outfit, Open_Sans } from "next/font/google";
import "./globals.css"; // וודא שקובץ ה-CSS הגלובלי שלך מיובא כאן
import { ThemeProvider } from "@/components/theme-provider"; // וודא שהנתיב נכון
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/components/ui/toast";

// הגדרת פונטים לפי Figma
const outfit = Outfit({ 
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["400", "600"],
});
const openSans = Open_Sans({ 
  subsets: ["latin"],
  variable: "--font-open-sans",
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "FitLog Pro",
  description: "Trainer Management Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // הוספנו את suppressHydrationWarning כדי למנוע אזהרות הקשורות למצב כהה
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <body className={`${outfit.variable} ${openSans.variable} font-sans bg-[#1A1D2E]`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <ToastProvider>
              {/* כאן נכנס כל התוכן של האפליקציה */}
              {children}
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}