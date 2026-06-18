// app/(public)/login/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LoginForm from "./LoginForm";
import { cookieName } from "@/lib/auth";
import packageJson from "../../../../package.json";

export default async function LoginPage() {
  const token = (await cookies()).get(cookieName)?.value; // if your Next version is sync: cookies().get(...)
  if (token) redirect("/");
  return <LoginForm appVersion={packageJson.version} />;
}
