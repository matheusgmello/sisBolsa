export type TipoUsuario = 'ADMIN' | 'PROFESSOR' | 'BOLSISTA';

export type LaboratorioStatus = 'Ativo' | 'Em Pausa' | 'Concluido';

export interface UsuarioAuth {
  id: string;
  nome: string;
  email: string;
  tipoUsuario: TipoUsuario;
  laboratorioId: string | null;
  fotoUrl: string | null;
  ativo: boolean;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  tipoUsuario: TipoUsuario;
  fotoUrl?: string | null;
  curso?: string | null;
  matricula?: string | null;
  cpf?: string | null;
  telefone?: string | null;
  dataNascimento?: string | null;
  laboratorioId?: string | null;
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
  laboratorioId?: string | null;
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
  id: string;
  nome: string;
  areaPesquisa: string;
  status: LaboratorioStatus;
  capacidade: number;
  coordenadorId: string | null;
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
  coordenadorId: string | null;
}

export interface Projeto {
  id: string;
  nome: string;
  descricao: string | null;
  laboratorioId: string;
  nomeLaboratorio: string;
  ativo: boolean;
  membros?: MembroProjeto[];
}

export interface ProjetoRequest {
  nome: string;
  descricao?: string | null;
  laboratorioId: string;
}

export interface MembroProjeto {
  id: string;
  nome: string;
  email: string;
  curso?: string | null;
  cargo?: string | null;
  fotoUrl?: string | null;
}

export interface Frequencia {
  id: string;
  bolsistaId: string;
  nomeBolsista: string;
  data: string;
  horasTrabalhadas: number;
  descricao: string;
  ativo: boolean;
}

export interface FrequenciaRequest {
  bolsistaId?: string | null;
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
  id: string;
  nome: string;
  capacidade: number;
  ocupacao: number;
  percentual: number;
}
