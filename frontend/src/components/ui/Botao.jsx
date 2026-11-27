const VARIANTES = {
  primario: "bg-indigo-600 text-white hover:bg-indigo-700",
  secundario:
    "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
  perigo: "bg-red-600 text-white hover:bg-red-700",
};

export function Botao({
  variante = "primario",
  type = "button",
  className = "",
  ...props
}) {
  return (
    <button
      type={type}
      className={`rounded-md px-4 py-2 text-sm font-medium shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTES[variante]} ${className}`}
      {...props}
    />
  );
}
