import { useState, useEffect, useRef, useCallback } from 'react'
import { paginasApi } from '../api/paginas'
import type { ResultadoBusquedaDto } from '../types'
import './BusquedaModal.css'

interface Props {
  onSeleccionar: (paginaId: string) => void
  onCerrar: () => void
}

export default function BusquedaModal({ onSeleccionar, onCerrar }: Props) {
  const [query, setQuery] = useState('')
  const [resultados, setResultados] = useState<ResultadoBusquedaDto[]>([])
  const [activo, setActivo] = useState(0)
  const [buscando, setBuscando] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (query.length < 2) { setResultados([]); return }

    setBuscando(true)
    timerRef.current = setTimeout(async () => {
      const res = await paginasApi.buscar(query)
      setResultados(res)
      setActivo(0)
      setBuscando(false)
    }, 250)
  }, [query])

  const seleccionar = useCallback((id: string) => {
    onSeleccionar(id)
    onCerrar()
  }, [onSeleccionar, onCerrar])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActivo(a => Math.min(a + 1, resultados.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActivo(a => Math.max(a - 1, 0)) }
    if (e.key === 'Enter' && resultados[activo]) seleccionar(resultados[activo].paginaId)
    if (e.key === 'Escape') onCerrar()
  }

  return (
    <div className="busqueda-overlay" onClick={onCerrar}>
      <div className="busqueda-modal" onClick={e => e.stopPropagation()}>
        <div className="busqueda-input-wrap">
          <span className="busqueda-icon">🔍</span>
          <input
            ref={inputRef}
            className="busqueda-input"
            placeholder="Buscar páginas y contenido..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
          />
          {buscando && <span className="busqueda-spinner">⟳</span>}
          <kbd className="busqueda-esc">Esc</kbd>
        </div>

        {resultados.length > 0 && (
          <ul className="busqueda-resultados">
            {resultados.map((r, i) => (
              <li
                key={r.paginaId}
                className={`busqueda-item ${i === activo ? 'activo' : ''}`}
                onClick={() => seleccionar(r.paginaId)}
                onMouseEnter={() => setActivo(i)}
              >
                <span className="busqueda-emoji">{r.emoji}</span>
                <div className="busqueda-info">
                  <span className="busqueda-titulo">{r.titulo || 'Sin título'}</span>
                  {r.fragmento && <span className="busqueda-fragmento">{r.fragmento}</span>}
                </div>
                <span className="busqueda-tipo">{r.tipo === 'bloque' ? 'contenido' : 'página'}</span>
              </li>
            ))}
          </ul>
        )}

        {query.length >= 2 && !buscando && resultados.length === 0 && (
          <p className="busqueda-vacio">No se encontraron resultados para «{query}»</p>
        )}

        <div className="busqueda-footer">
          <span><kbd>↑↓</kbd> navegar</span>
          <span><kbd>Enter</kbd> abrir</span>
          <span><kbd>Esc</kbd> cerrar</span>
        </div>
      </div>
    </div>
  )
}
