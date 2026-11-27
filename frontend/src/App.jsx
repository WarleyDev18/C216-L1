import { useState } from "react";
import { Header } from "./components/Header";
import { DisciplinasPage } from "./pages/DisciplinasPage";
import { EmBrevePage } from "./pages/EmBrevePage";

const PAGINAS = [
  { id: "dashboard", rotulo: "Dashboard" },
  { id: "disciplinas", rotulo: "Disciplinas" },
  { id: "atividades", rotulo: "Atividades" },
];

const EM_BREVE = {
  dashboard:
    "O resumo com os indicadores acadêmicos estará disponível em breve.",
  atividades: "O gerenciamento de atividades estará disponível em breve.",
};

// shortcut: navegacao por estado (sem URL por pagina); adotar um roteador se
// for preciso abrir uma pagina direto pelo link ou usar o "voltar" do navegador.
export default function App() {
  const [pagina, setPagina] = useState("disciplinas");
  const rotulo = PAGINAS.find((p) => p.id === pagina).rotulo;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header paginas={PAGINAS} paginaAtual={pagina} onNavegar={setPagina} />
      <main className="mx-auto max-w-5xl px-4 py-8">
        {pagina === "disciplinas" ? (
          <DisciplinasPage />
        ) : (
          <EmBrevePage titulo={rotulo} descricao={EM_BREVE[pagina]} />
        )}
      </main>
    </div>
  );
}
