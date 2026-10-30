import { redirect } from "next/navigation";

export default function XRayRedirect() {
  redirect("/report?tab=reality");
}
