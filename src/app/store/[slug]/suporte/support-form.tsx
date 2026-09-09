"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { createSupportTicket } from "@/modules/support/actions";

function SubmitButton({ color }: { color: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3 rounded-lg text-white font-bold text-sm disabled:opacity-60"
      style={{ backgroundColor: color }}
    >
      {pending ? "Enviando..." : "Enviar"}
    </button>
  );
}

export function SupportForm({ slug, color }: { slug: string; color: string }) {
  const [state, setState] = useState<{ error?: string; success?: boolean }>({});

  async function action(formData: FormData) {
    const res = await createSupportTicket(slug, formData);
    setState(res);
  }

  if (state.success) {
    return (
      <div className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
        Chamado aberto! A loja vai te responder por aqui em breve.
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs text-zinc-400">Assunto</label>
        <input
          name="subject"
          required
          className="w-full h-10 rounded-lg bg-zinc-900 border border-zinc-800 px-3 text-sm text-white"
          placeholder="Ex: Não recebi meu acesso"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-zinc-400">Mensagem</label>
        <textarea
          name="message"
          required
          rows={4}
          className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-white resize-none"
          placeholder="Descreva o que aconteceu..."
        />
      </div>
      {state.error && <p className="text-xs text-red-400">{state.error}</p>}
      <SubmitButton color={color} />
    </form>
  );
}
