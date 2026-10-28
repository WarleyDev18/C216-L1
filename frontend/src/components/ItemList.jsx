export function ItemList({ items }) {
  return (
    <section aria-labelledby="items-heading" className="space-y-3">
      <h2
        id="items-heading"
        className="flex items-center gap-2 text-lg font-semibold"
      >
        Itens cadastrados
        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-sm text-indigo-700">
          {items.length}
        </span>
      </h2>

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 p-4 text-slate-600">
          Nenhum item cadastrado.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            >
              <p className="font-medium">{item.name}</p>
              {item.description && (
                <p className="text-sm text-slate-600">{item.description}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
