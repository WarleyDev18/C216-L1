import { expect, test } from "@playwright/test";
import {
  cadastrarDisciplinaPelaTela,
  codigoUnico,
  irPara,
  limparDisciplinas,
} from "./apoio";

// Sem mocks: navegador real -> React -> FastAPI -> PostgreSQL.
const criados = [];

test.afterEach(async ({ request }) => {
  await limparDisciplinas(request, criados.splice(0));
});

test("CRUD completo de disciplinas com persistencia no banco", async ({
  page,
}) => {
  const codigo = codigoUnico();
  criados.push(codigo);
  const nome = `Sistemas Distribuídos ${codigo}`;
  const lista = page.getByRole("list", { name: "Disciplinas cadastradas" });
  const item = lista.getByRole("listitem").filter({ hasText: nome });

  // Cadastro (codigo digitado em minusculas: a API normaliza).
  await cadastrarDisciplinaPelaTela(page, {
    nome,
    codigo: codigo.toLowerCase(),
    semestre: "2026.2",
  });
  await expect(item).toBeVisible();
  await expect(item).toContainText(codigo);
  await expect(item).toContainText("Semestre 2026.2");
  await expect(page.getByLabel("Nome")).toHaveValue("");

  // Duplicidade (mesmo codigo e semestre) e recusada com a mensagem da API.
  await page.getByLabel("Nome").fill(`Duplicada ${codigo}`);
  await page.getByLabel("Código").fill(codigo);
  await page.getByLabel("Semestre").fill("2026.2");
  await page.getByRole("button", { name: "Cadastrar disciplina" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Já existe uma disciplina com esse código nesse semestre",
  );
  await expect(page.getByLabel("Nome")).toHaveValue(`Duplicada ${codigo}`);

  // Recarregar: o registro vem de novo do PostgreSQL.
  await page.reload();
  await irPara(page, "Disciplinas");
  await expect(item).toBeVisible();

  // Edicao.
  const novoNome = `Sistemas Distribuídos II ${codigo}`;
  await item.getByRole("button", { name: `Editar ${nome}` }).click();
  await expect(
    page.getByRole("heading", { name: "Editar disciplina" }),
  ).toBeVisible();
  await expect(page.getByLabel("Nome")).toHaveValue(nome);
  await page.getByLabel("Nome").fill(novoNome);
  await page.getByLabel("Semestre").fill("2027.1");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  const editado = lista.getByRole("listitem").filter({ hasText: novoNome });
  await expect(editado).toContainText("Semestre 2027.1");
  await expect(item).toHaveCount(0);

  await page.reload();
  await irPara(page, "Disciplinas");
  await expect(editado).toContainText("Semestre 2027.1");

  // Exclusao com confirmacao.
  await editado.getByRole("button", { name: `Excluir ${novoNome}` }).click();
  const dialogo = page.getByRole("alertdialog", {
    name: "Excluir disciplina?",
  });
  await expect(dialogo).toContainText(novoNome);
  await dialogo.getByRole("button", { name: "Excluir" }).click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: `Disciplina "${novoNome}" excluída.` }),
  ).toBeVisible();
  await expect(editado).toHaveCount(0);

  await page.reload();
  await irPara(page, "Disciplinas");
  await expect(page.getByText("Carregando disciplinas...")).toBeHidden();
  await expect(page.getByText(novoNome)).toHaveCount(0);
});
