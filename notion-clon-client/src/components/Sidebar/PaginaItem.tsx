import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import type { PaginaDto } from '../../types'

interface Props {
  pagina: PaginaDto
  nivel: number
  activa: boolean
  onClick: (id: string) => void
  onCrearSubpagina: (padreId: string) => void
  onRenombrar: (id: string, titulo: string, emoji: string) => void
  onEliminar: (id: string) => void
}

export default function PaginaItem({
  pagina, nivel, activa, onClick, onCrearSubpagina, onRenombrar, onEliminar
}: Props) {
  const [expandida, setExpandida] = useState(false)
  const [editando, setEditando] = useState(false)
  const [titulo, setTitulo] = useState(pagina.titulo)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setTitulo(pagina.titulo) }, [pagina.titulo])
  useEffect(() => { if (editando) inputRef.current?.focus() }, [editando])

  const confirmarRenombre = () => {
    setEditando(false)
    const t = titulo.trim() || 'Sin título'
    setTitulo(t)
    onRenombrar(pagina.id, t, pagina.emoji)
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') confirmarRenombre()
    if (e.key === 'Escape') { setTitulo(pagina.titulo); setEditando(false) }
  }

  const tieneHijos = pagina.subPaginas.length > 0

  return (
    <div>
      <div
        className={`pagina-item ${activa ? 'activa' : ''}`}
        style={{ paddingLeft: `${12 + nivel * 16}px` }}
      >
        <button
          className="pagina-chevron"
          onClick={(e) => { e.stopPropagation(); setExpandida(x => !x) }}
          style={{ visibility: tieneHijos ? 'visible' : 'hidden' }}
          aria-label="expandir"
        >
          {expandida ? '▾' : '▸'}
        </button>

        <span className="pagina-emoji">{pagina.emoji}</span>

        {editando ? (
          <input
            ref={inputRef}
            className="pagina-titulo-input"
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
            onBlur={confirmarRenombre}
            onKeyDown={onKeyDown}
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span
            className="pagina-titulo"
            onClick={() => onClick(pagina.id)}
            onDoubleClick={() => setEditando(true)}
          >
            {pagina.titulo || 'Sin título'}
          </span>
        )}

        <div className="pagina-acciones">
          <button onClick={(e) => { e.stopPropagation(); onCrearSubpagina(pagina.id) }} title="Nueva subpágina">+</button>
          <button onClick={(e) => { e.stopPropagation(); onEliminar(pagina.id) }} title="Eliminar">⋯</button>
        </div>
      </div>

      {expandida && pagina.subPaginas.map(sub => (
        <PaginaItem
          key={sub.id}
          pagina={sub}
          nivel={nivel + 1}
          activa={activa && false}
          onClick={onClick}
          onCrearSubpagina={onCrearSubpagina}
          onRenombrar={onRenombrar}
          onEliminar={onEliminar}
        />
      ))}
    </div>
  )
}
