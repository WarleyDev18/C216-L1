import { expect, test } from "@playwright/test";
import {
  cadastrarDisciplinaPelaTela,
  codigoUnico,
  irPara,
  lerIndicadores,
  limparDisciplinas,
} from "./apoio";

// Sem mocks: navegador real -> React -> FastAPI -> PostgreSQL.
const criados = [];

test.afterEach(async ({ request }) => {
  await limparDisciplinas(request, criados.splice(0));
});

// O banco pode ja ter dados: o teste compara o antes e o depois (diferencas),
// sem supor que comeca vazio. workers: 1 evita outro teste mexer no meio.
test("Dashboard reflete os registros persistidos", async ({ page }) => {
  const codigo = codigoUnico();
  criados.push(codigo);
  const disciplina = { nome: `Redes ${codigo}`, codigo, semestre: "2026.2" };
  const titulo = `Lista vencida ${codigo}`;

  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 2, name: "Dashboard" }),
  ).toBeVisible();
  const antes = await lerIndicadores(page);

  await cadastrarDisciplinaPelaTela(page, disciplina);
  await irPara(page, "Atividades");
  await page.getByLabel("Título").fill(titulo);
  await page
    .getByLabel("Disciplina", { exact: true })
    .selectOption({ label: `${codigo} — ${disciplina.nome} (2026.2)` });
  // Prazo bem no passado e status pendente: a regra do backend a marca como
  // atrasada; por ser o prazo mais antigo, fica no topo da lista "Atrasadas"
  // (que mostra so as 5 primeiras) mesmo que o banco ja tenha outras.
  await page.getByLabel("Data de entrega").fill("2000-01-03");
  await page.getByRole("button", { name: "Cadastrar atividade" }).click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: `Atividade "${titulo}" cadastrada.` }),
  ).toBeVisible();

  const conferirDashboard = async () => {
    const depois = await lerIndicadores(page);
    expect(depois).toEqual({
      ...antes,
      Disciplinas: antes.Disciplinas + 1,
      Atividades: antes.Atividades + 1,
      Pendentes: antes.Pendentes + 1,
      Atrasadas: antes.Atrasadas + 1,
    });
    await expect(
      page.getByText(
        `${depois.Concluídas} de ${depois.Atividades} atividades concluídas`,
      ),
    ).toBeVisible();
    const atrasadas = page.getByRole("list", { name: "Atrasadas" });
    await expect(atrasadas.getByText(titulo)).toBeVisible();
    await expect(atrasadas).toContainText(`${codigo} — ${disciplina.nome}`);
  };

  await irPara(page, "Dashboard");
  await conferirDashboard();

  // Recarregar: os indicadores sao recalculados a partir do banco.
  await page.reload();
  await conferirDashboard();
});
