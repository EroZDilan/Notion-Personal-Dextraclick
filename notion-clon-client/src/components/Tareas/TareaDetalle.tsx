import { useState, useCallback } from 'react'
import type { SubtareaDto, PasoDto } from '../../types'
import { useTareaDetalle } from '../../hooks/useTareas'
import * as api from '../../api/tareas'
import './TareaDetalle.css'

const ESTADO_ICON: Record<string, string> = { Todo: '⬜', EnProgreso: '🔄', Hecho: '✅' }

interface Props {
  tareaId: string
  onEliminar: (id: string) => void
  onActualizado: () => void
}

export default function TareaDetalle({ tareaId, onEliminar, onActualizado }: Props) {
  const { tarea, recargar } = useTareaDetalle(tareaId)
  const [nuevoPasoTitulo, setNuevoPasoTitulo] = useState('')
  const [nuevaSubtareaTitulo, setNuevaSubtareaTitulo] = useState('')
  const [nuevoPasoSubtarea, setNuevoPasoSubtarea] = useState<Record<string, string>>({})

  const update = useCallback(async () => {
    await recargar()
    onActualizado()
  }, [recargar, onActualizado])

  if (!tarea) return <div className="tarea-detalle"><p style={{ color: 'var(--text-muted)' }}>Cargando...</p></div>

  const totalPasos = tarea.subtareas.reduce((s, sub) => s + sub.pasos.length, 0) + tarea.pasos.length
  const completados = tarea.subtareas.reduce((s, sub) => s + sub.pasos.filter(p => p.completado).length, 0) + tarea.pasos.filter(p => p.completado).length
  const pct = totalPasos > 0 ? Math.round((completados / totalPasos) * 100) : 0

  // ── Handlers tarea ──
  const handleTituloBlur = async (e: React.FocusEvent<HTMLTextAreaElement>) => {
    const t = e.target.value.trim()
    if (t && t !== tarea.titulo) { await api.actualizarTarea(tareaId, { titulo: t }); await update() }
  }

  const handleDescBlur = async (e: React.FocusEvent<HTMLTextAreaElement>) => {
    const d = e.target.value
    if (d !== (tarea.descripcion ?? '')) { await api.actualizarTarea(tareaId, { descripcion: d }); await update() }
  }

  const handlePrioridad = async (prioridad: string) => {
    await api.actualizarTarea(tareaId, { prioridad }); await update()
  }

  const handleEstado = async (estado: string) => {
    await api.actualizarTarea(tareaId, { estado }); await update()
  }

  const handleFecha = async (v: string) => {
    if (v) await api.actualizarTarea(tareaId, { fechaLimite: v })
    else await api.actualizarTarea(tareaId, { clearFechaLimite: true })
    await update()
  }

  // ── Pasos directos ──
  const togglePaso = async (p: PasoDto) => {
    await api.actualizarPaso(p.id, { completado: !p.completado }); await update()
  }

  const renamePaso = async (p: PasoDto, titulo: string) => {
    if (titulo.trim() && titulo !== p.titulo) { await api.actualizarPaso(p.id, { titulo }); await update() }
  }

  const addPasoTarea = async () => {
    if (!nuevoPasoTitulo.trim()) return
    await api.crearPasoEnTarea(tareaId, nuevoPasoTitulo.trim())
    setNuevoPasoTitulo('')
    await update()
  }

  const delPaso = async (id: string) => {
    await api.eliminarPaso(id); await update()
  }

  // ── Subtareas ──
  const addSubtarea = async () => {
    if (!nuevaSubtareaTitulo.trim()) return
    await api.crearSubtarea(tareaId, nuevaSubtareaTitulo.trim())
    setNuevaSubtareaTitulo('')
    await update()
  }

  const delSubtarea = async (id: string) => {
    if (!confirm('¿Eliminar esta subtarea y sus pasos?')) return
    await api.eliminarSubtarea(id); await update()
  }

  const renameSubtarea = async (sub: SubtareaDto, titulo: string) => {
    if (titulo.trim() && titulo !== sub.titulo) { await api.actualizarSubtarea(sub.id, titulo); await update() }
  }

  const addPasoSub = async (subId: string) => {
    const titulo = nuevoPasoSubtarea[subId]?.trim()
    if (!titulo) return
    await api.crearPasoEnSubtarea(subId, titulo)
    setNuevoPasoSubtarea(prev => ({ ...prev, [subId]: '' }))
    await update()
  }

  return (
    <div className="tarea-detalle">
      {/* ── Título ── */}
      <div className="tarea-detalle-header">
        <textarea
          className="tarea-titulo-input"
          defaultValue={tarea.titulo}
          onBlur={handleTituloBlur}
          rows={1}
          onInput={e => {
            const el = e.currentTarget
            el.style.height = 'auto'
            el.style.height = el.scrollHeight + 'px'
          }}
        />

        <div className="tarea-meta">
          {/* Prioridad */}
          <span className={`meta-badge prioridad-${tarea.prioridad}`}>
            {tarea.prioridad === 'Alta' ? '🔴' : tarea.prioridad === 'Media' ? '🟡' : '🟢'}
            <select className="meta-select" value={tarea.prioridad} onChange={e => handlePrioridad(e.target.value)}>
              <option value="Alta">Alta</option>
              <option value="Media">Media</option>
              <option value="Baja">Baja</option>
            </select>
          </span>

          {/* Estado */}
          <span className={`meta-badge estado-${tarea.estado}`}>
            {ESTADO_ICON[tarea.estado]}
            <select className="meta-select" value={tarea.estado} onChange={e => handleEstado(e.target.value)}>
              <option value="Todo">Por hacer</option>
              <option value="EnProgreso">En progreso</option>
              <option value="Hecho">Hecho</option>
            </select>
          </span>

          {/* Fecha límite */}
          <span className="meta-badge">
            📅
            <input
              type="date"
              className="fecha-input"
              value={tarea.fechaLimite ? tarea.fechaLimite.split('T')[0] : ''}
              onChange={e => handleFecha(e.target.value)}
            />
          </span>
        </div>

        {totalPasos > 0 && (
          <div className="tarea-progreso-bar">
            <div className="progreso-track">
              <div className="progreso-fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="progreso-label">{completados}/{totalPasos} pasos ({pct}%)</span>
          </div>
        )}
      </div>

      {/* ── Descripción ── */}
      <div className="tarea-descripcion">
        <textarea
          className="descripcion-input"
          defaultValue={tarea.descripcion ?? ''}
          placeholder="Añade una descripción..."
          rows={2}
          onBlur={handleDescBlur}
          onInput={e => {
            const el = e.currentTarget
            el.style.height = 'auto'
            el.style.height = el.scrollHeight + 'px'
          }}
        />
      </div>

      {/* ── Pasos directos ── */}
      {(tarea.pasos.length > 0 || tarea.subtareas.length === 0) && (
        <div className="tarea-seccion">
          <div className="tarea-seccion-titulo">Pasos</div>
          <div className="pasos-lista">
            {tarea.pasos.map(p => (
              <PasoRow key={p.id} paso={p} onToggle={togglePaso} onRename={renamePaso} onDelete={delPaso} />
            ))}
          </div>
          <div className="add-paso-row">
            <input
              className="add-paso-input"
              placeholder="+ Añadir paso..."
              value={nuevoPasoTitulo}
              onChange={e => setNuevoPasoTitulo(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPasoTarea() } }}
            />
            {nuevoPasoTitulo && <button className="add-paso-btn" onClick={addPasoTarea}>↵</button>}
          </div>
        </div>
      )}

      {/* ── Subtareas ── */}
      {(tarea.subtareas.length > 0 || tarea.pasos.length === 0) && (
        <div className="tarea-seccion">
          <div className="tarea-seccion-titulo">Subtareas</div>

          {tarea.subtareas.map(sub => {
            const subTotal = sub.pasos.length
            const subComp = sub.pasos.filter(p => p.completado).length
            return (
              <div key={sub.id} className="subtarea-bloque">
                <div className="subtarea-header">
                  <span className="subtarea-estado-icon">{ESTADO_ICON[sub.estado]}</span>
                  <input
                    className="subtarea-nombre-input"
                    defaultValue={sub.titulo}
                    onBlur={e => renameSubtarea(sub, e.target.value)}
                  />
                  {subTotal > 0 && <span className="subtarea-progreso">{subComp}/{subTotal}</span>}
                  <button className="subtarea-delete-btn" onClick={() => delSubtarea(sub.id)}>🗑</button>
                </div>
                <div className="subtarea-pasos">
                  <div className="pasos-lista">
                    {sub.pasos.map(p => (
                      <PasoRow key={p.id} paso={p} onToggle={togglePaso} onRename={renamePaso} onDelete={delPaso} />
                    ))}
                  </div>
                  <div className="add-paso-row">
                    <input
                      className="add-paso-input"
                      placeholder="+ Añadir paso..."
                      value={nuevoPasoSubtarea[sub.id] ?? ''}
                      onChange={e => setNuevoPasoSubtarea(prev => ({ ...prev, [sub.id]: e.target.value }))}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPasoSub(sub.id) } }}
                    />
                    {nuevoPasoSubtarea[sub.id] && (
                      <button className="add-paso-btn" onClick={() => addPasoSub(sub.id)}>↵</button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          <div className="add-paso-row" style={{ marginTop: 4 }}>
            <input
              className="add-paso-input"
              placeholder="+ Nueva subtarea..."
              value={nuevaSubtareaTitulo}
              onChange={e => setNuevaSubtareaTitulo(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSubtarea() } }}
            />
            {nuevaSubtareaTitulo && <button className="add-paso-btn" onClick={addSubtarea}>↵</button>}
          </div>
        </div>
      )}

      {/* ── Acciones ── */}
      <div className="tarea-acciones">
        <button className="btn-eliminar-tarea" onClick={() => {
          if (confirm(`¿Eliminar "${tarea.titulo}"?`)) onEliminar(tareaId)
        }}>
          🗑 Eliminar tarea
        </button>
      </div>
    </div>
  )
}

function PasoRow({ paso, onToggle, onRename, onDelete }: {
  paso: PasoDto
  onToggle: (p: PasoDto) => void
  onRename: (p: PasoDto, t: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="paso-item">
      <input
        type="checkbox"
        className="paso-checkbox"
        checked={paso.completado}
        onChange={() => onToggle(paso)}
      />
      <input
        className={`paso-titulo-input${paso.completado ? ' completado' : ''}`}
        defaultValue={paso.titulo}
        onBlur={e => onRename(paso, e.target.value)}
      />
      <button className="paso-delete-btn" onClick={() => onDelete(paso.id)}>✕</button>
    </div>
  )
}
