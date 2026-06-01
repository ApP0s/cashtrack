import { AuthForm } from "@/components/auth-form";
import { registerAction } from "@/lib/actions";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <AuthForm mode="register" action={registerAction} />
    </main>
  );
}
