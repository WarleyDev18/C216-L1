import { useCallback, useEffect, useState } from "react";
import { DisciplinaForm } from "../components/disciplinas/DisciplinaForm";
import { DisciplinaList } from "../components/disciplinas/DisciplinaList";
import { Aviso } from "../components/ui/Aviso";
import { Botao } from "../components/ui/Botao";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import {
  createDisciplina,
  deleteDisciplina,
  getDisciplina,
  listDisciplinas,
  updateDisciplina,
} from "../services/disciplinas";

export function DisciplinasPage() {
  const [disciplinas, setDisciplinas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState("");
  const [editando, setEditando] = useState(null);
  const [aExcluir, setAExcluir] = useState(null);
  const [excluindo, setExcluindo] = useState(false);
  const [aviso, setAviso] = useState(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErroLista("");
    try {
      setDisciplinas(await listDisciplinas());
    } catch (erro) {
      setErroLista(erro.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Erros sobem para o formulario, que os exibe e mantem os dados digitados.
  async function salvar(dados) {
    setAviso(null);
    if (editando) {
      await updateDisciplina(editando.id, dados);
      setEditando(null);
      setAviso({
        tipo: "sucesso",
        texto: `Disciplina "${dados.nome}" atualizada.`,
      });
    } else {
      await createDisciplina(dados);
      setAviso({
        tipo: "sucesso",
        texto: `Disciplina "${dados.nome}" cadastrada.`,
      });
    }
    await carregar();
  }

  // Busca a versao atual no banco: a lista pode estar desatualizada.
  async function editar(disciplina) {
    setAviso(null);
    try {
      setEditando(await getDisciplina(disciplina.id));
    } catch (erro) {
      setAviso({ tipo: "erro", texto: erro.message });
      if (erro.status === 404) await carregar();
    }
  }

  async function confirmarExclusao() {
    const alvo = aExcluir;
    setExcluindo(true);
    setAviso(null);
    try {
      await deleteDisciplina(alvo.id);
      if (editando?.id === alvo.id) setEditando(null);
      setAviso({
        tipo: "sucesso",
        texto: `Disciplina "${alvo.nome}" excluída.`,
      });
      await carregar();
    } catch (erro) {
      // 409: a disciplina tem atividades; a mensagem do backend explica o motivo.
      setAviso({ tipo: "erro", texto: erro.message });
      if (erro.status === 404) await carregar();
    } finally {
      setExcluindo(false);
      setAExcluir(null);
    }
  }

  return (
    <section
      aria-labelledby="titulo-disciplinas"
      className="flex flex-col gap-6"
    >
      <div>
        <h2
          id="titulo-disciplinas"
          className="text-2xl font-bold text-slate-900"
        >
          Disciplinas
        </h2>
        <p className="text-slate-600">
          Cadastre as disciplinas do semestre para organizar suas atividades.
        </p>
      </div>

      {aviso && (
        <Aviso tipo={aviso.tipo} onFechar={() => setAviso(null)}>
          {aviso.texto}
        </Aviso>
      )}

      <DisciplinaForm
        key={editando ? `editar-${editando.id}` : "nova"}
        disciplina={editando}
        onSalvar={salvar}
        onCancelar={() => setEditando(null)}
      />

      <div aria-live="polite" aria-busy={carregando}>
        {carregando ? (
          <p className="rounded-lg border border-slate-200 bg-white p-6 text-center text-slate-500">
            Carregando disciplinas...
          </p>
        ) : erroLista ? (
          <div className="flex flex-col items-start gap-3">
            <Aviso tipo="erro">{erroLista}</Aviso>
            <Botao variante="secundario" onClick={carregar}>
              Tentar novamente
            </Botao>
          </div>
        ) : disciplinas.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500">
            Nenhuma disciplina cadastrada ainda. Use o formulário acima para
            começar.
          </p>
        ) : (
          <DisciplinaList
            disciplinas={disciplinas}
            onEditar={editar}
            onExcluir={setAExcluir}
          />
        )}
      </div>

      {aExcluir && (
        <ConfirmDialog
          titulo="Excluir disciplina?"
          rotuloConfirmar="Excluir"
          processando={excluindo}
          onConfirmar={confirmarExclusao}
          onCancelar={() => setAExcluir(null)}
        >
          <p>
            A disciplina <strong>{aExcluir.nome}</strong> ({aExcluir.codigo} —{" "}
            {aExcluir.semestre}) será excluída permanentemente.
          </p>
        </ConfirmDialog>
      )}
    </section>
  );
}
