import { useState } from 'react'

interface Props {
  contenido: Record<string, unknown>
  onChange: (contenido: Record<string, unknown>) => void
}

const LENGUAJES = ['javascript', 'typescript', 'python', 'csharp', 'html', 'css', 'sql', 'bash']

export default function BloqueCodigo({ contenido, onChange }: Props) {
  const [lenguaje, setLenguaje] = useState((contenido.lenguaje as string) ?? 'javascript')
  const [codigo, setCodigo] = useState((contenido.codigo as string) ?? '')

  const handleChange = (nuevoLenguaje: string, nuevoCodigo: string) => {
    setLenguaje(nuevoLenguaje)
    setCodigo(nuevoCodigo)
    onChange({ lenguaje: nuevoLenguaje, codigo: nuevoCodigo })
  }

  return (
    <div className="bloque-codigo">
      <div className="bloque-codigo-header">
        <select
          value={lenguaje}
          onChange={e => handleChange(e.target.value, codigo)}
        >
          {LENGUAJES.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>
      <textarea
        className="bloque-codigo-textarea"
        value={codigo}
        onChange={e => handleChange(lenguaje, e.target.value)}
        placeholder="// Escribe tu código aquí"
        spellCheck={false}
        rows={Math.max(3, codigo.split('\n').length + 1)}
      />
    </div>
  )
}
