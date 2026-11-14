import { expect, test } from "@playwright/test";

// Sem mocks: usa a API e o banco reais. Nomes unicos evitam depender de dados anteriores.
function uniqueName(prefix) {
  return `${prefix} ${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

test("cadastra um item e ele persiste após recarregar a página", async ({
  page,
}) => {
  const name = uniqueName("Notebook");
  await page.goto("/");
  await expect(page.getByText("Carregando itens...")).toBeHidden();

  await page.getByLabel("Nome").fill(name);
  await page.getByLabel("Descrição").fill("16GB de RAM");
  await page.getByRole("button", { name: "Adicionar" }).click();

  const item = page.getByRole("listitem").filter({ hasText: name });
  await expect(item).toBeVisible();
  await expect(item).toContainText("16GB de RAM");
  await expect(page.getByLabel("Nome")).toHaveValue("");

  await page.reload();
  await expect(item).toBeVisible(); // veio do PostgreSQL via GET /items/
  await expect(page.getByText("Nenhum item cadastrado.")).toBeHidden();
});

test("recusa nome duplicado e mantém o que foi digitado", async ({ page }) => {
  const name = uniqueName("Mouse");
  await page.goto("/");
  await expect(page.getByText("Carregando itens...")).toBeHidden();

  await page.getByLabel("Nome").fill(name);
  await page.getByRole("button", { name: "Adicionar" }).click();
  await expect(
    page.getByRole("listitem").filter({ hasText: name }),
  ).toBeVisible();

  await page.getByLabel("Nome").fill(name);
  await page.getByRole("button", { name: "Adicionar" }).click();

  await expect(page.getByRole("alert")).toHaveText(
    "Já existe um item com esse nome",
  );
  await expect(page.getByLabel("Nome")).toHaveValue(name);
  await expect(
    page.getByRole("listitem").filter({ hasText: name }),
  ).toHaveCount(1);
});

test("mostra erro de validação sem chamar a API", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Carregando itens...")).toBeHidden();

  const posts = [];
  page.on("request", (request) => {
    if (request.method() === "POST") posts.push(request.url());
  });
  await page.getByRole("button", { name: "Adicionar" }).click();

  await expect(page.getByRole("alert")).toHaveText("O nome é obrigatório.");
  expect(posts).toEqual([]);
});
