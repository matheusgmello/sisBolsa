import { api } from './api';
import type { Laboratorio, LaboratorioRequest, Projeto, Usuario } from '../types';

export const laboratorioService = {
  listar: () =>
    api.get<Laboratorio[]>('/laboratorios'),

  buscarPorId: (id: number) =>
    api.get<Laboratorio>(`/laboratorios/${id}`),

  criar: (dados: LaboratorioRequest) =>
    api.post<Laboratorio>('/laboratorios', dados),

  atualizar: (id: number, dados: LaboratorioRequest) =>
    api.put<Laboratorio>(`/laboratorios/${id}`, dados),

  excluir: (id: number) =>
    api.delete<void>(`/laboratorios/${id}`),

  listarProjetos: (id: number) =>
    api.get<Projeto[]>(`/laboratorios/${id}/projetos`),

  listarBolsistas: (id: number) =>
    api.get<Usuario[]>(`/laboratorios/${id}/bolsistas`),
};
