"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { createCategory } from "@/modules/catalog/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Salvando..." : "Criar categoria"}
    </Button>
  );
}

export function NewCategoryForm() {
  const [error, setError] = useState("");

  async function clientAction(formData: FormData) {
    const res = await createCategory(formData);
    setError(res?.error ?? "");
  }

  return (
    <form action={clientAction} className="space-y-4 max-w-sm">
      <div className="space-y-2">
        <Label htmlFor="name">Nome da categoria</Label>
        <Input id="name" name="name" required />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <SubmitButton />
    </form>
  );
}
