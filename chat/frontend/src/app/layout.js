import { Inter } from "next/font/google";
import "./globals.css";
import ReduxProvider from "./redux/store/provider";
const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Chat App",
  description: "Welcome to chat app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <link rel="icon" href="/favicon.png" />
      </head>
      <body className={inter.className} suppressHydrationWarning={true}>
        <ReduxProvider>
          {children}
        </ReduxProvider>
      </body>
    </html>
  );
}