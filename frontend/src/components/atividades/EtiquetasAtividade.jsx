import { PRIORIDADES, rotuloDe, STATUS } from "../../services/atividades";

const COR_PRIORIDADE = {
  baixa: "bg-slate-100 text-slate-700",
  media: "bg-amber-100 text-amber-800",
  alta: "bg-red-100 text-red-800",
};

const COR_STATUS = {
  pendente: "bg-slate-100 text-slate-700",
  em_andamento: "bg-sky-100 text-sky-800",
  concluida: "bg-emerald-100 text-emerald-800",
};

function Etiqueta({ cor, children }) {
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${cor}`}>
      {children}
    </span>
  );
}

// Cor e sempre acompanhada de texto: o significado nao depende so da cor.
export function EtiquetasAtividade({ atividade }) {
  return (
    <>
      <Etiqueta cor={COR_PRIORIDADE[atividade.prioridade]}>
        Prioridade {rotuloDe(PRIORIDADES, atividade.prioridade).toLowerCase()}
      </Etiqueta>
      <Etiqueta cor={COR_STATUS[atividade.status]}>
        {rotuloDe(STATUS, atividade.status)}
      </Etiqueta>
      {atividade.atrasada && (
        <Etiqueta cor="bg-red-600 text-white">Atrasada</Etiqueta>
      )}
    </>
  );
}
