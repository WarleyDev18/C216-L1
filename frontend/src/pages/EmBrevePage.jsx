// Secao ainda nao implementada: deixa isso explicito em vez de simular dados.
export function EmBrevePage({ titulo, descricao }) {
  return (
    <section aria-labelledby="titulo-em-breve" className="flex flex-col gap-4">
      <h2 id="titulo-em-breve" className="text-2xl font-bold text-slate-900">
        {titulo}
      </h2>
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
        <p className="font-medium text-slate-700">Em desenvolvimento</p>
        <p className="mt-1 text-sm text-slate-500">{descricao}</p>
      </div>
    </section>
  );
}
