import { useEffect, useRef, useState } from 'react'
import { comentariosApi } from '../../api/comentarios'
import { useAuth } from '../../contexts/AuthContext'
import type { ComentarioDto } from '../../types'
import './ComentariosPanel.css'

interface Props {
  bloqueId: string
  onComentariosChange: (count: number) => void
  onCerrar: () => void
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function ComentariosPanel({ bloqueId, onComentariosChange, onCerrar }: Props) {
  const { nombreCompleto } = useAuth()
  const [comentarios, setComentarios] = useState<ComentarioDto[]>([])
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    comentariosApi.obtenerPorBloque(bloqueId).then(setComentarios)
  }, [bloqueId])

  const enviar = async () => {
    if (!texto.trim() || enviando) return
    setEnviando(true)
    const nuevo = await comentariosApi.agregar(bloqueId, texto.trim())
    const siguientes = [...comentarios, nuevo]
    setComentarios(siguientes)
    onComentariosChange(siguientes.length)
    setTexto('')
    setEnviando(false)
  }

  const eliminar = async (id: string) => {
    await comentariosApi.eliminar(id)
    const siguientes = comentarios.filter(c => c.id !== id)
    setComentarios(siguientes)
    onComentariosChange(siguientes.length)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) enviar()
  }

  return (
    <div className="comentarios-overlay" onClick={onCerrar}>
      <div className="comentarios-panel" onClick={e => e.stopPropagation()}>
        <div className="comentarios-header">
          <span>Comentarios ({comentarios.length})</span>
          <button onClick={onCerrar}>✕</button>
        </div>

        <div className="comentarios-lista">
          {comentarios.length === 0 ? (
            <p className="comentarios-empty">Sin comentarios. Sé el primero.</p>
          ) : (
            comentarios.map(c => (
              <div key={c.id} className="comentario-item">
                <div className="comentario-meta">
                  <span className="comentario-autor">{c.nombreUsuario}</span>
                  <span className="comentario-fecha">{formatFecha(c.creadaEn)}</span>
                  {c.nombreUsuario === nombreCompleto && (
                    <button className="comentario-eliminar" onClick={() => eliminar(c.id)}>✕</button>
                  )}
                </div>
                <p className="comentario-texto">{c.texto}</p>
              </div>
            ))
          )}
        </div>

        <div className="comentarios-form">
          <textarea
            ref={textareaRef}
            className="comentarios-input"
            placeholder="Escribe un comentario... (Ctrl+Enter para enviar)"
            value={texto}
            onChange={e => setTexto(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
          />
          <button
            className="comentarios-enviar"
            onClick={enviar}
            disabled={!texto.trim() || enviando}
          >
            {enviando ? '...' : 'Comentar'}
          </button>
        </div>
      </div>
    </div>
  )
}
