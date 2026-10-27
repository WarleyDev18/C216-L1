// Limite do backend: items.name e String(255).
export const NAME_MAX_LENGTH = 255;

export function validateItem({ name = "", description = "" }) {
  const values = {
    name: name.trim(),
    description: description.trim() || null,
  };
  const errors = {};

  if (!values.name) {
    errors.name = "O nome é obrigatório.";
  } else if (values.name.length > NAME_MAX_LENGTH) {
    errors.name = `O nome deve ter no máximo ${NAME_MAX_LENGTH} caracteres.`;
  }

  return { errors, values };
}
