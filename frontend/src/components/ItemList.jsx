function ListContent({ items, loading, error }) {
  if (loading) {
    return (
      <p role="status" className="text-slate-600">
        Carregando itens...
      </p>
    );
  }

  if (error) {
    return (
      <p
        role="alert"
        className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700"
      >
        {error}
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 p-4 text-slate-600">
        Nenhum item cadastrado.
      </p>
    );
  }

  return (
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
  );
}

export function ItemList({ items, loading = false, error = "" }) {
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

      <ListContent items={items} loading={loading} error={error} />
    </section>
  );
}
