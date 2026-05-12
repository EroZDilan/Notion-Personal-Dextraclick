import { useState, useEffect } from 'react'
import { paginasApi } from '../../api/paginas'
import type { PaginaDto } from '../../types'
import './Papelera.css'

interface Props {
  onRestaurar: (id: string) => void
  onNavegar: (id: string) => void
}

export default function Papelera({ onRestaurar, onNavegar }: Props) {
  const [abierta, setAbierta] = useState(false)
  const [paginas, setPaginas] = useState<PaginaDto[]>([])
  const [cargando, setCargando] = useState(false)

  const cargar = async () => {
    setCargando(true)
    const data = await paginasApi.obtenerPapelera()
    setPaginas(data)
    setCargando(false)
  }

  useEffect(() => { if (abierta) cargar() }, [abierta])

  const handleRestaurar = async (id: string) => {
    await paginasApi.restaurar(id)
    setPaginas(prev => prev.filter(p => p.id !== id))
    onRestaurar(id)
  }

  return (
    <div className="papelera">
      <button className="papelera-toggle" onClick={() => setAbierta(a => !a)}>
        <span>🗑 Papelera</span>
        <span className="papelera-chevron">{abierta ? '▾' : '▸'}</span>
      </button>

      {abierta && (
        <div className="papelera-lista">
          {cargando ? (
            <p className="papelera-vacio">Cargando...</p>
          ) : paginas.length === 0 ? (
            <p className="papelera-vacio">La papelera está vacía</p>
          ) : (
            paginas.map(p => (
              <div key={p.id} className="papelera-item">
                <span
                  className="papelera-titulo"
                  onClick={() => { onNavegar(p.id); }}
                  title="Abrir página"
                >
                  {p.emoji} {p.titulo || 'Sin título'}
                </span>
                <button
                  className="papelera-restaurar"
                  onClick={() => handleRestaurar(p.id)}
                  title="Restaurar página"
                >
                  ↩
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
