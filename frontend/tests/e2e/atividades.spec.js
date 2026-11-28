import { expect, test } from "@playwright/test";
import {
  cadastrarDisciplinaPelaTela,
  codigoUnico,
  daquiA,
  formatoTela,
  irPara,
  limparDisciplinas,
} from "./apoio";

// Sem mocks: navegador real -> React -> FastAPI -> PostgreSQL.
const criados = [];

test.afterEach(async ({ request }) => {
  await limparDisciplinas(request, criados.splice(0));
});

test("CRUD de atividades vinculadas a uma disciplina", async ({ page }) => {
  const codigo = codigoUnico();
  criados.push(codigo);
  const disciplina = {
    nome: `Banco de Dados ${codigo}`,
    codigo,
    semestre: "2026.2",
  };
  const titulo = `Trabalho final ${codigo}`;
  const prazo = daquiA(30);

  await cadastrarDisciplinaPelaTela(page, disciplina);

  // Cadastro da atividade, escolhendo a disciplina pelo nome (nunca pelo id).
  await irPara(page, "Atividades");
  await page.getByLabel("Título").fill(titulo);
  // exact: o rotulo "Disciplina" tambem esta contido em "Filtrar por disciplina".
  await page
    .getByLabel("Disciplina", { exact: true })
    .selectOption({ label: `${codigo} — ${disciplina.nome} (2026.2)` });
  await page.getByLabel("Data de entrega").fill(prazo);
  await page.getByLabel("Prioridade", { exact: true }).selectOption("alta");
  await page.getByLabel("Descrição (opcional)").fill("Entrega via E2E");
  await page.getByRole("button", { name: "Cadastrar atividade" }).click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: `Atividade "${titulo}" cadastrada.` }),
  ).toBeVisible();

  const lista = page.getByRole("list", { name: "Atividades cadastradas" });
  const item = lista.getByRole("listitem").filter({ hasText: titulo });
  const conferir = async (textos) => {
    for (const texto of textos) await expect(item).toContainText(texto);
  };
  await conferir([
    `${codigo} — ${disciplina.nome}`,
    `Entrega: ${formatoTela(prazo)}`,
    "Prioridade alta",
    "Pendente",
    "Entrega via E2E",
  ]);
  await expect(item.getByText("Atrasada")).toHaveCount(0);

  // A disciplina filtra a lista pelo query parameter real da API.
  await page
    .getByLabel("Filtrar por disciplina")
    .selectOption({ label: `${codigo} — ${disciplina.nome}` });
  await expect(lista.getByRole("listitem")).toHaveCount(1);
  await expect(item).toBeVisible();

  // Recarregar: tudo volta do PostgreSQL.
  await page.reload();
  await irPara(page, "Atividades");
  await conferir([`${codigo} — ${disciplina.nome}`, "Prioridade alta"]);

  // Edicao: concluir e renomear.
  const novoTitulo = `Trabalho final (entregue) ${codigo}`;
  await item.getByRole("button", { name: `Editar ${titulo}` }).click();
  await expect(
    page.getByRole("heading", { name: "Editar atividade" }),
  ).toBeVisible();
  await expect(page.getByLabel("Título")).toHaveValue(titulo);
  await expect(page.getByLabel("Data de entrega")).toHaveValue(prazo);
  await page.getByLabel("Título").fill(novoTitulo);
  await page.getByLabel("Status", { exact: true }).selectOption("concluida");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  const editada = lista.getByRole("listitem").filter({ hasText: novoTitulo });
  await expect(editada).toContainText("Concluída");

  await page.reload();
  await irPara(page, "Atividades");
  await expect(editada).toContainText("Concluída");

  // Integridade: com a atividade vinculada, a disciplina nao pode ser excluida.
  await irPara(page, "Disciplinas");
  await page
    .getByRole("button", { name: `Excluir ${disciplina.nome}` })
    .click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Excluir" })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "existem atividades vinculadas",
  );

  // Exclui a atividade e so entao a disciplina.
  await irPara(page, "Atividades");
  await editada.getByRole("button", { name: `Excluir ${novoTitulo}` }).click();
  await page
    .getByRole("alertdialog", { name: "Excluir atividade?" })
    .getByRole("button", { name: "Excluir" })
    .click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: `Atividade "${novoTitulo}" excluída.` }),
  ).toBeVisible();
  await expect(editada).toHaveCount(0);

  await irPara(page, "Disciplinas");
  await page
    .getByRole("button", { name: `Excluir ${disciplina.nome}` })
    .click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Excluir" })
    .click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: `Disciplina "${disciplina.nome}" excluída.` }),
  ).toBeVisible();
});
