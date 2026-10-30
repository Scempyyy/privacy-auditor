import { redirect } from "next/navigation";

export default function IdentityRedirect() {
  redirect("/report?tab=identity");
}
