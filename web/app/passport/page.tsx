import { redirect } from "next/navigation";

export default function PassportRedirect() {
  redirect("/report?tab=passport");
}
