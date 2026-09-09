"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export function CopyButton({
  value,
  label = "Copiar",
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      className={cn(
        "bg-transparent border-zinc-700 hover:bg-zinc-800 text-zinc-300",
        className
      )}
      disabled={!value}
      onClick={async () => {
        if (!value) return;
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // Clipboard API indisponível (ex: contexto não seguro) — sem feedback de erro intrusivo.
        }
      }}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 mr-2" /> Copiado
        </>
      ) : (
        <>
          <Copy className="w-4 h-4 mr-2" /> {label}
        </>
      )}
    </Button>
  );
}
