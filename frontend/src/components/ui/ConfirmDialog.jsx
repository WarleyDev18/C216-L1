import { useEffect, useId, useRef } from "react";
import { Botao } from "./Botao";

// Confirmacao modal: foco inicial em "Cancelar" (acao segura) e Esc cancela.
// shortcut: sem prender o foco dentro do modal; usar <dialog> nativo se a navegacao por Tab escapar.
export function ConfirmDialog({
  titulo,
  children,
  rotuloConfirmar,
  processando,
  onConfirmar,
  onCancelar,
}) {
  const tituloId = useId();
  const cancelarRef = useRef(null);

  useEffect(() => {
    cancelarRef.current?.focus();
  }, []);

  function handleKeyDown(event) {
    if (event.key === "Escape" && !processando) onCancelar();
  }

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-slate-900/40 p-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        onKeyDown={handleKeyDown}
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
      >
        <h2 id={tituloId} className="text-lg font-semibold text-slate-900">
          {titulo}
        </h2>
        <div className="mt-2 text-sm text-slate-600">{children}</div>
        <div className="mt-6 flex justify-end gap-3">
          <Botao
            ref={cancelarRef}
            variante="secundario"
            onClick={onCancelar}
            disabled={processando}
          >
            Cancelar
          </Botao>
          <Botao variante="perigo" onClick={onConfirmar} disabled={processando}>
            {processando ? "Excluindo..." : rotuloConfirmar}
          </Botao>
        </div>
      </div>
    </div>
  );
}
