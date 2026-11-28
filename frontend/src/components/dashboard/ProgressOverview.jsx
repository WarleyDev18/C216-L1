import { percentualConcluido } from "../../services/dashboard";

export function ProgressOverview({ resumo }) {
  const percentual = percentualConcluido(resumo);

  return (
    <section
      aria-labelledby="titulo-progresso"
      className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id="titulo-progresso" className="text-lg font-semibold">
          Progresso acadêmico
        </h3>
        <p className="text-sm text-slate-600">
          {resumo.concluidas} de {resumo.total_atividades} atividades concluídas
        </p>
      </div>
      <div
        role="progressbar"
        aria-labelledby="titulo-progresso"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentual}
        aria-valuetext={`${percentual}% concluído`}
        className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200"
      >
        <div
          className="h-full rounded-full bg-emerald-500 transition-[width]"
          style={{ width: `${percentual}%` }}
        />
      </div>
      <p className="mt-2 text-2xl font-bold text-emerald-700">
        {percentual}% concluído
      </p>
    </section>
  );
}
