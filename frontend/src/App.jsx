import { useEffect, useRef, useState } from "react";
import { Header } from "./components/Header";
import { AtividadesPage } from "./pages/AtividadesPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DisciplinasPage } from "./pages/DisciplinasPage";

const PAGINAS = [
  { id: "dashboard", rotulo: "Dashboard" },
  { id: "disciplinas", rotulo: "Disciplinas" },
  { id: "atividades", rotulo: "Atividades" },
];

// shortcut: navegacao por estado (sem URL por pagina); adotar um roteador se
// for preciso abrir uma pagina direto pelo link ou usar o "voltar" do navegador.
export default function App() {
  const [pagina, setPagina] = useState("dashboard");
  const conteudo = useRef(null);
  const primeiraRenderizacao = useRef(true);

  // Ao trocar de pagina, o foco vai para o conteudo novo (teclado e leitor de
  // tela nao ficam "presos" no menu) e o titulo da aba acompanha.
  useEffect(() => {
    const rotulo = PAGINAS.find((p) => p.id === pagina).rotulo;
    document.title = `${rotulo} · Gestor Acadêmico`;
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    conteudo.current?.focus();
  }, [pagina]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <a
        href="#conteudo"
        className="sr-only rounded-md bg-white px-4 py-2 font-medium text-indigo-700 shadow focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-20"
      >
        Pular para o conteúdo
      </a>
      <Header paginas={PAGINAS} paginaAtual={pagina} onNavegar={setPagina} />
      <main
        id="conteudo"
        ref={conteudo}
        tabIndex={-1}
        className="mx-auto max-w-5xl px-4 py-8 focus:outline-none"
      >
        {pagina === "dashboard" && <DashboardPage onNavegar={setPagina} />}
        {pagina === "disciplinas" && <DisciplinasPage />}
        {pagina === "atividades" && (
          <AtividadesPage
            onIrParaDisciplinas={() => setPagina("disciplinas")}
          />
        )}
      </main>
    </div>
  );
}
