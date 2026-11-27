import { useCallback, useEffect, useState } from "react";
import { ProgressOverview } from "../components/dashboard/ProgressOverview";
import { SummaryCard } from "../components/dashboard/SummaryCard";
import { UpcomingActivities } from "../components/dashboard/UpcomingActivities";
import { Aviso } from "../components/ui/Aviso";
import { Botao } from "../components/ui/Botao";
import { listAtividadesComAtraso } from "../services/atividades";
import { getResumo, separarEntregas } from "../services/dashboard";
import { listDisciplinas } from "../services/disciplinas";

function Erro({ mensagem, onTentarNovamente }) {
  return (
    <div className="flex flex-col items-start gap-3">
      <Aviso tipo="erro">{mensagem}</Aviso>
      <Botao variante="secundario" onClick={onTentarNovamente}>
        Tentar novamente
      </Botao>
    </div>
  );
}

function Vazio({ children, acao, onAcao }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-slate-300 bg-white p-5">
      <p className="text-slate-600">{children}</p>
      <Botao onClick={onAcao}>{acao}</Botao>
    </div>
  );
}

// Busca tudo a cada visita: voltar ao Dashboard remonta a pagina e traz os
// numeros atualizados do banco, sem estado local que possa ficar defasado.
export function DashboardPage({ onNavegar }) {
  const [carregando, setCarregando] = useState(true);
  const [resumo, setResumo] = useState(null);
  const [erroResumo, setErroResumo] = useState("");
  const [entregas, setEntregas] = useState(null);
  const [disciplinas, setDisciplinas] = useState([]);
  const [erroEntregas, setErroEntregas] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErroResumo("");
    setErroEntregas("");
    // allSettled: uma falha nao esconde a parte que carregou.
    const [r, a, d] = await Promise.allSettled([
      getResumo(),
      listAtividadesComAtraso(),
      listDisciplinas(),
    ]);
    if (r.status === "fulfilled") {
      setResumo(r.value);
    } else {
      setResumo(null);
      setErroResumo(r.reason.message);
    }
    if (a.status === "fulfilled" && d.status === "fulfilled") {
      setEntregas(separarEntregas(a.value));
      setDisciplinas(d.value);
    } else {
      setEntregas(null);
      setErroEntregas((a.reason ?? d.reason).message);
    }
    setCarregando(false);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return (
    <section aria-labelledby="titulo-dashboard" className="flex flex-col gap-6">
      <div>
        <h2 id="titulo-dashboard" className="text-2xl font-bold text-slate-900">
          Dashboard
        </h2>
        <p className="text-slate-600">
          Visão geral das suas disciplinas, atividades e prazos.
        </p>
      </div>

      {carregando ? (
        <p
          aria-busy="true"
          className="rounded-lg border border-slate-200 bg-white p-6 text-center text-slate-500"
        >
          Carregando indicadores...
        </p>
      ) : (
        <>
          <section
            aria-labelledby="titulo-indicadores"
            className="flex flex-col gap-4"
          >
            <h3 id="titulo-indicadores" className="text-lg font-semibold">
              Indicadores
            </h3>
            {erroResumo ? (
              <Erro mensagem={erroResumo} onTentarNovamente={carregar} />
            ) : (
              <>
                <dl className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                  <SummaryCard
                    rotulo="Disciplinas"
                    valor={resumo.total_disciplinas}
                  />
                  <SummaryCard
                    rotulo="Atividades"
                    valor={resumo.total_atividades}
                  />
                  <SummaryCard rotulo="Pendentes" valor={resumo.pendentes} />
                  <SummaryCard
                    rotulo="Em andamento"
                    valor={resumo.em_andamento}
                  />
                  <SummaryCard rotulo="Concluídas" valor={resumo.concluidas} />
                  <SummaryCard
                    rotulo="Atrasadas"
                    valor={resumo.atrasadas}
                    descricao="Vencidas e não concluídas"
                    destaque={resumo.atrasadas > 0 ? "alerta" : "neutro"}
                  />
                </dl>
                {resumo.total_disciplinas === 0 ? (
                  <Vazio
                    acao="Cadastrar disciplina"
                    onAcao={() => onNavegar("disciplinas")}
                  >
                    Nenhuma disciplina cadastrada. Comece cadastrando as
                    disciplinas do semestre.
                  </Vazio>
                ) : (
                  resumo.total_atividades === 0 && (
                    <Vazio
                      acao="Cadastrar atividade"
                      onAcao={() => onNavegar("atividades")}
                    >
                      Nenhuma atividade cadastrada. Registre trabalhos, provas e
                      entregas para acompanhar seus prazos.
                    </Vazio>
                  )
                )}
                <ProgressOverview resumo={resumo} />
              </>
            )}
          </section>

          <section
            aria-labelledby="titulo-entregas"
            className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h3 id="titulo-entregas" className="text-lg font-semibold">
              Próximas Entregas
            </h3>
            {erroEntregas ? (
              <Erro mensagem={erroEntregas} onTentarNovamente={carregar} />
            ) : (
              <UpcomingActivities
                entregas={entregas}
                disciplinas={disciplinas}
              />
            )}
          </section>
        </>
      )}
    </section>
  );
}
