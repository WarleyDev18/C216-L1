import { useState } from "react";
import { ItemForm } from "./components/ItemForm";
import { ItemList } from "./components/ItemList";

export default function App() {
  const [items, setItems] = useState([]);

  function addItem(values) {
    // Dados so em memoria: o id e o proximo da lista (somem ao recarregar a pagina).
    setItems((current) => [...current, { id: current.length + 1, ...values }]);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-indigo-600 py-6 text-white shadow">
        <div className="mx-auto max-w-4xl px-4">
          <h1 className="text-2xl font-bold">Itens</h1>
          <p className="text-indigo-100">
            Cadastre e visualize itens (dados em memória).
          </p>
        </div>
      </header>

      <main className="mx-auto grid max-w-4xl gap-6 px-4 py-8 md:grid-cols-2">
        <ItemForm onAdd={addItem} />
        <ItemList items={items} />
      </main>
    </div>
  );
}
