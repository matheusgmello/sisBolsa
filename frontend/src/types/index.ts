export type TipoUsuario = 'ADMIN' | 'PROFESSOR' | 'BOLSISTA';

export type LaboratorioStatus = 'Ativo' | 'Em Pausa' | 'Concluido';

export interface UsuarioAuth {
  id: number;
  nome: string;
  email: string;
  tipoUsuario: TipoUsuario;
  laboratorioId: number | null;
  fotoUrl: string | null;
  ativo: boolean;
}

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  tipoUsuario: TipoUsuario;
  fotoUrl?: string | null;
  curso?: string | null;
  matricula?: string | null;
  cpf?: string | null;
  telefone?: string | null;
  dataNascimento?: string | null;
  laboratorioId?: number | null;
  nomeLaboratorio?: string | null;
  cargo?: string | null;
  ativo: boolean;
}

export interface UsuarioRequest {
  nome: string;
  email: string;
  senha?: string | null;
  tipoUsuario: TipoUsuario;
  fotoUrl?: string | null;
  dataNascimento?: string | null;
  curso?: string | null;
  matricula?: string | null;
  cpf?: string | null;
  telefone?: string | null;
  laboratorioId?: number | null;
  cargo?: string | null;
}

export interface CargoOption {
  valor: string;
  descricao: string;
}

export interface Paginacao<T> {
  itens: T[];
  totalItens: number;
  pagina: number;
  totalPaginas: number;
}

export interface Laboratorio {
  id: number;
  nome: string;
  areaPesquisa: string;
  status: LaboratorioStatus;
  capacidade: number;
  coordenadorId: number | null;
  coordenador: string | null;
  totalBolsistas: number;
  ativo: boolean;
  projetos?: Projeto[];
}

export interface LaboratorioRequest {
  nome: string;
  areaPesquisa: string;
  status: LaboratorioStatus;
  capacidade: number;
  coordenadorId: number | null;
}

export interface Projeto {
  id: number;
  nome: string;
  descricao: string | null;
  laboratorioId: number;
  nomeLaboratorio: string;
  ativo: boolean;
  membros?: MembroProjeto[];
}

export interface ProjetoRequest {
  nome: string;
  descricao?: string | null;
  laboratorioId: number;
}

export interface MembroProjeto {
  id: number;
  nome: string;
  email: string;
  curso?: string | null;
  cargo?: string | null;
  fotoUrl?: string | null;
}

export interface Frequencia {
  id: number;
  bolsistaId: number;
  nomeBolsista: string;
  data: string;
  horasTrabalhadas: number;
  descricao: string;
  ativo: boolean;
}

export interface FrequenciaRequest {
  bolsistaId?: number | null;
  data: string;
  horasTrabalhadas: number;
  descricao: string;
}

export interface FrequenciaResumo {
  horasMes: number;
  horasTotal: number;
}

export interface DashboardMetricas {
  totalBolsistas: number;
  totalLaboratorios: number;
  totalProjetos: number;
  totalHorasMes: number;
}

export interface RelatorioItem {
  id: number;
  nome: string;
  capacidade: number;
  ocupacao: number;
  percentual: number;
}
