import AdminLoginForm from "@/components/AdminLoginForm";

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-cream px-sp-4">
      <div className="w-full max-w-sm bg-white rounded-md border border-line p-sp-6 shadow-sm">
        <p className="font-mono text-xs uppercase tracking-widest text-moss mb-sp-2">
          Panel privado
        </p>
        <h1 className="font-bodoni italic font-bold uppercase text-2xl text-ink mb-sp-6">
          Crislia — Admin
        </h1>

        <AdminLoginForm />
      </div>
    </main>
  );
}
