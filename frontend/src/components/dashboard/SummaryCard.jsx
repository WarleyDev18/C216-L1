const DESTAQUES = {
  neutro: "border-slate-200",
  alerta: "border-red-300 bg-red-50",
};

// Par dt/dd: leitores de tela anunciam "rotulo: valor".
export function SummaryCard({ rotulo, valor, descricao, destaque = "neutro" }) {
  return (
    <div
      className={`flex flex-col rounded-lg border bg-white p-4 shadow-sm ${DESTAQUES[destaque]}`}
    >
      <dt className="text-sm font-medium text-slate-600">{rotulo}</dt>
      <dd className="order-first text-3xl font-bold text-slate-900">{valor}</dd>
      {descricao && (
        <dd className="mt-1 text-xs text-slate-500">{descricao}</dd>
      )}
    </div>
  );
}
