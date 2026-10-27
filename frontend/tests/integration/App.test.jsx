import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "../../src/App";

async function addItem(user, name, description) {
  await user.type(screen.getByLabelText("Nome"), name);
  if (description)
    await user.type(screen.getByLabelText("Descrição"), description);
  await user.click(screen.getByRole("button", { name: "Adicionar" }));
}

describe("App (formulário + lista)", () => {
  it("começa com a lista vazia", () => {
    render(<App />);

    expect(screen.getByText("Nenhum item cadastrado.")).toBeInTheDocument();
  });

  it("cadastra itens e os mostra na lista", async () => {
    const user = userEvent.setup();
    render(<App />);

    await addItem(user, "Notebook", "16GB de RAM");
    await addItem(user, "Mouse");

    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("Notebook");
    expect(rows[0]).toHaveTextContent("16GB de RAM");
    expect(rows[1]).toHaveTextContent("Mouse");
    expect(
      screen.queryByText("Nenhum item cadastrado."),
    ).not.toBeInTheDocument();
  });

  it("não cadastra item inválido", async () => {
    const user = userEvent.setup();
    render(<App />);

    await addItem(user, "   ");

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });
});
