import React, { useEffect, useState } from 'react';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Download,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { usuarioService } from '../services/usuarioService';
import { laboratorioService } from '../services/laboratorioService';
import type {
  Usuario,
  UsuarioRequest,
  TipoUsuario,
  Laboratorio,
  CargoOption,
  Paginacao,
} from '../types';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';

export const Usuarios: React.FC = () => {
  const { user, isAdmin, canManage } = useAuth();
  const { showToast } = useToast();

  const [paginacao, setPaginacao] = useState<Paginacao<Usuario>>({
    itens: [],
    totalItens: 0,
    pagina: 1,
    totalPaginas: 1,
  });

  const [filtroTipo, setFiltroTipo] = useState<string>('');
  const [buscaNome, setBuscaNome] = useState('');
  const [buscaCurso, setBuscaCurso] = useState('');
  const [pagina, setPagina] = useState(1);
  const [loading, setLoading] = useState(true);

  // Aux lists for modal
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([]);
  const [cargos, setCargos] = useState<CargoOption[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<UsuarioRequest>({
    nome: '',
    email: '',
    senha: '',
    tipoUsuario: 'BOLSISTA',
    fotoUrl: '',
    dataNascimento: '',
    curso: '',
    matricula: '',
    cpf: '',
    telefone: '',
    laboratorioId: null,
    cargo: '',
  });
  const [saving, setSaving] = useState(false);

  const carregarUsuarios = async (pag = pagina) => {
    setLoading(true);
    try {
      const dados = await usuarioService.listar({
        tipo: filtroTipo || undefined,
        buscaNome: buscaNome.trim() || undefined,
        buscaCurso: buscaCurso.trim() || undefined,
        pagina: pag,
      });
      setPaginacao(dados);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar usuários';
      showToast(msg, 'erro');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function loadAux() {
      try {
        const [labs, cargs] = await Promise.all([
          laboratorioService.listar().catch(() => []),
          usuarioService.listarCargos().catch(() => []),
        ]);
        setLaboratorios(labs);
        setCargos(cargs);
      } catch {
        // ignore
      }
    }
    loadAux();
  }, []);

  useEffect(() => {
    setPagina(1);
    carregarUsuarios(1);
  }, [filtroTipo]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setShowPassword(false);
    setFormData({
      nome: '',
      email: '',
      senha: '',
      tipoUsuario: 'BOLSISTA',
      fotoUrl: '',
      dataNascimento: '',
      curso: '',
      matricula: '',
      cpf: '',
      telefone: '',
      laboratorioId: laboratorios[0]?.id || null,
      cargo: cargos[0]?.valor || '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (u: Usuario) => {
    setEditingId(u.id);
    setShowPassword(false);
    try {
      const detalhes = await usuarioService.buscarPorId(u.id, u.tipoUsuario);
      setFormData({
        nome: detalhes.nome,
        email: detalhes.email,
        senha: '',
        tipoUsuario: detalhes.tipoUsuario,
        fotoUrl: detalhes.fotoUrl || '',
        dataNascimento: detalhes.dataNascimento || '',
        curso: detalhes.curso || '',
        matricula: detalhes.matricula || '',
        cpf: detalhes.cpf || '',
        telefone: detalhes.telefone || '',
        laboratorioId: detalhes.laboratorioId || null,
        cargo: detalhes.cargo || '',
      });
      setIsModalOpen(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar dados do usuário';
      showToast(msg, 'erro');
    }
  };

  const handleDelete = async (u: Usuario) => {
    if (!window.confirm(`Deseja realmente desativar o usuário "${u.nome}"?`)) return;
    try {
      await usuarioService.excluir(u.id, u.tipoUsuario);
      showToast('Usuário desativado com sucesso!', 'sucesso');
      carregarUsuarios(pagina);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao excluir usuário';
      showToast(msg, 'erro');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome || formData.nome.length < 3) {
      showToast('O nome deve ter pelo menos 3 caracteres.', 'erro');
      return;
    }

    if (!editingId && (!formData.senha || formData.senha.length < 6)) {
      showToast('A senha inicial deve ter pelo menos 6 caracteres.', 'erro');
      return;
    }

    if (editingId && formData.senha && formData.senha.length < 6) {
      showToast('A nova senha deve ter pelo menos 6 caracteres.', 'erro');
      return;
    }

    const ehProf = formData.tipoUsuario === 'PROFESSOR';
    const ehAdm = formData.tipoUsuario === 'ADMIN';

    const payload: UsuarioRequest = {
      ...formData,
      senha: formData.senha ? formData.senha : null,
      fotoUrl: formData.fotoUrl ? formData.fotoUrl : null,
      dataNascimento: ehProf || ehAdm ? null : formData.dataNascimento || null,
      curso: ehProf || ehAdm ? null : formData.curso || null,
      matricula: ehProf || ehAdm ? null : formData.matricula || null,
      cpf: ehProf || ehAdm ? null : formData.cpf || null,
      telefone: ehProf || ehAdm ? null : formData.telefone || null,
      laboratorioId: ehProf || ehAdm || !formData.laboratorioId ? null : Number(formData.laboratorioId),
      cargo: ehProf || ehAdm ? null : formData.cargo || null,
    };

    setSaving(true);
    try {
      if (editingId) {
        await usuarioService.atualizar(editingId, payload);
        showToast('Usuário atualizado com sucesso!', 'sucesso');
      } else {
        await usuarioService.criar(payload);
        showToast('Usuário cadastrado com sucesso!', 'sucesso');
      }
      setIsModalOpen(false);
      carregarUsuarios(pagina);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar usuário';
      showToast(msg, 'erro');
    } finally {
      setSaving(false);
    }
  };

  const rotulo = isAdmin ? 'Usuário' : 'Bolsista';

  return (
    <div>
      <div className="header-actions">
        <div>
          <h1>Gerenciar {rotulo}s</h1>
          <p className="header-subtitle">
            Cadastro e controle de acesso de bolsistas, professores e administradores
          </p>
        </div>
        <div className="header-buttons">
          <a
            href="/api/usuarios/exportar"
            className="btn-new btn-export"
            target="_blank"
            rel="noreferrer"
          >
            <Download size={16} />
            <span>Exportar CSV</span>
          </a>
          <button
            type="button"
            className="btn-new btn-create"
            onClick={handleOpenCreate}
          >
            <Plus size={16} />
            <span>Novo {rotulo}</span>
          </button>
        </div>
      </div>

      <div className="container">
        {/* Search Toolbar */}
        <div className="search-section">
          <form
            className="search-toolbar"
            onSubmit={(e) => {
              e.preventDefault();
              setPagina(1);
              carregarUsuarios(1);
            }}
          >
            <div className="search-field">
              <input
                type="text"
                className="search-input"
                placeholder="Pesquisar por nome..."
                value={buscaNome}
                onChange={(e) => setBuscaNome(e.target.value)}
              />
            </div>

            <div className="search-field">
              <input
                type="text"
                className="search-input"
                placeholder="Filtrar por curso..."
                value={buscaCurso}
                onChange={(e) => setBuscaCurso(e.target.value)}
              />
            </div>

            <button type="submit" className="search-button">
              Buscar
            </button>

            {(buscaNome || buscaCurso) && (
              <button
                type="button"
                className="reset-button"
                onClick={() => {
                  setBuscaNome('');
                  setBuscaCurso('');
                  setPagina(1);
                  carregarUsuarios(1);
                }}
              >
                Limpar
              </button>
            )}
          </form>
        </div>

        {/* Filter Pills */}
        {isAdmin && (
          <div className="filter-pills">
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Tipo:
            </span>
            <button
              type="button"
              className={`pill-btn ${filtroTipo === '' ? 'active' : ''}`}
              onClick={() => setFiltroTipo('')}
            >
              Todos
            </button>
            <button
              type="button"
              className={`pill-btn ${filtroTipo === 'BOLSISTA' ? 'active' : ''}`}
              onClick={() => setFiltroTipo('BOLSISTA')}
            >
              Bolsistas
            </button>
            <button
              type="button"
              className={`pill-btn ${filtroTipo === 'PROFESSOR' ? 'active' : ''}`}
              onClick={() => setFiltroTipo('PROFESSOR')}
            >
              Professores
            </button>
            <button
              type="button"
              className={`pill-btn ${filtroTipo === 'ADMIN' ? 'active' : ''}`}
              onClick={() => setFiltroTipo('ADMIN')}
            >
              Administradores
            </button>
          </div>
        )}

        {/* Table */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Curso</th>
                <th>Cargo</th>
                <th>Laboratório</th>
                <th>Tipo</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Carregando usuários...
                  </td>
                </tr>
              ) : paginacao.itens.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-state-cell">
                    Nenhum usuário encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                paginacao.itens.map((u) => {
                  const podeEditar = canManage || u.id === user?.id;
                  const podeExcluir = canManage && u.id !== user?.id;

                  return (
                    <tr key={u.id}>
                      <td>
                        <strong>{u.nome}</strong>
                      </td>
                      <td>{u.curso || '---'}</td>
                      <td>
                        {u.cargo ? (
                          <span className="count-badge count-badge-purple">{u.cargo}</span>
                        ) : (
                          '---'
                        )}
                      </td>
                      <td>{u.nomeLaboratorio || '---'}</td>
                      <td>
                        <Badge type="role" value={u.tipoUsuario} />
                      </td>
                      <td>
                        <div className="actions-cell">
                          {podeEditar && (
                            <button
                              type="button"
                              className="btn-icon action-link-edit"
                              onClick={() => handleOpenEdit(u)}
                              title="Editar usuário"
                              aria-label={`Editar ${u.nome}`}
                            >
                              <Edit2 size={16} />
                            </button>
                          )}
                          {podeExcluir && (
                            <button
                              type="button"
                              className="btn-icon action-link-delete"
                              onClick={() => handleDelete(u)}
                              title="Excluir usuário"
                              aria-label={`Excluir ${u.nome}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          page={paginacao.pagina}
          totalPages={paginacao.totalPaginas}
          onPageChange={(novaPag) => {
            setPagina(novaPag);
            carregarUsuarios(novaPag);
          }}
        />
      </div>

      {/* Modal Criar / Editar Usuário */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? `Editar Usuário — ${formData.nome}` : `Cadastrar Novo ${rotulo}`}
        icon={<Users size={20} />}
        maxWidth="640px"
      >
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: 'calc(85vh - 140px)', overflowY: 'auto' }}>
            {isAdmin && (
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label htmlFor="user-tipo">
                  Tipo de Usuário <span className="asterisco">*</span>
                </label>
                <select
                  id="user-tipo"
                  value={formData.tipoUsuario}
                  onChange={(e) =>
                    setFormData({ ...formData, tipoUsuario: e.target.value as TipoUsuario })
                  }
                >
                  <option value="BOLSISTA">Bolsista</option>
                  <option value="PROFESSOR">Professor</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div className="form-group">
                <label htmlFor="user-nome">
                  Nome Completo <span className="asterisco">*</span>
                </label>
                <input
                  id="user-nome"
                  type="text"
                  required
                  minLength={3}
                  placeholder="Ex: Ana Clara Silva"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="user-email">
                  E-mail <span className="asterisco">*</span>
                </label>
                <input
                  id="user-email"
                  type="email"
                  required
                  placeholder="Ex: ana.silva@sisbolsa.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div className="form-group">
                <label htmlFor="user-senha">
                  Senha {!editingId && <span className="asterisco">*</span>}
                </label>
                <div className="password-field-wrapper">
                  <input
                    id="user-senha"
                    type={showPassword ? 'text' : 'password'}
                    required={!editingId}
                    minLength={6}
                    placeholder={editingId ? 'Deixar em branco para não alterar' : 'Mínimo 6 caracteres'}
                    value={formData.senha || ''}
                    onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="user-foto">URL da Foto de Perfil</label>
                <input
                  id="user-foto"
                  type="url"
                  placeholder="https://exemplo.com/foto.jpg"
                  value={formData.fotoUrl || ''}
                  onChange={(e) => setFormData({ ...formData, fotoUrl: e.target.value })}
                />
              </div>
            </div>

            {formData.tipoUsuario === 'BOLSISTA' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  {isAdmin && (
                    <div className="form-group">
                      <label htmlFor="user-lab">
                        Laboratório <span className="asterisco">*</span>
                      </label>
                      <select
                        id="user-lab"
                        required
                        value={formData.laboratorioId || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            laboratorioId: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                      >
                        <option value="">Selecione um laboratório...</option>
                        {laboratorios.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="user-cargo">Cargo no Laboratório</label>
                    <select
                      id="user-cargo"
                      value={formData.cargo || ''}
                      onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                    >
                      <option value="">Selecione um cargo...</option>
                      {cargos.map((c) => (
                        <option key={c.valor} value={c.valor}>
                          {c.descricao}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div className="form-group">
                    <label htmlFor="user-curso">Curso de Graduação</label>
                    <input
                      id="user-curso"
                      type="text"
                      placeholder="Ex: Engenharia de Software"
                      value={formData.curso || ''}
                      onChange={(e) => setFormData({ ...formData, curso: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="user-matricula">Matrícula Acadêmica</label>
                    <input
                      id="user-matricula"
                      type="text"
                      placeholder="Ex: 202410123"
                      value={formData.matricula || ''}
                      onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div className="form-group">
                    <label htmlFor="user-cpf">CPF</label>
                    <input
                      id="user-cpf"
                      type="text"
                      placeholder="000.000.000-00"
                      value={formData.cpf || ''}
                      onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="user-tel">Telefone / WhatsApp</label>
                    <input
                      id="user-tel"
                      type="tel"
                      placeholder="(00) 00000-0000"
                      value={formData.telefone || ''}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="user-nasc">Data de Nascimento</label>
                  <input
                    id="user-nasc"
                    type="date"
                    value={formData.dataNascimento || ''}
                    onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-cancel"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-submit" disabled={saving}>
              {saving ? <Loader2 size={16} className="spin" /> : null}
              <span>{editingId ? 'Salvar Alterações' : `Cadastrar ${rotulo}`}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
