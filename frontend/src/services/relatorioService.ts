import { api } from './api';

export interface ResumoAdmin {
  totalBolsistas: number;
  totalLaboratorios: number;
  totalProjetos: number;
}

export interface OcupacaoLab {
  id: number;
  nome: string;
  capacidade: number;
  ocupacao: number;
  percentual: number;
}

export interface HorasBolsistaMes {
  bolsistaNome: string;
  totalHoras: number;
}

export interface ProjetosPorLab {
  laboratorioNome: string;
  totalProjetos: number;
}

export interface BolsistasPorCargo {
  cargo: string;
  total: number;
}

export const relatorioService = {
  obterResumo: () =>
    api.get<ResumoAdmin>('/relatorios/resumo'),

  obterOcupacao: () =>
    api.get<OcupacaoLab[]>('/relatorios/ocupacao'),

  obterHorasMes: () =>
    api.get<HorasBolsistaMes[]>('/relatorios/horas-mes'),

  obterProjetosPorLab: () =>
    api.get<ProjetosPorLab[]>('/relatorios/projetos-por-laboratorio'),

  obterBolsistasPorCargo: () =>
    api.get<BolsistasPorCargo[]>('/relatorios/bolsistas-por-cargo'),
};
