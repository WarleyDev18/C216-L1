// Padrao "/api": o Vite (e depois o servidor do frontend) repassa ao FastAPI,
// entao o navegador fala com a mesma origem e o backend nao precisa de CORS.
const BASE_URL = (import.meta.env.VITE_API_URL ?? "/api").replace(/\/+$/, "");

const SEM_CONEXAO =
  "Não foi possível conectar à API. Verifique se o backend está em execução.";

const MENSAGENS = {
  404: "Registro não encontrado.",
  409: "A operação conflita com os dados existentes.",
  422: "Dados inválidos. Verifique os campos destacados.",
  502: SEM_CONEXAO,
  503: "A API está indisponível no momento. Tente novamente.",
  504: "A API demorou demais para responder. Tente novamente.",
};

export class ApiError extends Error {
  constructor(message, { status = 0, campos = {} } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status; // 0 = sem resposta (rede/API fora do ar)
    this.campos = campos; // erros de validacao por campo (422)
  }
}

function erroDaResposta(status, detail) {
  // Mensagens de negocio do backend (404/409) ja vem prontas em portugues.
  if (typeof detail === "string") return new ApiError(detail, { status });
  if (status === 422 && Array.isArray(detail)) {
    // FastAPI: [{ loc: ["body", "campo"], msg }] -> { campo: msg }
    const campos = Object.fromEntries(
      detail
        .filter((e) => e.loc?.[0] === "body" && e.loc.length > 1)
        .map((e) => [e.loc[1], e.msg]),
    );
    return new ApiError(MENSAGENS[422], { status, campos });
  }
  const mensagem =
    MENSAGENS[status] ?? `Erro inesperado na API (HTTP ${status}).`;
  return new ApiError(mensagem, { status });
}

export async function request(path, { method = "GET", body } = {}) {
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers:
        body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(SEM_CONEXAO);
  }

  if (response.status === 204) return null;
  const dados = await response.json().catch(() => null);
  if (response.ok) return dados;
  throw erroDaResposta(response.status, dados?.detail);
}
