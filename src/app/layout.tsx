import type {Metadata} from 'next';
import { Bebas_Neue, DM_Sans } from 'next/font/google';
import './globals.css';

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas-neue',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
});

export const metadata: Metadata = {
  title: 'IronRank | AI Weightlifting Rank & Progression',
  description: 'Elite AI-powered biometric tracking for serious weightlifters. Monitor rank tiers, CNS fatigue, and neural adaptation.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bebasNeue.variable} ${dmSans.variable} dark`} suppressHydrationWarning>
      <body className="font-body antialiased bg-background text-foreground overflow-hidden h-screen w-screen" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
