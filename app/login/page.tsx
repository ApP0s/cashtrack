import { AuthForm } from "@/components/auth-form";
import { loginAction } from "@/lib/actions";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <AuthForm mode="login" action={loginAction} />
    </main>
  );
}
