import type { Metadata } from "next";
import { Fira_Sans, Poppins } from "next/font/google";
import "../work.css";

export const metadata: Metadata = {
  title: "Work Portal | Legson Media",
  robots: { index: false, follow: false },
};

const firaSans = Fira_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-fira",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-poppins",
  display: "swap",
});

export default function WorkRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`work ${firaSans.variable} ${poppins.variable}`}>
      {children}
    </div>
  );
}
