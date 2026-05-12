import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { paginasApi } from '../api/paginas'
import type { PaginaConBloquesDto, BloqueDto } from '../types'
import './PaginaPublica.css'

function BloquePublico({ bloque }: { bloque: BloqueDto }) {
  const c = bloque.contenido as Record<string, string>

  switch (bloque.tipo) {
    case 'Divisor':
      return <hr className="pub-divisor" />
    case 'Imagen':
      return c.url ? (
        <figure className="pub-imagen">
          <img src={`http://localhost:5162${c.url}`} alt={c.alt || ''} />
          {c.alt && <figcaption>{c.alt}</figcaption>}
        </figure>
      ) : null
    case 'Codigo':
      return (
        <pre className="pub-codigo">
          <code>{c.codigo}</code>
        </pre>
      )
    case 'Llamada':
      return (
        <div className={`pub-llamada pub-llamada-${c.color}`}>
          <span>{c.emoji}</span>
          <span dangerouslySetInnerHTML={{ __html: c.texto || '' }} />
        </div>
      )
    default: {
      if (bloque.tipo === 'ListaBullets') {
        return <ul className="pub-lista" dangerouslySetInnerHTML={{ __html: `<li>${c.texto || ''}</li>` }} />
      }
      if (bloque.tipo === 'ListaNumerada') {
        return <ol className="pub-lista" dangerouslySetInnerHTML={{ __html: `<li>${c.texto || ''}</li>` }} />
      }
      if (bloque.tipo === 'Heading1') return <h1 className="pub-heading1" dangerouslySetInnerHTML={{ __html: c.texto || '' }} />
      if (bloque.tipo === 'Heading2') return <h2 className="pub-heading2" dangerouslySetInnerHTML={{ __html: c.texto || '' }} />
      if (bloque.tipo === 'Heading3') return <h3 className="pub-heading3" dangerouslySetInnerHTML={{ __html: c.texto || '' }} />
      if (bloque.tipo === 'Cita') return <blockquote className="pub-texto" dangerouslySetInnerHTML={{ __html: c.texto || '' }} />
      return <p className="pub-texto" dangerouslySetInnerHTML={{ __html: c.texto || '' }} />
    }
  }
}

export default function PaginaPublica() {
  const { id } = useParams<{ id: string }>()
  const [pagina, setPagina] = useState<PaginaConBloquesDto | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!id) return
    paginasApi.obtenerPublica(id)
      .then(setPagina)
      .catch(() => setError(true))
  }, [id])

  if (error) return (
    <div className="pub-error">
      <h2>Página no disponible</h2>
      <p>Esta página no existe o no es pública.</p>
      <Link to="/">Ir al inicio</Link>
    </div>
  )

  if (!pagina) return <div className="pub-loading">Cargando...</div>

  return (
    <div className="pub-page">
      <nav className="pub-nav">
        <span className="pub-brand">NotionClon</span>
        <Link to="/login" className="pub-login-link">Iniciar sesión</Link>
      </nav>

      {pagina.coverUrl && (
        <div className="pub-cover">
          <img src={`http://localhost:5162${pagina.coverUrl}`} alt="Cover" />
        </div>
      )}

      <article className="pub-article">
        <header className="pub-header">
          <span className="pub-emoji">{pagina.emoji}</span>
          <h1 className="pub-titulo">{pagina.titulo || 'Sin título'}</h1>
        </header>

        <div className="pub-contenido">
          {pagina.bloques.map(b => (
            <BloquePublico key={b.id} bloque={b} />
          ))}
        </div>
      </article>
    </div>
  )
}
