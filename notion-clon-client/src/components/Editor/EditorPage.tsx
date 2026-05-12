import { useEffect, useState, useCallback, useRef } from 'react'
import { paginasApi } from '../../api/paginas'
import { bloquesApi } from '../../api/bloques'
import type { PaginaConBloquesDto, BloqueDto } from '../../types'
import BloqueEditor from './BloqueEditor'
import SlashMenu from './SlashMenu'
import { DndContext, closestCenter, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import './EditorPage.css'

interface Props {
  paginaId: string
  onTituloChange: (id: string, titulo: string, emoji: string) => void
}

export default function EditorPage({ paginaId, onTituloChange }: Props) {
  const [pagina, setPagina] = useState<PaginaConBloquesDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [slashMenu, setSlashMenu] = useState<{ bloqueId: string; orden: number } | null>(null)
  const tituloRef = useRef<HTMLDivElement>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  useEffect(() => {
    setLoading(true)
    paginasApi.obtener(paginaId).then(data => {
      setPagina(data)
      setLoading(false)
    })
  }, [paginaId])

  const guardarTitulo = useCallback((titulo: string) => {
    if (!pagina) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      await paginasApi.actualizarTitulo(paginaId, titulo, pagina.emoji)
      onTituloChange(paginaId, titulo, pagina.emoji)
    }, 1000)
  }, [pagina, paginaId, onTituloChange])

  const onBloqueChange = useCallback((bloqueId: string, contenido: Record<string, unknown>) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      bloquesApi.actualizar(bloqueId, contenido)
    }, 1500)
  }, [])

  const agregarBloque = useCallback(async (tipo: string, despuesDe: string) => {
    if (!pagina) return
    setSlashMenu(null)
    const orden = (pagina.bloques.findIndex(b => b.id === despuesDe) ?? pagina.bloques.length - 1) + 1
    const nuevo = await bloquesApi.crear(paginaId, tipo as BloqueDto['tipo'], orden)
    setPagina(prev => prev ? {
      ...prev,
      bloques: [
        ...prev.bloques.slice(0, orden),
        nuevo,
        ...prev.bloques.slice(orden)
      ]
    } : prev)
  }, [pagina, paginaId])

  const eliminarBloque = useCallback(async (bloqueId: string) => {
    if (!pagina || pagina.bloques.length <= 1) return
    await bloquesApi.eliminar(bloqueId)
    setPagina(prev => prev ? { ...prev, bloques: prev.bloques.filter(b => b.id !== bloqueId) } : prev)
  }, [pagina])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id || !pagina) return

    const oldIndex = pagina.bloques.findIndex(b => b.id === active.id)
    const newIndex = pagina.bloques.findIndex(b => b.id === over.id)
    const nuevos = arrayMove(pagina.bloques, oldIndex, newIndex)

    setPagina(prev => prev ? { ...prev, bloques: nuevos } : prev)
    await bloquesApi.reordenar(paginaId, nuevos.map(b => b.id))
  }, [pagina, paginaId])

  const subirImagen = useCallback(async (archivo: File) => {
    return await paginasApi.subirImagen(archivo)
  }, [])

  if (loading) return <div className="editor-loading">Cargando...</div>
  if (!pagina) return <div className="editor-loading">Página no encontrada</div>

  return (
    <div className="editor-page">
      <div className="editor-titulo-wrap">
        <div className="editor-emoji">{pagina.emoji}</div>
        <div
          ref={tituloRef}
          className="editor-titulo"
          contentEditable
          suppressContentEditableWarning
          onInput={e => guardarTitulo(e.currentTarget.textContent ?? '')}
          data-placeholder="Sin título"
        >
          {pagina.titulo}
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={pagina.bloques.map(b => b.id)} strategy={verticalListSortingStrategy}>
          {pagina.bloques.map(bloque => (
            <BloqueEditor
              key={bloque.id}
              bloque={bloque}
              onChange={onBloqueChange}
              onSlashCommand={() => setSlashMenu({ bloqueId: bloque.id, orden: bloque.orden })}
              onEliminar={eliminarBloque}
              onSubirImagen={subirImagen}
            />
          ))}
        </SortableContext>
      </DndContext>

      {slashMenu && (
        <SlashMenu
          onSeleccionar={(tipo) => agregarBloque(tipo, slashMenu.bloqueId)}
          onCerrar={() => setSlashMenu(null)}
        />
      )}
    </div>
  )
}
