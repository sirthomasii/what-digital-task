'use client';

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import '@mantine/core/styles.css';
import { MantineProvider, createTheme, AppShell } from '@mantine/core';
import { AuthProvider } from '@/contexts/AuthContext';
import { UserProvider } from '@/contexts/UserContext';
import { Header } from '@/components/Header';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const theme = createTheme({
  /** Put your mantine theme override here */
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <MantineProvider theme={theme}>
          <AuthProvider>
            <UserProvider>
              <AppShell
                header={{ height: 60 }}
                padding="md"
              >
                <Header />
                <AppShell.Main>
                  {children}
                </AppShell.Main>
              </AppShell>
            </UserProvider>
          </AuthProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
