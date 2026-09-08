"use client";

import { useActionState, useState } from "react";
import { createTenantAction, type ActionState } from "@/modules/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const initialState: ActionState = {};

const DIACRITICS_REGEX = new RegExp("[̀-ͯ]", "g");

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(DIACRITICS_REGEX, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function OnboardingForm() {
  const [state, formAction, pending] = useActionState(
    createTenantAction,
    initialState
  );
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Crie sua loja</CardTitle>
        <CardDescription>
          Essa é a sua loja dentro do Telegram. Você poderá conectar seu bot e
          personalizar tudo em seguida.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da loja</Label>
            <Input
              id="name"
              name="name"
              required
              onChange={(e) => {
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
            />
            {state.fieldErrors?.name && (
              <p className="text-sm text-red-500">{state.fieldErrors.name}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Identificador da loja</Label>
            <div className="flex items-center rounded-md border border-zinc-700 bg-zinc-900 focus-within:ring-2 focus-within:ring-blue-600">
              <span className="pl-3 text-sm text-zinc-500">/store/</span>
              <input
                id="slug"
                name="slug"
                required
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(slugify(e.target.value));
                }}
                className="w-full bg-transparent px-1 py-2 text-sm text-white outline-none"
              />
            </div>
            {state.fieldErrors?.slug && (
              <p className="text-sm text-red-500">{state.fieldErrors.slug}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Criando loja..." : "Criar loja"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
