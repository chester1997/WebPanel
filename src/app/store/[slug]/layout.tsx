import Script from "next/script";
import { ReactNode } from "react";
import { TelegramBootstrap } from "./telegram-bootstrap";

export default async function StoreLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <>
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      <TelegramBootstrap slug={slug} />
      {children}
    </>
  );
}
