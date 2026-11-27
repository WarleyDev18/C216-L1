const ESTILOS = {
  sucesso: "border-emerald-200 bg-emerald-50 text-emerald-800",
  erro: "border-red-200 bg-red-50 text-red-800",
};

// role="status" (educado) para sucesso; role="alert" (imediato) para erro.
export function Aviso({ tipo, children, onFechar }) {
  return (
    <div
      role={tipo === "erro" ? "alert" : "status"}
      className={`flex items-start justify-between gap-4 rounded-md border px-4 py-3 text-sm ${ESTILOS[tipo]}`}
    >
      <p>{children}</p>
      {onFechar && (
        <button
          type="button"
          onClick={onFechar}
          aria-label="Fechar aviso"
          className="rounded px-1 font-bold leading-none hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-current"
        >
          ×
        </button>
      )}
    </div>
  );
}
