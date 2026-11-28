import { useId } from "react";

// Campo com label associado e erro ligado via aria-describedby.
// `as`: "input" (padrao), "select" (opcoes em children) ou "textarea".
export function Campo({
  label,
  erro,
  ref,
  as: Elemento = "input",
  className = "",
  children,
  ...props
}) {
  const id = useId();
  const erroId = `${id}-erro`;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <Elemento
        id={id}
        ref={ref}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? erroId : undefined}
        className={`rounded-md border bg-white px-3 py-2 text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 ${
          erro ? "border-red-500" : "border-slate-300"
        }`}
        {...props}
      >
        {children}
      </Elemento>
      {erro && (
        <p id={erroId} className="text-sm text-red-600">
          {erro}
        </p>
      )}
    </div>
  );
}
