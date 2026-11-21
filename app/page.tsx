import { redirect } from "next/navigation";

/**
 * The public news site stays on WordPress; this application is the directory.
 * Keep `/` pointing at the directory so a bare host never renders an empty page.
 */
export default function RootPage() {
  redirect("/directory");
}
