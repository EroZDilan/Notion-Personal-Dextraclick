import { useState } from 'react'

interface Props {
  contenido: Record<string, unknown>
  onChange: (contenido: Record<string, unknown>) => void
}

const COLORES: Record<string, string> = {
  amarillo: '#FFF9C4',
  azul: '#E3F2FD',
  verde: '#E8F5E9',
  rojo: '#FFEBEE',
  gris: '#F5F5F5',
}

export default function BloqueLlamada({ contenido, onChange }: Props) {
  const [emoji, setEmoji] = useState((contenido.emoji as string) ?? '💡')
  const [texto, setTexto] = useState((contenido.texto as string) ?? '')
  const [color, setColor] = useState((contenido.color as string) ?? 'amarillo')

  const update = (e: string, t: string, c: string) => {
    setEmoji(e); setTexto(t); setColor(c)
    onChange({ emoji: e, texto: t, color: c })
  }

  return (
    <div className="bloque-llamada" style={{ background: COLORES[color] ?? COLORES.amarillo }}>
      <input
        className="bloque-llamada-emoji"
        value={emoji}
        onChange={e => update(e.target.value, texto, color)}
        maxLength={2}
      />
      <textarea
        className="bloque-llamada-texto"
        value={texto}
        onChange={e => update(emoji, e.target.value, color)}
        placeholder="Escribe algo importante..."
        rows={2}
      />
      <select
        className="bloque-llamada-color"
        value={color}
        onChange={e => update(emoji, texto, e.target.value)}
      >
        {Object.keys(COLORES).map(c => <option key={c} value={c}>{c}</option>)}
      </select>
    </div>
  )
}
