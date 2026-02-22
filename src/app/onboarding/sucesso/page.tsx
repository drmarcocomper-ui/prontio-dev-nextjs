import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function OnboardingSucessoPage() {
  const cookieStore = await cookies();
  cookieStore.delete("prontio_onboarding");
  redirect("/?checkout=success");
}
