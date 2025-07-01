import './globals.css';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import { FirebaseProvider } from '@/lib/FirebaseContext';
import Navigation from "@/components/Navigation";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AEO Viewer - AI Engine Optimization',
  description: 'Monitor and optimize your brand presence in AI search results',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${inter.className} bg-gray-100`}>
        <FirebaseProvider>
          <Navigation />
          <main className="pl-64">
            {children}
          </main>
        </FirebaseProvider>
      </body>
    </html>
  );
}
