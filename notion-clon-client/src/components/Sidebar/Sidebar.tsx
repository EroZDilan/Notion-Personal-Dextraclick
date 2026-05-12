import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import type { PaginaDto } from '../../types'
import PaginaItem from './PaginaItem'
import Papelera from './Papelera'
import './Sidebar.css'

interface Props {
  paginas: PaginaDto[]
  paginaActivaId: string | null
  onSeleccionar: (id: string) => void
  onCrear: (padreId?: string) => void
  onRenombrar: (id: string, titulo: string, emoji: string) => void
  onEliminar: (id: string) => void
  onBuscar: () => void
  onRecargar: () => void
}

export default function Sidebar({
  paginas, paginaActivaId, onSeleccionar, onCrear, onRenombrar, onEliminar, onBuscar, onRecargar
}: Props) {
  const { nombreCompleto, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

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

      <div className="sidebar-paginas">
        {paginas.length === 0 ? (
          <p className="sidebar-empty">Sin páginas</p>
        ) : (
          paginas.map(p => (
            <PaginaItem
              key={p.id}
              pagina={p}
              nivel={0}
              activa={p.id === paginaActivaId}
              onClick={onSeleccionar}
              onCrearSubpagina={onCrear}
              onRenombrar={onRenombrar}
              onEliminar={onEliminar}
            />
          ))
        )}
      </div>

      <div className="sidebar-footer">
        <button className="sidebar-nueva-pagina" onClick={() => onCrear()}>
          + Nueva página
        </button>
        <Papelera
          onRestaurar={onRecargar}
          onNavegar={onSeleccionar}
        />
      </div>
    </aside>
  )
}
