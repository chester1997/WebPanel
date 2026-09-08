"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        ready?: () => void;
        expand?: () => void;
      };
    };
  }
}

/**
 * Runs once on the client inside the Telegram Mini App WebView: reads the
 * initData Telegram injects and exchanges it (server-side validated) for a
 * customer session cookie. No-ops outside Telegram (initData is empty).
 */
export function TelegramBootstrap({ slug }: { slug: string }) {
  const router = useRouter();

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    webApp?.ready?.();
    webApp?.expand?.();

    const initData = webApp?.initData;
    if (!initData) return;

    fetch(`/api/store/${slug}/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData }),
    })
      .then((res) => {
        if (res.ok) router.refresh();
      })
      .catch(() => {
        // Silencioso: usuário permanece não identificado nesta sessão.
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  return null;
}
