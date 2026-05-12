import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import type { BloqueDto } from '../../../types'
import './BloqueTexto.css'

interface Props {
  bloque: BloqueDto
  onChange: (contenido: Record<string, unknown>) => void
  onSlashCommand: () => void
}

const nivelHeading = (tipo: string) => {
  if (tipo === 'Heading1') return 1
  if (tipo === 'Heading2') return 2
  if (tipo === 'Heading3') return 3
  return null
}

export default function BloqueTexto({ bloque, onChange, onSlashCommand }: Props) {
  const contenido = bloque.contenido as { texto?: string }
  const nivel = nivelHeading(bloque.tipo)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: {},
        orderedList: {},
        blockquote: {},
        codeBlock: false,
      }),
      Underline,
      Placeholder.configure({ placeholder: 'Escribe algo, o escribe / para comandos...' }),
    ],
    content: nivel
      ? `<h${nivel}>${contenido.texto ?? ''}</h${nivel}>`
      : bloque.tipo === 'ListaBullets'
        ? `<ul><li>${contenido.texto ?? ''}</li></ul>`
        : bloque.tipo === 'ListaNumerada'
          ? `<ol><li>${contenido.texto ?? ''}</li></ol>`
          : bloque.tipo === 'Cita'
            ? `<blockquote>${contenido.texto ?? ''}</blockquote>`
            : `<p>${contenido.texto ?? ''}</p>`,
    onUpdate({ editor }) {
      const texto = editor.getText()
      if (texto === '/') {
        editor.commands.clearContent()
        onSlashCommand()
        return
      }
      onChange({ texto: editor.getHTML() })
    },
  })

  useEffect(() => () => { editor?.destroy() }, [editor])

  return (
    <>
      {editor && (
        <BubbleMenu editor={editor}>
          <div className="bubble-menu">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={editor.isActive('bold') ? 'active' : ''}
              title="Negrita"
            >
              <b>B</b>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={editor.isActive('italic') ? 'active' : ''}
              title="Cursiva"
            >
              <i>I</i>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={editor.isActive('underline') ? 'active' : ''}
              title="Subrayado"
            >
              <u>U</u>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={editor.isActive('strike') ? 'active' : ''}
              title="Tachado"
            >
              <s>S</s>
            </button>
            <div className="bubble-sep" />
            <button
              onClick={() => editor.chain().focus().toggleCode().run()}
              className={editor.isActive('code') ? 'active' : ''}
              title="Código inline"
            >
              {'</>'}
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={editor.isActive('heading', { level: 1 }) ? 'active' : ''}
              title="Título 1"
            >
              H1
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={editor.isActive('heading', { level: 2 }) ? 'active' : ''}
              title="Título 2"
            >
              H2
            </button>
          </div>
        </BubbleMenu>
      )}
      <EditorContent editor={editor} className="bloque-texto" />
    </>
  )
}
