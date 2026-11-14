import { useEffect, useState } from "react";
import { ItemForm } from "./components/ItemForm";
import { ItemList } from "./components/ItemList";
import { createItem, listItems } from "./services/items";

export default function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    listItems()
      .then(setItems)
      .catch((error) => setLoadError(error.message))
      .finally(() => setLoading(false));
  }, []);

  async function addItem(values) {
    // Lanca erro se a API recusar; o ItemForm mostra a mensagem e mantem os campos.
    const created = await createItem(values);
    setItems((current) => [...current, created]);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-indigo-600 py-6 text-white shadow">
        <div className="mx-auto max-w-4xl px-4">
          <h1 className="text-2xl font-bold">Itens</h1>
          <p className="text-indigo-100">
            Cadastre e visualize itens salvos no PostgreSQL pela API.
          </p>
        </div>
      </header>

      <main className="mx-auto grid max-w-4xl gap-6 px-4 py-8 md:grid-cols-2">
        <ItemForm onAdd={addItem} />
        <ItemList items={items} loading={loading} error={loadError} />
      </main>
    </div>
  );
}
