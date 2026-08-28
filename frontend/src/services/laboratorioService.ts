import { api } from './api';
import type { Laboratorio, LaboratorioRequest, Projeto, Usuario } from '../types';

export const laboratorioService = {
  listar: () =>
    api.get<Laboratorio[]>('/laboratorios'),

  buscarPorId: (id: string) =>
    api.get<Laboratorio>(`/laboratorios/${id}`),

  criar: (dados: LaboratorioRequest) =>
    api.post<Laboratorio>('/laboratorios', dados),

  atualizar: (id: string, dados: LaboratorioRequest) =>
    api.put<Laboratorio>(`/laboratorios/${id}`, dados),

  excluir: (id: string) =>
    api.delete<void>(`/laboratorios/${id}`),

  listarProjetos: (id: string) =>
    api.get<Projeto[]>(`/laboratorios/${id}/projetos`),

  listarBolsistas: (id: string) =>
    api.get<Usuario[]>(`/laboratorios/${id}/bolsistas`),
};
