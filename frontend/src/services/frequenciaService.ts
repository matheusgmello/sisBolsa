import { api } from './api';
import type { Frequencia, FrequenciaRequest, FrequenciaResumo, Paginacao } from '../types';

export const frequenciaService = {
  listar: (params?: { bolsistaId?: number | string; pagina?: number; tamanho?: number }) =>
    api.get<Paginacao<Frequencia>>('/frequencias', params),

  buscarPorId: (id: number) =>
    api.get<Frequencia>(`/frequencias/${id}`),

  criar: (dados: FrequenciaRequest) =>
    api.post<Frequencia>('/frequencias', dados),

  atualizar: (id: number, dados: FrequenciaRequest) =>
    api.put<Frequencia>(`/frequencias/${id}`, dados),

  excluir: (id: number) =>
    api.delete<void>(`/frequencias/${id}`),

  obterResumo: () =>
    api.get<FrequenciaResumo>('/frequencias/resumo'),
};
