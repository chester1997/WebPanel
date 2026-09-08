"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { createContent } from "@/modules/content/actions";
import { Button } from "@/components/ui/button";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="sm">
      {pending ? "Criando..." : "Criar conteúdo"}
    </Button>
  );
}

export function NewContentForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  async function clientAction(formData: FormData) {
    const res = await createContent(formData);
    if (res?.error) setError(res.error);
    else {
      setError("");
      setOpen(false);
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="sm">
        Novo conteúdo
      </Button>
    );
  }

  return (
    <form action={clientAction} className="flex flex-wrap items-end gap-2">
      <input
        name="title"
        placeholder="Título"
        required
        className="h-10 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-white"
      />
      <select
        name="type"
        className="h-10 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-white"
      >
        <option value="MOVIE">Filme</option>
        <option value="SERIES">Série</option>
        <option value="COURSE">Curso</option>
      </select>
      <SubmitButton />
      {error && <p className="text-sm text-red-500 basis-full">{error}</p>}
    </form>
  );
}
