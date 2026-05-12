import { useEffect, useState } from 'react'
import { bloquesApi } from '../../api/bloques'
import type { VersionBloqueDto } from '../../types'
import './VersionesPanel.css'

interface Props {
  bloqueId: string
  onRestaurar: () => void
  onCerrar: () => void
}

function formatFecha(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function extractPreview(contenidoJson: string): string {
  try {
    const obj = JSON.parse(contenidoJson)
    if (obj.texto) return obj.texto.replace(/<[^>]+>/g, '').slice(0, 80)
    if (obj.codigo) return obj.codigo.slice(0, 80)
    return 'Sin contenido'
  } catch {
    return 'Sin contenido'
  }
}

export default function VersionesPanel({ bloqueId, onRestaurar, onCerrar }: Props) {
  const [versiones, setVersiones] = useState<VersionBloqueDto[]>([])
  const [cargando, setCargando] = useState(true)
  const [restaurando, setRestaurando] = useState<string | null>(null)

  useEffect(() => {
    bloquesApi.obtenerVersiones(bloqueId)
      .then(setVersiones)
      .finally(() => setCargando(false))
  }, [bloqueId])

  const restaurar = async (versionId: string) => {
    setRestaurando(versionId)
    await bloquesApi.restaurarVersion(versionId)
    setRestaurando(null)
    onRestaurar()
    onCerrar()
  }

  return (
    <div className="versiones-overlay" onClick={onCerrar}>
      <div className="versiones-panel" onClick={e => e.stopPropagation()}>
        <div className="versiones-header">
          <span>Historial de versiones</span>
          <button onClick={onCerrar}>✕</button>
        </div>

        {cargando ? (
          <p className="versiones-empty">Cargando...</p>
        ) : versiones.length === 0 ? (
          <p className="versiones-empty">Sin versiones guardadas aún. Edita el bloque para crear versiones.</p>
        ) : (
          <ul className="versiones-lista">
            {versiones.map(v => (
              <li key={v.id} className="version-item">
                <div className="version-fecha">{formatFecha(v.creadaEn)}</div>
                <div className="version-preview">{extractPreview(v.contenidoJson) || '—'}</div>
                <button
                  className="version-restaurar-btn"
                  disabled={restaurando === v.id}
                  onClick={() => restaurar(v.id)}
                >
                  {restaurando === v.id ? '...' : 'Restaurar'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
