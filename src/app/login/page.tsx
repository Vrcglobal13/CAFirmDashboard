import { LoginForms } from "@/components/LoginForms";

export default function LoginPage({ searchParams }: { searchParams?: { next?: string } }) {
  const nextPath = searchParams?.next === "/owner" ? "/owner" : "";

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4">
      <LoginForms nextPath={nextPath} />
    </main>
  );
}
