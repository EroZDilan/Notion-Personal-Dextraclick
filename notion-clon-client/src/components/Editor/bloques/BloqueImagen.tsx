import { useRef, useState } from 'react'

interface Props {
  contenido: Record<string, unknown>
  onChange: (contenido: Record<string, unknown>) => void
  onSubirImagen: (file: File) => Promise<string>
}

export default function BloqueImagen({ contenido, onChange, onSubirImagen }: Props) {
  const [url, setUrl] = useState((contenido.url as string) ?? '')
  const [alt, setAlt] = useState((contenido.alt as string) ?? '')
  const [subiendo, setSubiendo] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0]
    if (!archivo) return
    setSubiendo(true)
    try {
      const nuevaUrl = await onSubirImagen(archivo)
      setUrl(`http://localhost:5162${nuevaUrl}`)
      onChange({ url: `http://localhost:5162${nuevaUrl}`, alt })
    } finally {
      setSubiendo(false)
    }
  }

  if (url) {
    return (
      <div className="bloque-imagen-wrap">
        <img src={url} alt={alt} className="bloque-imagen" />
        <input
          className="bloque-imagen-alt"
          value={alt}
          onChange={e => { setAlt(e.target.value); onChange({ url, alt: e.target.value }) }}
          placeholder="Descripción de la imagen..."
        />
        <button className="bloque-imagen-cambiar" onClick={() => { setUrl(''); onChange({ url: '', alt }) }}>
          Cambiar imagen
        </button>
      </div>
    )
  }

  return (
    <div className="bloque-imagen-placeholder" onClick={() => inputRef.current?.click()}>
      {subiendo ? (
        <span>Subiendo...</span>
      ) : (
        <>
          <span>🖼 Haz clic para subir una imagen</span>
          <input ref={inputRef} type="file" accept="image/*" onChange={handleArchivo} style={{ display: 'none' }} />
        </>
      )}
    </div>
  )
}
