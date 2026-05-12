import type { PaginaDto } from '../../types'
import './Breadcrumb.css'

interface Props {
  paginas: PaginaDto[]
  paginaActivaId: string
  onNavegar: (id: string) => void
}

function construirRuta(paginas: PaginaDto[], id: string): PaginaDto[] {
  for (const p of paginas) {
    if (p.id === id) return [p]
    const ruta = construirRuta(p.subPaginas, id)
    if (ruta.length > 0) return [p, ...ruta]
  }
  return []
}

export default function Breadcrumb({ paginas, paginaActivaId, onNavegar }: Props) {
  const ruta = construirRuta(paginas, paginaActivaId)
  if (ruta.length <= 1) return null

  return (
    <nav className="breadcrumb">
      {ruta.map((p, i) => (
        <span key={p.id} className="breadcrumb-item">
          {i > 0 && <span className="breadcrumb-sep">/</span>}
          {i < ruta.length - 1 ? (
            <button className="breadcrumb-link" onClick={() => onNavegar(p.id)}>
              {p.emoji} {p.titulo || 'Sin título'}
            </button>
          ) : (
            <span className="breadcrumb-current">
              {p.emoji} {p.titulo || 'Sin título'}
            </span>
          )}
        </span>
      ))}
    </nav>
  )
}
