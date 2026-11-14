import { describe, expect, it } from "vitest";
import { NAME_MAX_LENGTH, validateItem } from "../../src/validation";

describe("validateItem", () => {
  it("rejeita nome vazio", () => {
    expect(validateItem({ name: "" }).errors.name).toBeDefined();
  });

  it("rejeita nome com apenas espaços", () => {
    expect(validateItem({ name: "   " }).errors.name).toBeDefined();
  });

  it("rejeita nome acima do limite do backend", () => {
    const result = validateItem({ name: "a".repeat(NAME_MAX_LENGTH + 1) });
    expect(result.errors.name).toBeDefined();
  });

  it("aceita nome no limite", () => {
    const result = validateItem({ name: "a".repeat(NAME_MAX_LENGTH) });
    expect(result.errors).toEqual({});
  });

  it("aplica trim e trata descrição vazia como null", () => {
    const result = validateItem({ name: "  Caneta ", description: "   " });
    expect(result.errors).toEqual({});
    expect(result.values).toEqual({ name: "Caneta", description: null });
  });
});
