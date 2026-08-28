import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, Plus, Edit2, Trash2, Building2, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { projetoService } from '../services/projetoService';
import { laboratorioService } from '../services/laboratorioService';
import type { Projeto, ProjetoRequest, Laboratorio } from '../types';
import { Modal } from '../components/ui/Modal';

export const Projetos: React.FC = () => {
  const { canManage } = useAuth();
  const { showToast } = useToast();

  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([]);
  const [buscaNome, setBuscaNome] = useState('');
  const [filtroLab, setFiltroLab] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProjetoRequest>({
    nome: '',
    descricao: '',
    laboratorioId: '',
  });
  const [saving, setSaving] = useState(false);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [projs, labs] = await Promise.all([
        projetoService.listar({
          buscaNome: buscaNome.trim() || undefined,
          labId: filtroLab || undefined,
        }),
        laboratorioService.listar(),
      ]);
      setProjetos(projs);
      setLaboratorios(labs);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar projetos';
      showToast(msg, 'erro');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [buscaNome, filtroLab]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      nome: '',
      descricao: '',
      laboratorioId: laboratorios[0]?.id || '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (proj: Projeto) => {
    setEditingId(proj.id);
    setFormData({
      nome: proj.nome,
      descricao: proj.descricao || '',
      laboratorioId: proj.laboratorioId,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (proj: Projeto) => {
    if (!window.confirm(`Deseja realmente desativar o projeto "${proj.nome}"?`)) return;
    try {
      await projetoService.excluir(proj.id);
      showToast('Projeto desativado com sucesso!', 'sucesso');
      carregarDados();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao excluir projeto';
      showToast(msg, 'erro');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      showToast('O título do projeto é obrigatório.', 'erro');
      return;
    }
    if (!formData.laboratorioId) {
      showToast('Selecione um laboratório para o projeto.', 'erro');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await projetoService.atualizar(editingId, formData);
        showToast('Projeto atualizado com sucesso!', 'sucesso');
      } else {
        await projetoService.criar(formData);
        showToast('Projeto cadastrado com sucesso!', 'sucesso');
      }
      setIsModalOpen(false);
      carregarDados();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar projeto';
      showToast(msg, 'erro');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="header-actions">
        <div>
          <h1>Projetos de Pesquisa</h1>
          <p className="header-subtitle">
            Acompanhamento de planos de trabalho, bolsistas alocados e entregas
          </p>
        </div>
        {canManage && (
          <div className="header-buttons">
            <button type="button" className="btn-new btn-create" onClick={handleOpenCreate}>
              <Plus size={16} />
              <span>Novo Projeto</span>
            </button>
          </div>
        )}
      </div>

      <div className="container">
        <div className="search-section">
          <form
            className="search-toolbar"
            onSubmit={(e) => {
              e.preventDefault();
              carregarDados();
            }}
          >
            <div className="search-field">
              <input
                type="text"
                className="search-input"
                placeholder="Pesquisar por título ou palavra-chave..."
                value={buscaNome}
                onChange={(e) => setBuscaNome(e.target.value)}
              />
            </div>

            <div className="search-field" style={{ maxWidth: '240px' }}>
              <select
                value={filtroLab}
                onChange={(e) => setFiltroLab(e.target.value)}
              >
                <option value="">Todos os Laboratórios</option>
                {laboratorios.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nome}
                  </option>
                ))}
              </select>
            </div>

            {(buscaNome || filtroLab) && (
              <button
                type="button"
                className="reset-button"
                onClick={() => {
                  setBuscaNome('');
                  setFiltroLab('');
                }}
              >
                Limpar
              </button>
            )}
          </form>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Carregando projetos...
          </div>
        ) : projetos.length === 0 ? (
          <div className="empty-state-cell">
            <FolderKanban size={36} />
            <p>Nenhum projeto encontrado.</p>
          </div>
        ) : (
          <div className="projects-grid">
            {projetos.map((proj) => (
              <div key={proj.id} className="project-card">
                <div>
                  <div className="project-card-header">
                    <h3>
                      <Link
                        to={`/projetos/${proj.id}`}
                        style={{ color: 'var(--text-main)', textDecoration: 'none' }}
                      >
                        {proj.nome}
                      </Link>
                    </h3>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.8rem',
                      color: 'var(--primary-color)',
                      fontWeight: 600,
                      marginBottom: '10px',
                    }}
                  >
                    <Building2 size={14} />
                    <span>{proj.nomeLaboratorio}</span>
                  </div>

                  <p className="project-desc">
                    {proj.descricao || 'Sem descrição detalhada.'}
                  </p>
                </div>

                <div className="project-card-footer">
                  <Link
                    to={`/projetos/${proj.id}`}
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  >
                    <span>Ver Equipe ({proj.membros?.length || 0})</span>
                  </Link>

                  {canManage && (
                    <div className="actions-cell">
                      <button
                        type="button"
                        className="btn-icon action-link-edit"
                        onClick={() => handleOpenEdit(proj)}
                        title="Editar projeto"
                        aria-label={`Editar ${proj.nome}`}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        className="btn-icon action-link-delete"
                        onClick={() => handleDelete(proj)}
                        title="Excluir projeto"
                        aria-label={`Excluir ${proj.nome}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Criar / Editar Projeto */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Editar Projeto' : 'Cadastrar Novo Projeto'}
        icon={<FolderKanban size={20} />}
      >
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label htmlFor="proj-lab">
                Laboratório Vinculado <span className="asterisco">*</span>
              </label>
              <select
                id="proj-lab"
                required
                value={formData.laboratorioId || ''}
                onChange={(e) =>
                  setFormData({ ...formData, laboratorioId: e.target.value })
                }
              >
                <option value="">Selecione um laboratório...</option>
                {laboratorios.map((lab) => (
                  <option key={lab.id} value={lab.id}>
                    {lab.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label htmlFor="proj-titulo">
                Título do Projeto <span className="asterisco">*</span>
              </label>
              <input
                id="proj-titulo"
                type="text"
                required
                placeholder="Ex: Processamento de Linguagem Natural para Saúde"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="proj-descricao">Descrição / Resumo</label>
              <textarea
                id="proj-descricao"
                rows={4}
                placeholder="Descreva as metas e atividades científicas..."
                value={formData.descricao || ''}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              />
            </div>
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
              <span>{editingId ? 'Salvar Alterações' : 'Cadastrar Projeto'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
