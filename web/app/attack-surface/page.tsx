import { redirect } from "next/navigation";

export default function AttackSurfaceRedirect() {
  redirect("/report?tab=attack_surface");
}
