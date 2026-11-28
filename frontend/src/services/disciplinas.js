import { request } from "./api";

const PATH = "/disciplinas/";

export const listDisciplinas = () => request(PATH);

export const getDisciplina = (id) => request(`${PATH}${id}`);

export const createDisciplina = (dados) =>
  request(PATH, { method: "POST", body: dados });

export const updateDisciplina = (id, dados) =>
  request(`${PATH}${id}`, { method: "PUT", body: dados });

export const deleteDisciplina = (id) =>
  request(`${PATH}${id}`, { method: "DELETE" });
