import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ItemList } from "../../src/components/ItemList";

describe("ItemList", () => {
  it("mostra o estado vazio", () => {
    render(<ItemList items={[]} />);

    expect(screen.getByText("Nenhum item cadastrado.")).toBeInTheDocument();
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });

  it("lista nome e descrição dos itens", () => {
    const items = [
      { id: 1, name: "Caneta", description: "Azul" },
      { id: 2, name: "Caderno", description: null },
    ];
    render(<ItemList items={items} />);

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("Azul")).toBeInTheDocument();
    expect(
      screen.queryByText("Nenhum item cadastrado."),
    ).not.toBeInTheDocument();
  });
});
