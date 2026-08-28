import { api } from './api';
import type { Projeto, ProjetoRequest, MembroProjeto } from '../types';

export const projetoService = {
  listar: (filtros?: { buscaNome?: string; labId?: number | string }) =>
    api.get<Projeto[]>('/projetos', filtros),

  buscarPorId: (id: number) =>
    api.get<Projeto>(`/projetos/${id}`),

  criar: (dados: ProjetoRequest) =>
    api.post<Projeto>('/projetos', dados),

  atualizar: (id: number, dados: ProjetoRequest) =>
    api.put<Projeto>(`/projetos/${id}`, dados),

  excluir: (id: number) =>
    api.delete<void>(`/projetos/${id}`),

  listarMembros: (id: number) =>
    api.get<MembroProjeto[]>(`/projetos/${id}/membros`),

  vincularBolsista: (projetoId: number, bolsistaId: number) =>
    api.post<void>(`/projetos/${projetoId}/membros`, { bolsistaId }),

  desvincularBolsista: (projetoId: number, bolsistaId: number) =>
    api.delete<void>(`/projetos/${projetoId}/membros/${bolsistaId}`),
};
