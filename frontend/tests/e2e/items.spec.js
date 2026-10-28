import { expect, test } from "@playwright/test";

test("cadastra um item e o mostra na lista", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Nenhum item cadastrado.")).toBeVisible();

  await page.getByLabel("Nome").fill("Notebook");
  await page.getByLabel("Descrição").fill("16GB de RAM");
  await page.getByRole("button", { name: "Adicionar" }).click();

  await expect(page.getByRole("listitem")).toContainText("Notebook");
  await expect(page.getByRole("listitem")).toContainText("16GB de RAM");
  await expect(page.getByText("Nenhum item cadastrado.")).toBeHidden();
});

test("mostra erro quando o nome está vazio", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Adicionar" }).click();

  await expect(page.getByRole("alert")).toHaveText("O nome é obrigatório.");
  await expect(page.getByRole("listitem")).toHaveCount(0);
});
