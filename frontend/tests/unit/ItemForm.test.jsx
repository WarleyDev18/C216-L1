import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ItemForm } from "../../src/components/ItemForm";

describe("ItemForm", () => {
  it("envia os valores validados e limpa os campos", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<ItemForm onAdd={onAdd} />);

    await user.type(screen.getByLabelText("Nome"), "  Notebook ");
    await user.type(screen.getByLabelText("Descrição"), "16GB");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(onAdd).toHaveBeenCalledWith({
      name: "Notebook",
      description: "16GB",
    });
    expect(screen.getByLabelText("Nome")).toHaveValue("");
    expect(screen.getByLabelText("Descrição")).toHaveValue("");
  });

  it("mostra erro acessível e não envia com nome vazio", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<ItemForm onAdd={onAdd} />);

    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "O nome é obrigatório.",
    );
    expect(screen.getByLabelText("Nome")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(onAdd).not.toHaveBeenCalled();
  });
});
