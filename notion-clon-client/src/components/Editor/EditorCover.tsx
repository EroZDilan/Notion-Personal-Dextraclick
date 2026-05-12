import { useRef } from 'react'
import { paginasApi } from '../../api/paginas'
import './EditorCover.css'

interface Props {
  paginaId: string
  coverUrl: string | null | undefined
  onCoverChange: (url: string | null) => void
}

export default function EditorCover({ paginaId, coverUrl, onCoverChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  const subirCover = async (file: File) => {
    const url = await paginasApi.subirImagen(file)
    await paginasApi.actualizarCover(paginaId, url)
    onCoverChange(url)
  }

  const eliminarCover = async () => {
    await paginasApi.actualizarCover(paginaId, null)
    onCoverChange(null)
  }

  if (!coverUrl) {
    return (
      <div className="editor-cover-placeholder">
        <button className="editor-cover-add" onClick={() => inputRef.current?.click()}>
          + Añadir cover
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={e => e.target.files?.[0] && subirCover(e.target.files[0])}
        />
      </div>
    )
  }

  return (
    <div className="editor-cover">
      <img src={`http://localhost:5162${coverUrl}`} alt="Cover" className="editor-cover-img" />
      <div className="editor-cover-actions">
        <button onClick={() => inputRef.current?.click()}>Cambiar cover</button>
        <button onClick={eliminarCover}>Eliminar cover</button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => e.target.files?.[0] && subirCover(e.target.files[0])}
      />
    </div>
  )
}
