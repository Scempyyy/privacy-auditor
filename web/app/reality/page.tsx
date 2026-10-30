import { redirect } from "next/navigation";

export default function RealityRedirect() {
  redirect("/report?tab=reality");
}
