// O codigo roda no navegador: a URL e a da API publicada no host, nao o nome do servico Docker.
export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
// Com barra final: "/items" responderia 307, que atrapalha o preflight de CORS.
const ITEMS_URL = `${API_URL}/items/`;

export const CONNECTION_ERROR = "Não foi possível conectar à API.";
export const INVALID_DATA_ERROR =
  "Dados inválidos. Verifique os campos e tente novamente.";

function errorMessage(status, body, fallback) {
  // O backend devolve "detail" como texto nos erros de negocio (ex.: 409).
  if (typeof body?.detail === "string") return body.detail;
  // No 422 do FastAPI, "detail" e uma lista de erros de validacao.
  if (status === 422) return INVALID_DATA_ERROR;
  return `${fallback} (HTTP ${status})`;
}

async function request(url, options, fallbackMessage) {
  let response;
  try {
    response = await fetch(url, options);
  } catch {
    throw new Error(CONNECTION_ERROR);
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(errorMessage(response.status, body, fallbackMessage));
  }
  return body;
}

export function listItems() {
  return request(ITEMS_URL, undefined, "Erro ao carregar os itens.");
}

export function createItem({ name, description }) {
  return request(
    ITEMS_URL,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: description || null }),
    },
    "Erro ao cadastrar o item.",
  );
}
