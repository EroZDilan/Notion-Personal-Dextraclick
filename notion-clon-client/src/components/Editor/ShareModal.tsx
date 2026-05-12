import { useState } from 'react'
import { paginasApi } from '../../api/paginas'
import './ShareModal.css'

interface Props {
  paginaId: string
  esPublica: boolean
  onCambio: (esPublica: boolean) => void
  onCerrar: () => void
}

export default function ShareModal({ paginaId, esPublica, onCambio, onCerrar }: Props) {
  const [activo, setActivo] = useState(esPublica)
  const [copiado, setCopiado] = useState(false)

  const urlPublica = `${window.location.origin}/p/${paginaId}`

  const toggleVisibilidad = async () => {
    const nuevo = !activo
    await paginasApi.actualizarVisibilidad(paginaId, nuevo)
    setActivo(nuevo)
    onCambio(nuevo)
  }

  const copiarUrl = async () => {
    await navigator.clipboard.writeText(urlPublica)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className="share-overlay" onClick={onCerrar}>
      <div className="share-modal" onClick={e => e.stopPropagation()}>
        <div className="share-header">
          <span className="share-title">Compartir página</span>
          <button className="share-close" onClick={onCerrar}>✕</button>
        </div>

        <div className="share-toggle-row">
          <div>
            <div className="share-toggle-label">Acceso público</div>
            <div className="share-toggle-desc">
              {activo ? 'Cualquiera con el enlace puede ver esta página' : 'Solo tú puedes ver esta página'}
            </div>
          </div>
          <button
            className={`share-toggle ${activo ? 'on' : 'off'}`}
            onClick={toggleVisibilidad}
          >
            <span className="share-toggle-thumb" />
          </button>
        </div>

        {activo && (
          <div className="share-link-row">
            <input
              className="share-link-input"
              value={urlPublica}
              readOnly
              onClick={e => (e.target as HTMLInputElement).select()}
            />
            <button className="share-copy-btn" onClick={copiarUrl}>
              {copiado ? '✓ Copiado' : 'Copiar'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
