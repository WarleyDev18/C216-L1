import { Header } from "../components/Header";

export function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <p>
          Bem-vindo! As funcionalidades serão adicionadas nas próximas etapas.
        </p>
      </main>
    </div>
  );
}
