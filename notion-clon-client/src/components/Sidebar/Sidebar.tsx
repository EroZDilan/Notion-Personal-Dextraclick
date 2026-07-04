import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import type { PaginaDto, TareaDto } from '../../types'
import PaginaItem from './PaginaItem'
import Papelera from './Papelera'
import './Sidebar.css'

const PRIORIDAD_ICON: Record<string, string> = { Alta: '🔴', Media: '🟡', Baja: '🟢' }

interface Props {
  paginas: PaginaDto[]
  paginaActivaId: string | null
  tareas: TareaDto[]
  tareaActivaId: string | null
  ocultarHechas: boolean
  filtroEstado: string
  onSeleccionarPagina: (id: string) => void
  onCrearPagina: (padreId?: string) => void
  onRenombrarPagina: (id: string, titulo: string, emoji: string) => void
  onEliminarPagina: (id: string) => void
  onBuscar: () => void
  onRecargarPaginas: () => void
  onSeleccionarTarea: (id: string) => void
  onCrearTarea: () => void
  onSetOcultarHechas: (v: boolean) => void
  onSetFiltroEstado: (v: string) => void
}

export default function Sidebar({
  paginas, paginaActivaId, tareas, tareaActivaId,
  ocultarHechas, filtroEstado,
  onSeleccionarPagina, onCrearPagina, onRenombrarPagina, onEliminarPagina,
  onBuscar, onRecargarPaginas,
  onSeleccionarTarea, onCrearTarea, onSetOcultarHechas, onSetFiltroEstado
}: Props) {
  const { nombreCompleto, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [seccionTareas, setSeccionTareas] = useState(true)
  const [seccionNotas, setSeccionNotas] = useState(true)

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-workspace">{nombreCompleto || 'Mi espacio'}</span>
        <div className="sidebar-header-actions">
          <button className="sidebar-icon-btn" onClick={toggleTheme} title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button className="sidebar-icon-btn" onClick={logout} title="Cerrar sesión">⏏</button>
        </div>
      </div>

      <button className="sidebar-buscar" onClick={onBuscar}>
        <span>🔍</span>
        <span>Buscar</span>
        <kbd>Ctrl K</kbd>
      </button>

      <div className="sidebar-scroll">
        {/* ── TAREAS ── */}
        <div className="sidebar-seccion">
          <button className="sidebar-seccion-header" onClick={() => setSeccionTareas(v => !v)}>
            <span className="sidebar-seccion-chevron">{seccionTareas ? '▾' : '▸'}</span>
            <span>✅ Tareas</span>
            <span className="sidebar-seccion-count">{tareas.length}</span>
          </button>

          {seccionTareas && (
            <>
              <div className="sidebar-tareas-filtros">
                <button
                  className={`filtro-btn${ocultarHechas ? ' active' : ''}`}
                  onClick={() => onSetOcultarHechas(!ocultarHechas)}
                  title="Ocultar completadas"
                >✓ Ocultar hechas</button>
                <select
                  className="filtro-select"
                  value={filtroEstado}
                  onChange={e => onSetFiltroEstado(e.target.value)}
                >
                  <option value="">Todas</option>
                  <option value="Todo">Por hacer</option>
                  <option value="EnProgreso">En progreso</option>
                  <option value="Hecho">Hechas</option>
                </select>
              </div>

              <div className="sidebar-tareas-lista">
                {tareas.length === 0
                  ? <p className="sidebar-empty">Sin tareas</p>
                  : tareas.map(t => (
                    <button
                      key={t.id}
                      className={`tarea-item${t.id === tareaActivaId ? ' activa' : ''}`}
                      onClick={() => onSeleccionarTarea(t.id)}
                    >
                      <span className="tarea-prioridad" title={t.prioridad}>{PRIORIDAD_ICON[t.prioridad]}</span>
                      <span className="tarea-titulo">{t.titulo}</span>
                      {t.totalPasos > 0 && (
                        <span className="tarea-progreso">
                          {t.pasosCompletados}/{t.totalPasos}
                        </span>
                      )}
                    </button>
                  ))
                }
              </div>

              <button className="sidebar-nueva-pagina" onClick={onCrearTarea}>
                + Nueva tarea
              </button>
            </>
          )}
        </div>

        {/* ── NOTAS ── */}
        <div className="sidebar-seccion">
          <button className="sidebar-seccion-header" onClick={() => setSeccionNotas(v => !v)}>
            <span className="sidebar-seccion-chevron">{seccionNotas ? '▾' : '▸'}</span>
            <span>📄 Notas</span>
          </button>

          {seccionNotas && (
            <div className="sidebar-paginas">
              {paginas.length === 0
                ? <p className="sidebar-empty">Sin páginas</p>
                : paginas.map(p => (
                  <PaginaItem
                    key={p.id}
                    pagina={p}
                    nivel={0}
                    activa={p.id === paginaActivaId}
                    onClick={onSeleccionarPagina}
                    onCrearSubpagina={onCrearPagina}
                    onRenombrar={onRenombrarPagina}
                    onEliminar={onEliminarPagina}
                  />
                ))
              }
              <button className="sidebar-nueva-pagina" onClick={() => onCrearPagina()}>
                + Nueva página
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="sidebar-footer">
        <Papelera onRestaurar={onRecargarPaginas} onNavegar={onSeleccionarPagina} />
      </div>
    </aside>
  )
}
