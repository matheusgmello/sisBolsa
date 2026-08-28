import { api } from './api';
import type { UsuarioAuth } from '../types';

export const authService = {
  login: (email: string, senha: string) =>
    api.post<UsuarioAuth>('/auth/login', { email, senha }),

  logout: () =>
    api.post<void>('/auth/logout'),

  obterUsuarioAtual: () =>
    api.get<UsuarioAuth>('/auth/me'),

  atualizarPerfil: (dados: {
    nome: string;
    email: string;
    fotoUrl?: string | null;
    senhaAtual?: string;
    senha?: string;
    confirmaSenha?: string;
  }) => api.put<UsuarioAuth>('/auth/perfil', dados),
};
