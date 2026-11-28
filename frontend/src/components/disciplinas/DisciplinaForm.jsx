import { useEffect, useRef, useState } from "react";
import { Aviso } from "../ui/Aviso";
import { Botao } from "../ui/Botao";
import { Campo } from "../ui/Campo";

const VAZIO = { nome: "", codigo: "", semestre: "" };

// Espelha backend/src/app/schemas/disciplina.py (o backend continua sendo a fonte da verdade).
const CAMPOS = {
  nome: {
    label: "Nome",
    placeholder: "Sistemas Distribuídos",
    maxLength: 120,
    valido: (v) => v.length >= 1 && v.length <= 120,
    mensagem: "Informe o nome da disciplina (até 120 caracteres).",
  },
  codigo: {
    label: "Código",
    placeholder: "C216",
    maxLength: 20,
    valido: (v) => v.length >= 1 && v.length <= 20,
    mensagem: "Informe o código da disciplina (até 20 caracteres).",
  },
  semestre: {
    label: "Semestre",
    placeholder: "2026.2",
    maxLength: 6,
    valido: (v) => /^\d{4}\.[12]$/.test(v),
    mensagem: "Informe o semestre no formato AAAA.1 ou AAAA.2 (ex.: 2026.2).",
  },
};

export function normalizar(valores) {
  return {
    nome: valores.nome.trim(),
    codigo: valores.codigo.trim().toUpperCase(),
    semestre: valores.semestre.trim(),
  };
}

export function validar(dados) {
  return Object.fromEntries(
    Object.entries(CAMPOS)
      .filter(([campo, regra]) => !regra.valido(dados[campo]))
      .map(([campo, regra]) => [campo, regra.mensagem]),
  );
}

// `disciplina` preenchida = edicao; a pagina troca a `key` para reiniciar o estado.
export function DisciplinaForm({ disciplina, onSalvar, onCancelar }) {
  const editando = Boolean(disciplina);
  const [valores, setValores] = useState(() =>
    editando
      ? {
          nome: disciplina.nome,
          codigo: disciplina.codigo,
          semestre: disciplina.semestre,
        }
      : VAZIO,
  );
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState("");
  const [enviando, setEnviando] = useState(false);
  const primeiroCampo = useRef(null);

  useEffect(() => {
    if (editando) primeiroCampo.current?.focus();
  }, [editando]);

  function handleChange(event) {
    const { name, value } = event.target;
    setValores((atuais) => ({ ...atuais, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (enviando) return;

    const dados = normalizar(valores);
    const novosErros = validar(dados);
    setErros(novosErros);
    setErroGeral("");
    if (Object.keys(novosErros).length > 0) return;

    setEnviando(true);
    try {
      await onSalvar(dados);
      if (!editando) setValores(VAZIO);
    } catch (erro) {
      // Mantem o que foi digitado; destaca os campos que a API recusou (422).
      setErros(
        Object.fromEntries(
          Object.keys(erro.campos ?? {})
            .filter((campo) => campo in CAMPOS)
            .map((campo) => [campo, CAMPOS[campo].mensagem]),
        ),
      );
      setErroGeral(erro.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-labelledby="titulo-form-disciplina"
      className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
    >
      <h2
        id="titulo-form-disciplina"
        className="text-lg font-semibold text-slate-900"
      >
        {editando ? "Editar disciplina" : "Nova disciplina"}
      </h2>

      {erroGeral && <Aviso tipo="erro">{erroGeral}</Aviso>}

      <div className="grid gap-4 sm:grid-cols-[2fr_1fr_1fr]">
        {Object.entries(CAMPOS).map(([campo, regra], indice) => (
          <Campo
            key={campo}
            ref={indice === 0 ? primeiroCampo : undefined}
            name={campo}
            label={regra.label}
            placeholder={regra.placeholder}
            maxLength={regra.maxLength}
            value={valores[campo]}
            onChange={handleChange}
            erro={erros[campo]}
            disabled={enviando}
            autoComplete="off"
          />
        ))}
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        {editando && (
          <Botao variante="secundario" onClick={onCancelar} disabled={enviando}>
            Cancelar edição
          </Botao>
        )}
        <Botao type="submit" disabled={enviando}>
          {enviando
            ? "Salvando..."
            : editando
              ? "Salvar alterações"
              : "Cadastrar disciplina"}
        </Botao>
      </div>
    </form>
  );
}
