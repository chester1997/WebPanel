import { redirect } from "next/navigation";
import { requireUser, getCurrentTenant } from "@/lib/auth/session";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const user = await requireUser();

  const existing = await getCurrentTenant(user.id);
  if (existing) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm">
        <OnboardingForm />
      </div>
    </div>
  );
}
