export function Header({ paginas, paginaAtual, onNavegar }) {
  return (
    <header className="bg-indigo-700 text-white shadow">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Gestor Acadêmico
          </h1>
          <p className="text-sm text-indigo-100">
            Organize disciplinas, atividades e prazos do semestre.
          </p>
        </div>
        <nav aria-label="Navegação principal">
          <ul className="flex flex-wrap gap-1">
            {paginas.map((pagina) => {
              const atual = pagina.id === paginaAtual;
              return (
                <li key={pagina.id}>
                  <button
                    type="button"
                    onClick={() => onNavegar(pagina.id)}
                    aria-current={atual ? "page" : undefined}
                    className={`rounded-md px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white ${
                      atual
                        ? "bg-white text-indigo-700"
                        : "text-indigo-100 hover:bg-indigo-600"
                    }`}
                  >
                    {pagina.rotulo}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
