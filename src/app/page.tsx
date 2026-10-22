import { redirect } from "next/navigation";

// The menu is the home of a signed-in household; the guard sends everyone else to /connexion.
export default function Home() {
  redirect("/menu");
}
