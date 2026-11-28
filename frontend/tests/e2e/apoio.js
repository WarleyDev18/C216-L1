import { expect } from "@playwright/test";

// Codigo unico por execucao (a API guarda em maiusculas, ate 20 caracteres):
// os testes nunca dependem nem mexem em registros que nao criaram.
export function codigoUnico() {
  const tempo = Date.now().toString(36).toUpperCase().slice(-7);
  const sorteio = Math.floor(Math.random() * 1296)
    .toString(36)
    .toUpperCase()
    .padStart(2, "0");
  return `E2E${tempo}${sorteio}`;
}

// "2026-12-10" -> "10/12/2026", o formato exibido pela interface.
export const formatoTela = (iso) => iso.split("-").reverse().join("/");

// Data ISO daqui a `dias` dias (prazo futuro, longe da virada do dia).
export function daquiA(dias) {
  return new Date(Date.now() + dias * 86_400_000).toISOString().slice(0, 10);
}

// Abre a aplicacao e navega pelo menu, como o usuario faz.
export async function irPara(page, pagina) {
  if (!page.url().startsWith("http")) await page.goto("/");
  await page
    .getByRole("navigation", { name: "Navegação principal" })
    .getByRole("button", { name: pagina })
    .click();
  await expect(
    page.getByRole("heading", { level: 2, name: pagina }),
  ).toBeVisible();
}

export async function cadastrarDisciplinaPelaTela(page, disciplina) {
  await irPara(page, "Disciplinas");
  await expect(page.getByText("Carregando disciplinas...")).toBeHidden();
  await page.getByLabel("Nome").fill(disciplina.nome);
  await page.getByLabel("Código").fill(disciplina.codigo);
  await page.getByLabel("Semestre").fill(disciplina.semestre);
  await page.getByRole("button", { name: "Cadastrar disciplina" }).click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: `Disciplina "${disciplina.nome}" cadastrada.` }),
  ).toBeVisible();
}

// Limpeza pela API real (atras do mesmo /api que o navegador usa), so dos
// codigos criados pelo teste, respeitando a integridade referencial:
// primeiro as atividades, depois a disciplina (que sem isso receberia 409).
export async function limparDisciplinas(request, codigos) {
  const disciplinas = await (await request.get("/api/disciplinas/")).json();
  for (const disciplina of disciplinas) {
    if (!codigos.includes(disciplina.codigo)) continue;
    const atividades = await (
      await request.get(`/api/atividades/?disciplina_id=${disciplina.id}`)
    ).json();
    for (const atividade of atividades) {
      await request.delete(`/api/atividades/${atividade.id}`);
    }
    const resposta = await request.delete(`/api/disciplinas/${disciplina.id}`);
    expect([204, 404]).toContain(resposta.status());
  }
}

// Le os cards do Dashboard: { Disciplinas: 3, Atividades: 7, ... }.
export async function lerIndicadores(page) {
  await expect(page.getByText("Carregando indicadores...")).toBeHidden();
  const regiao = page.getByRole("region", { name: "Indicadores" });
  await expect(regiao.getByRole("progressbar")).toBeVisible();
  return regiao
    .locator("dl > div")
    .evaluateAll((cards) =>
      Object.fromEntries(
        cards.map((card) => [
          card.querySelector("dt").textContent,
          Number(card.querySelector("dd").textContent),
        ]),
      ),
    );
}
