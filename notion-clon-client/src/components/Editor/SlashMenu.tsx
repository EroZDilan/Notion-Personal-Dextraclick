import { useEffect, useRef } from 'react'
import './SlashMenu.css'

const OPCIONES = [
  { tipo: 'Parrafo', label: 'Texto', icono: '¶' },
  { tipo: 'Heading1', label: 'Título 1', icono: 'H1' },
  { tipo: 'Heading2', label: 'Título 2', icono: 'H2' },
  { tipo: 'Heading3', label: 'Título 3', icono: 'H3' },
  { tipo: 'ListaBullets', label: 'Lista con viñetas', icono: '•' },
  { tipo: 'ListaNumerada', label: 'Lista numerada', icono: '1.' },
  { tipo: 'Codigo', label: 'Código', icono: '<>' },
  { tipo: 'Cita', label: 'Cita', icono: '"' },
  { tipo: 'Llamada', label: 'Llamada', icono: '💡' },
  { tipo: 'Divisor', label: 'Divisor', icono: '—' },
  { tipo: 'Imagen', label: 'Imagen', icono: '🖼' },
]

interface Props {
  onSeleccionar: (tipo: string) => void
  onCerrar: () => void
}

export default function SlashMenu({ onSeleccionar, onCerrar }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar() }
    const handleClick = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) onCerrar() }
    document.addEventListener('keydown', handleKey)
    document.addEventListener('mousedown', handleClick)
    return () => { document.removeEventListener('keydown', handleKey); document.removeEventListener('mousedown', handleClick) }
  }, [onCerrar])

  return (
    <div ref={ref} className="slash-menu">
      <p className="slash-menu-header">Tipo de bloque</p>
      {OPCIONES.map(op => (
        <button key={op.tipo} className="slash-menu-item" onClick={() => onSeleccionar(op.tipo)}>
          <span className="slash-menu-icono">{op.icono}</span>
          <span>{op.label}</span>
        </button>
      ))}
    </div>
  )
}
