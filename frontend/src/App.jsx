import { useState } from "react";
import { Header } from "./components/Header";
import { AtividadesPage } from "./pages/AtividadesPage";
import { DisciplinasPage } from "./pages/DisciplinasPage";
import { EmBrevePage } from "./pages/EmBrevePage";

const PAGINAS = [
  { id: "dashboard", rotulo: "Dashboard" },
  { id: "disciplinas", rotulo: "Disciplinas" },
  { id: "atividades", rotulo: "Atividades" },
];

// shortcut: navegacao por estado (sem URL por pagina); adotar um roteador se
// for preciso abrir uma pagina direto pelo link ou usar o "voltar" do navegador.
export default function App() {
  const [pagina, setPagina] = useState("disciplinas");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header paginas={PAGINAS} paginaAtual={pagina} onNavegar={setPagina} />
      <main className="mx-auto max-w-5xl px-4 py-8">
        {pagina === "disciplinas" && <DisciplinasPage />}
        {pagina === "atividades" && (
          <AtividadesPage
            onIrParaDisciplinas={() => setPagina("disciplinas")}
          />
        )}
        {pagina === "dashboard" && (
          <EmBrevePage
            titulo="Dashboard"
            descricao="O resumo com os indicadores acadêmicos estará disponível em breve."
          />
        )}
      </main>
    </div>
  );
}
