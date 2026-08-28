import React, { useEffect, useState } from 'react';
import {
  Building2,
  Users,
  FolderKanban,
  Clock,
  Briefcase,
  Download,
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import {
  relatorioService,
  type ResumoAdmin,
  type OcupacaoLab,
  type HorasBolsistaMes,
  type ProjetosPorLab,
  type BolsistasPorCargo,
} from '../services/relatorioService';

export const Relatorios: React.FC = () => {
  const { showToast } = useToast();

  const [resumo, setResumo] = useState<ResumoAdmin>({
    totalBolsistas: 0,
    totalLaboratorios: 0,
    totalProjetos: 0,
  });
  const [ocupacoes, setOcupacoes] = useState<OcupacaoLab[]>([]);
  const [horasMes, setHorasMes] = useState<HorasBolsistaMes[]>([]);
  const [projetosPorLab, setProjetosPorLab] = useState<ProjetosPorLab[]>([]);
  const [bolsistasPorCargo, setBolsistasPorCargo] = useState<BolsistasPorCargo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarRelatorios() {
      setLoading(true);
      try {
        const [res, ocu, hMes, pLab, bCargo] = await Promise.all([
          relatorioService.obterResumo().catch(() => ({ totalBolsistas: 0, totalLaboratorios: 0, totalProjetos: 0 })),
          relatorioService.obterOcupacao().catch(() => []),
          relatorioService.obterHorasMes().catch(() => []),
          relatorioService.obterProjetosPorLab().catch(() => []),
          relatorioService.obterBolsistasPorCargo().catch(() => []),
        ]);

        setResumo(res);
        setOcupacoes(ocu);
        setHorasMes(hMes);
        setProjetosPorLab(pLab);
        setBolsistasPorCargo(bCargo);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erro ao carregar dados do relatório';
        showToast(msg, 'erro');
      } finally {
        setLoading(false);
      }
    }

    carregarRelatorios();
  }, []);

  return (
    <div>
      <div className="header-actions">
        <div>
          <h1>Relatórios e Auditoria</h1>
          <p className="header-subtitle">
            Métricas analíticas de ocupação, produtividade de horas e distribuição da pesquisa
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
            <span>Exportar Bolsistas</span>
          </a>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total de Bolsistas</h3>
          <div className="value">{loading ? '...' : resumo.totalBolsistas}</div>
          <p className="stat-desc">
            <Users size={14} />
            <span>Pesquisadores ativos</span>
          </p>
        </div>

        <div className="stat-card">
          <h3>Laboratórios Vinculados</h3>
          <div className="value">{loading ? '...' : resumo.totalLaboratorios}</div>
          <p className="stat-desc">
            <Building2 size={14} />
            <span>Centros de desenvolvimento</span>
          </p>
        </div>

        <div className="stat-card">
          <h3>Projetos Ativos</h3>
          <div className="value">{loading ? '...' : resumo.totalProjetos}</div>
          <p className="stat-desc">
            <FolderKanban size={14} />
            <span>Linhas de pesquisa</span>
          </p>
        </div>
      </div>

      {/* Grid 2 colunas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        {/* Ocupação dos Labs */}
        <div className="container" style={{ margin: 0 }}>
          <h2 className="section-title">
            <Building2 size={20} />
            <span>Ocupação por Laboratório</span>
          </h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Laboratório</th>
                  <th>Ocupação</th>
                  <th>Percentual</th>
                </tr>
              </thead>
              <tbody>
                {ocupacoes.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="empty-state-cell">
                      Nenhum dado disponível.
                    </td>
                  </tr>
                ) : (
                  ocupacoes.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.nome}</strong></td>
                      <td>{item.ocupacao} / {item.capacidade}</td>
                      <td style={{ minWidth: '140px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                          <span>{item.percentual}%</span>
                        </div>
                        <div className="progress-bar-container" style={{ margin: 0 }}>
                          <div
                            className={`progress-bar-fill ${item.percentual > 90 ? 'danger' : item.percentual > 70 ? 'warning' : 'success'}`}
                            style={{ width: `${Math.min(100, item.percentual)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Horas no Mês por Bolsista */}
        <div className="container" style={{ margin: 0 }}>
          <h2 className="section-title">
            <Clock size={20} />
            <span>Horas Apontadas no Mês Vigente</span>
          </h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Bolsista</th>
                  <th>Horas Dedicadas</th>
                </tr>
              </thead>
              <tbody>
                {horasMes.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="empty-state-cell">
                      Nenhum apontamento no mês atual.
                    </td>
                  </tr>
                ) : (
                  horasMes.map((h, i) => (
                    <tr key={i}>
                      <td><strong>{h.bolsistaNome}</strong></td>
                      <td>
                        <span className="count-badge count-badge-purple">
                          {h.totalHoras} horas
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Grid 2 colunas inferior */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        {/* Projetos por Laboratório */}
        <div className="container" style={{ margin: 0 }}>
          <h2 className="section-title">
            <FolderKanban size={20} />
            <span>Projetos Ativos por Laboratório</span>
          </h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Laboratório</th>
                  <th>Quantidade de Projetos</th>
                </tr>
              </thead>
              <tbody>
                {projetosPorLab.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="empty-state-cell">
                      Nenhum dado disponível.
                    </td>
                  </tr>
                ) : (
                  projetosPorLab.map((p, i) => (
                    <tr key={i}>
                      <td><strong>{p.laboratorioNome}</strong></td>
                      <td>
                        <span className="count-badge count-badge-purple">
                          {p.totalProjetos} projetos
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bolsistas por Cargo */}
        <div className="container" style={{ margin: 0 }}>
          <h2 className="section-title">
            <Briefcase size={20} />
            <span>Distribuição de Bolsistas por Cargo</span>
          </h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Cargo / Função</th>
                  <th>Total de Bolsistas</th>
                </tr>
              </thead>
              <tbody>
                {bolsistasPorCargo.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="empty-state-cell">
                      Nenhum dado disponível.
                    </td>
                  </tr>
                ) : (
                  bolsistasPorCargo.map((c, i) => (
                    <tr key={i}>
                      <td><strong>{c.cargo}</strong></td>
                      <td>
                        <span className="count-badge count-badge-purple">
                          {c.total} integrantes
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
