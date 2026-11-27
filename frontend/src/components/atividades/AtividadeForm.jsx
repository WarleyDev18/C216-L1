import { useEffect, useRef, useState } from "react";
import { PRIORIDADES, STATUS } from "../../services/atividades";
import { Aviso } from "../ui/Aviso";
import { Botao } from "../ui/Botao";
import { Campo } from "../ui/Campo";

const VAZIO = {
  titulo: "",
  descricao: "",
  disciplina_id: "",
  data_entrega: "",
  prioridade: "media",
  status: "pendente",
};

// Espelha backend/src/app/schemas/atividade.py (o backend da a palavra final).
const MENSAGENS = {
  titulo: "Informe o título (até 200 caracteres).",
  descricao: "A descrição pode ter até 2000 caracteres.",
  disciplina_id: "Selecione a disciplina da atividade.",
  data_entrega: "Informe uma data de entrega válida.",
  prioridade: "Selecione uma prioridade válida.",
  status: "Selecione um status válido.",
};

const valoresDe = (opcoes) => opcoes.map((o) => o.valor);

export function normalizar(valores) {
  const descricao = valores.descricao.trim();
  return {
    titulo: valores.titulo.trim(),
    descricao: descricao === "" ? null : descricao,
    disciplina_id: Number(valores.disciplina_id),
    // <input type="date"> ja entrega "AAAA-MM-DD", o formato da API: nada de Date/fuso.
    data_entrega: valores.data_entrega,
    prioridade: valores.prioridade,
    status: valores.status,
  };
}

export function validar(dados, disciplinas) {
  const regras = {
    titulo: dados.titulo.length >= 1 && dados.titulo.length <= 200,
    descricao: (dados.descricao ?? "").length <= 2000,
    disciplina_id: disciplinas.some((d) => d.id === dados.disciplina_id),
    data_entrega: /^\d{4}-\d{2}-\d{2}$/.test(dados.data_entrega),
    prioridade: valoresDe(PRIORIDADES).includes(dados.prioridade),
    status: valoresDe(STATUS).includes(dados.status),
  };
  return Object.fromEntries(
    Object.entries(regras)
      .filter(([, ok]) => !ok)
      .map(([campo]) => [campo, MENSAGENS[campo]]),
  );
}

// `atividade` preenchida = edicao; a pagina troca a `key` para reiniciar o estado.
export function AtividadeForm({
  atividade,
  disciplinas,
  onSalvar,
  onCancelar,
  onIrParaDisciplinas,
}) {
  const editando = Boolean(atividade);
  const [valores, setValores] = useState(() =>
    editando
      ? {
          ...VAZIO,
          ...atividade,
          descricao: atividade.descricao ?? "",
          disciplina_id: String(atividade.disciplina_id),
        }
      : VAZIO,
  );
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState("");
  const [enviando, setEnviando] = useState(false);
  const primeiroCampo = useRef(null);
  const semDisciplinas = disciplinas.length === 0;

  useEffect(() => {
    if (editando) primeiroCampo.current?.focus();
  }, [editando]);

  function handleChange(event) {
    const { name, value } = event.target;
    setValores((atuais) => ({ ...atuais, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (enviando || semDisciplinas) return;

    const dados = normalizar(valores);
    const novosErros = validar(dados, disciplinas);
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
            .filter((campo) => campo in MENSAGENS)
            .map((campo) => [campo, MENSAGENS[campo]]),
        ),
      );
      setErroGeral(erro.message);
    } finally {
      setEnviando(false);
    }
  }

  const campo = (nome) => ({
    name: nome,
    value: valores[nome],
    onChange: handleChange,
    erro: erros[nome],
    disabled: enviando || semDisciplinas,
  });

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-labelledby="titulo-form-atividade"
      className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
    >
      <h2
        id="titulo-form-atividade"
        className="text-lg font-semibold text-slate-900"
      >
        {editando ? "Editar atividade" : "Nova atividade"}
      </h2>

      {semDisciplinas && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          <p>
            Toda atividade pertence a uma disciplina. Cadastre uma disciplina
            primeiro.
          </p>
          {onIrParaDisciplinas && (
            <Botao variante="secundario" onClick={onIrParaDisciplinas}>
              Ir para Disciplinas
            </Botao>
          )}
        </div>
      )}

      {erroGeral && <Aviso tipo="erro">{erroGeral}</Aviso>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Campo
          {...campo("titulo")}
          ref={primeiroCampo}
          label="Título"
          placeholder="Trabalho final"
          maxLength={200}
          autoComplete="off"
          className="sm:col-span-2"
        />
        <Campo
          as="select"
          {...campo("disciplina_id")}
          label="Disciplina"
          className="sm:col-span-2"
        >
          <option value="">Selecione uma disciplina</option>
          {disciplinas.map((d) => (
            <option key={d.id} value={d.id}>
              {d.codigo} — {d.nome} ({d.semestre})
            </option>
          ))}
        </Campo>
        <Campo type="date" {...campo("data_entrega")} label="Data de entrega" />
        <Campo as="select" {...campo("prioridade")} label="Prioridade">
          {PRIORIDADES.map((p) => (
            <option key={p.valor} value={p.valor}>
              {p.rotulo}
            </option>
          ))}
        </Campo>
        <Campo as="select" {...campo("status")} label="Status">
          {STATUS.map((s) => (
            <option key={s.valor} value={s.valor}>
              {s.rotulo}
            </option>
          ))}
        </Campo>
        <Campo
          as="textarea"
          {...campo("descricao")}
          label="Descrição (opcional)"
          placeholder="Detalhes, links ou orientações"
          maxLength={2000}
          rows={3}
          className="sm:col-span-2 lg:col-span-4"
        />
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        {editando && (
          <Botao variante="secundario" onClick={onCancelar} disabled={enviando}>
            Cancelar edição
          </Botao>
        )}
        <Botao type="submit" disabled={enviando || semDisciplinas}>
          {enviando
            ? "Salvando..."
            : editando
              ? "Salvar alterações"
              : "Cadastrar atividade"}
        </Botao>
      </div>
    </form>
  );
}
