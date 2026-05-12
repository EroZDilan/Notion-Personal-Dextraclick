import { useCallback, useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { BloqueDto, PaginaDto } from '../../types'
import BloqueTexto from './bloques/BloqueTexto'
import BloqueImagen from './bloques/BloqueImagen'
import BloqueCodigo from './bloques/BloqueCodigo'
import BloqueLlamada from './bloques/BloqueLlamada'
import VersionesPanel from './VersionesPanel'
import ComentariosPanel from './ComentariosPanel'
import './BloqueEditor.css'

interface Props {
  bloque: BloqueDto
  onChange: (id: string, contenido: Record<string, unknown>) => void
  onSlashCommand: () => void
  onEliminar: (id: string) => void
  onSubirImagen: (file: File) => Promise<string>
  onBloqueActualizado: () => void
  paginas?: PaginaDto[]
  onNavegar?: (id: string) => void
}

export default function BloqueEditor({
  bloque, onChange, onSlashCommand, onEliminar, onSubirImagen,
  onBloqueActualizado, paginas, onNavegar
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: bloque.id })
  const [mostrarVersiones, setMostrarVersiones] = useState(false)
  const [mostrarComentarios, setMostrarComentarios] = useState(false)
  const [totalComentarios, setTotalComentarios] = useState(bloque.totalComentarios)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleChange = useCallback((contenido: Record<string, unknown>) => {
    onChange(bloque.id, contenido)
  }, [bloque.id, onChange])

  const renderContenido = () => {
    switch (bloque.tipo) {
      case 'Imagen':
        return <BloqueImagen contenido={bloque.contenido} onChange={handleChange} onSubirImagen={onSubirImagen} />
      case 'Codigo':
        return <BloqueCodigo contenido={bloque.contenido} onChange={handleChange} />
      case 'Llamada':
        return <BloqueLlamada contenido={bloque.contenido} onChange={handleChange} />
      case 'Divisor':
        return <hr className="bloque-divisor" />
      default:
        return (
          <BloqueTexto
            bloque={bloque}
            onChange={handleChange}
            onSlashCommand={onSlashCommand}
            paginas={paginas}
            onNavegar={onNavegar}
          />
        )
    }
  }

  return (
    <>
      <div ref={setNodeRef} style={style} className="bloque-wrapper">
        <div className="bloque-handle" {...attributes} {...listeners} title="Arrastrar">
          ⠿
        </div>
        <div className="bloque-contenido">
          {renderContenido()}
        </div>
        <div className="bloque-acciones">
          <button
            className="bloque-accion-btn"
            onClick={() => setMostrarComentarios(true)}
            title="Comentarios"
          >
            💬{totalComentarios > 0 && <span className="bloque-badge">{totalComentarios}</span>}
          </button>
          <button
            className="bloque-accion-btn"
            onClick={() => setMostrarVersiones(true)}
            title="Historial"
          >
            🕐
          </button>
          <button className="bloque-eliminar" onClick={() => onEliminar(bloque.id)} title="Eliminar bloque">
            ✕
          </button>
        </div>
      </div>

      {mostrarVersiones && (
        <VersionesPanel
          bloqueId={bloque.id}
          onRestaurar={onBloqueActualizado}
          onCerrar={() => setMostrarVersiones(false)}
        />
      )}

      {mostrarComentarios && (
        <ComentariosPanel
          bloqueId={bloque.id}
          onComentariosChange={setTotalComentarios}
          onCerrar={() => setMostrarComentarios(false)}
        />
      )}
    </>
  )
}
