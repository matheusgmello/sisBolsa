import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  FolderKanban,
  Users,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { laboratorioService } from '../services/laboratorioService';
import { projetoService } from '../services/projetoService';
import { frequenciaService } from '../services/frequenciaService';
import type { Laboratorio, Projeto, FrequenciaResumo } from '../types';
import { Badge } from '../components/ui/Badge';

export const Dashboard: React.FC = () => {
  const { user, isAdmin, isProfessor, isBolsista } = useAuth();

  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [resumoHoras, setResumoHoras] = useState<FrequenciaResumo>({ horasMes: 0, horasTotal: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarDados() {
      setLoading(true);
      try {
        const [labsData, projData, resumoData] = await Promise.all([
          laboratorioService.listar().catch(() => []),
          projetoService.listar().catch(() => []),
          frequenciaService.obterResumo().catch(() => ({ horasMes: 0, horasTotal: 0 })),
        ]);

        setLaboratorios(labsData);
        setProjetos(projData);
        setResumoHoras(resumoData);
      } finally {
        setLoading(false);
      }
    }

    carregarDados();
  }, [user]);

  const totalBolsistas = laboratorios.reduce((acc, l) => acc + (l.totalBolsistas || 0), 0);

  return (
    <div>
      <div className="header-actions">
        <div>
          <h1>Olá, {user?.nome?.split(' ')[0]}!</h1>
          <p className="header-subtitle">
            {isBolsista
              ? 'Acompanhe seu laboratório, projetos vinculados e registre suas horas de pesquisa.'
              : 'Painel de controle e acompanhamento de laboratórios, projetos e bolsistas.'}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Laboratórios Ativos</h3>
          <div className="value">{loading ? '...' : laboratorios.length}</div>
          <p className="stat-desc">
            <Building2 size={14} />
            <span>Unidades de pesquisa</span>
          </p>
        </div>

        <div className="stat-card">
          <h3>Projetos em Andamento</h3>
          <div className="value">{loading ? '...' : projetos.length}</div>
          <p className="stat-desc">
            <FolderKanban size={14} />
            <span>Iniciativas ativas</span>
          </p>
        </div>

        <div className="stat-card">
          <h3>Total de Bolsistas</h3>
          <div className="value">{loading ? '...' : totalBolsistas}</div>
          <p className="stat-desc">
            <Users size={14} />
            <span>Pesquisadores vinculados</span>
          </p>
        </div>

        <div className="stat-card">
          <h3>Horas no Mês Atual</h3>
          <div className="value">{loading ? '...' : `${resumoHoras.horasMes}h`}</div>
          <p className="stat-desc">
            <Clock size={14} />
            <span>Total: {resumoHoras.horasTotal}h acumuladas</span>
          </p>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <Link
          to="/frequencia"
          className="container"
          style={{
            margin: 0,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            transition: 'var(--transition-smooth)',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--primary-subtle)',
              color: 'var(--primary-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Clock size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-main)', fontWeight: 600 }}>
              Registrar Frequência
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              Apontar horas e atividades
            </p>
          </div>
          <ArrowRight size={18} style={{ color: 'var(--text-tertiary)' }} />
        </Link>

        <Link
          to="/projetos"
          className="container"
          style={{
            margin: 0,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            transition: 'var(--transition-smooth)',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: '#ede9fe',
              color: '#6d28d9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <FolderKanban size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-main)', fontWeight: 600 }}>
              Meus Projetos
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              Visualizar iniciativas e equipes
            </p>
          </div>
          <ArrowRight size={18} style={{ color: 'var(--text-tertiary)' }} />
        </Link>

        {(isAdmin || isProfessor) && (
          <Link
            to="/usuarios"
            className="container"
            style={{
              margin: 0,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              transition: 'var(--transition-smooth)',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: '#f0fdf4',
                color: '#15803d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Users size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-main)', fontWeight: 600 }}>
                Gerenciar Usuários
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                Cadastro de novos bolsistas
              </p>
            </div>
            <ArrowRight size={18} style={{ color: 'var(--text-tertiary)' }} />
          </Link>
        )}
      </div>

      {/* Laboratorios / Equipe Section */}
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 className="section-title" style={{ margin: 0 }}>
            <Building2 size={20} />
            <span>Laboratórios de Pesquisa</span>
          </h2>
          <Link to="/laboratorios" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
            <span>Ver Todos</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Laboratório</th>
                <th>Área de Pesquisa</th>
                <th>Coordenador</th>
                <th>Capacidade / Ocupação</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {laboratorios.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-state-cell">
                    Nenhum laboratório cadastrado.
                  </td>
                </tr>
              ) : (
                laboratorios.slice(0, 5).map((lab) => {
                  const percentual = Math.min(100, Math.round(((lab.totalBolsistas || 0) / (lab.capacidade || 1)) * 100));
                  return (
                    <tr key={lab.id}>
                      <td>
                        <Link
                          to={`/laboratorios/${lab.id}`}
                          style={{ color: 'var(--primary-color)', fontWeight: 600, textDecoration: 'none' }}
                        >
                          {lab.nome}
                        </Link>
                      </td>
                      <td>{lab.areaPesquisa}</td>
                      <td>{lab.coordenador || '---'}</td>
                      <td style={{ minWidth: '160px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                          <span>{lab.totalBolsistas || 0} / {lab.capacidade} bolsistas</span>
                          <span>{percentual}%</span>
                        </div>
                        <div className="progress-bar-container" style={{ margin: 0 }}>
                          <div
                            className={`progress-bar-fill ${percentual > 90 ? 'danger' : percentual > 70 ? 'warning' : 'success'}`}
                            style={{ width: `${percentual}%` }}
                          />
                        </div>
                      </td>
                      <td>
                        <Badge type="status" value={lab.status} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
