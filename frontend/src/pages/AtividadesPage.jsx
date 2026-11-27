import { useCallback, useEffect, useRef, useState } from "react";
import {
  AtividadeFilters,
  FILTROS_VAZIOS,
} from "../components/atividades/AtividadeFilters";
import { AtividadeForm } from "../components/atividades/AtividadeForm";
import { AtividadeList } from "../components/atividades/AtividadeList";
import { Aviso } from "../components/ui/Aviso";
import { Botao } from "../components/ui/Botao";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import {
  createAtividade,
  deleteAtividade,
  formatarData,
  getAtividade,
  listAtividadesComAtraso,
  updateAtividade,
} from "../services/atividades";
import { listDisciplinas } from "../services/disciplinas";

export function AtividadesPage({ onIrParaDisciplinas }) {
  const [disciplinas, setDisciplinas] = useState([]);
  const [atividades, setAtividades] = useState([]);
  const [filtros, setFiltros] = useState(FILTROS_VAZIOS);
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState("");
  const [editando, setEditando] = useState(null);
  const [aExcluir, setAExcluir] = useState(null);
  const [excluindo, setExcluindo] = useState(false);
  const [aviso, setAviso] = useState(null);
  const ultimaBusca = useRef(0);

  // Disciplinas alimentam o select do formulario, os filtros e o nome em cada item.
  const carregar = useCallback(async () => {
    const busca = ++ultimaBusca.current;
    setCarregando(true);
    setErroLista("");
    try {
      const [novasDisciplinas, novasAtividades] = await Promise.all([
        listDisciplinas(),
        listAtividadesComAtraso(filtros),
      ]);
      // Filtros trocados rapido: so a resposta da busca mais recente vale.
      if (busca !== ultimaBusca.current) return;
      setDisciplinas(novasDisciplinas);
      setAtividades(novasAtividades);
    } catch (erro) {
      if (busca === ultimaBusca.current) setErroLista(erro.message);
    } finally {
      if (busca === ultimaBusca.current) setCarregando(false);
    }
  }, [filtros]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Erros sobem para o formulario, que os exibe e mantem os dados digitados.
  async function salvar(dados) {
    setAviso(null);
    if (editando) {
      await updateAtividade(editando.id, dados);
      setEditando(null);
      setAviso({
        tipo: "sucesso",
        texto: `Atividade "${dados.titulo}" atualizada.`,
      });
    } else {
      await createAtividade(dados);
      setAviso({
        tipo: "sucesso",
        texto: `Atividade "${dados.titulo}" cadastrada.`,
      });
    }
    await carregar();
  }

  // Busca a versao atual no banco: a lista pode estar desatualizada.
  async function editar(atividade) {
    setAviso(null);
    try {
      setEditando(await getAtividade(atividade.id));
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
      await deleteAtividade(alvo.id);
      if (editando?.id === alvo.id) setEditando(null);
      setAviso({
        tipo: "sucesso",
        texto: `Atividade "${alvo.titulo}" excluída.`,
      });
      await carregar();
    } catch (erro) {
      setAviso({ tipo: "erro", texto: erro.message });
      if (erro.status === 404) await carregar();
    } finally {
      setExcluindo(false);
      setAExcluir(null);
    }
  }

  const filtrando = Object.values(filtros).some((v) => v !== "");

  return (
    <section
      aria-labelledby="titulo-atividades"
      className="flex flex-col gap-6"
    >
      <div>
        <h2
          id="titulo-atividades"
          className="text-2xl font-bold text-slate-900"
        >
          Atividades
        </h2>
        <p className="text-slate-600">
          Acompanhe trabalhos, provas e entregas de cada disciplina.
        </p>
      </div>

      {aviso && (
        <Aviso tipo={aviso.tipo} onFechar={() => setAviso(null)}>
          {aviso.texto}
        </Aviso>
      )}

      {/* Sem as disciplinas carregadas o formulario nao sabe se ha alguma. */}
      {!(carregando && disciplinas.length === 0) && !erroLista && (
        <AtividadeForm
          key={editando ? `editar-${editando.id}` : "nova"}
          atividade={editando}
          disciplinas={disciplinas}
          onSalvar={salvar}
          onCancelar={() => setEditando(null)}
          onIrParaDisciplinas={onIrParaDisciplinas}
        />
      )}

      <AtividadeFilters
        filtros={filtros}
        disciplinas={disciplinas}
        onChange={setFiltros}
      />

      <div aria-live="polite" aria-busy={carregando}>
        {carregando ? (
          <p className="rounded-lg border border-slate-200 bg-white p-6 text-center text-slate-500">
            Carregando atividades...
          </p>
        ) : erroLista ? (
          <div className="flex flex-col items-start gap-3">
            <Aviso tipo="erro">{erroLista}</Aviso>
            <Botao variante="secundario" onClick={carregar}>
              Tentar novamente
            </Botao>
          </div>
        ) : atividades.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500">
            {filtrando
              ? "Nenhuma atividade corresponde aos filtros selecionados."
              : "Nenhuma atividade cadastrada ainda."}
          </p>
        ) : (
          <AtividadeList
            atividades={atividades}
            disciplinas={disciplinas}
            onEditar={editar}
            onExcluir={setAExcluir}
          />
        )}
      </div>

      {aExcluir && (
        <ConfirmDialog
          titulo="Excluir atividade?"
          rotuloConfirmar="Excluir"
          processando={excluindo}
          onConfirmar={confirmarExclusao}
          onCancelar={() => setAExcluir(null)}
        >
          <p>
            A atividade <strong>{aExcluir.titulo}</strong> (entrega em{" "}
            {formatarData(aExcluir.data_entrega)}) será excluída
            permanentemente.
          </p>
        </ConfirmDialog>
      )}
    </section>
  );
}
