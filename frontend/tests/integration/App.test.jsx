import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../../src/App";

describe("App", () => {
  it("renderiza o nome do sistema", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Gestor Acadêmico" }),
    ).toBeInTheDocument();
  });
});
