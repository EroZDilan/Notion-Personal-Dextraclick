import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import Mention from '@tiptap/extension-mention'
import type { Editor } from '@tiptap/core'
import type { Range } from '@tiptap/core'
import type { BloqueDto, PaginaDto } from '../../../types'
import './BloqueTexto.css'

interface Props {
  bloque: BloqueDto
  onChange: (contenido: Record<string, unknown>) => void
  onSlashCommand: () => void
  paginas?: PaginaDto[]
  onNavegar?: (id: string) => void
}

const nivelHeading = (tipo: string) => {
  if (tipo === 'Heading1') return 1
  if (tipo === 'Heading2') return 2
  if (tipo === 'Heading3') return 3
  return null
}

function crearSuggestion(paginas: PaginaDto[]) {
  return {
    char: '@',
    items: ({ query }: { query: string }) =>
      paginas
        .filter(p => p.titulo.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 6),

    render: () => {
      let popup: HTMLElement | null = null
      let selectedIndex = 0
      let currentProps: { items: PaginaDto[]; command: (p: { id: string; label: string }) => void } | null = null

      const buildPopup = (props: typeof currentProps) => {
        if (!popup || !props) return
        popup.innerHTML = ''
        props.items.forEach((p, i) => {
          const btn = document.createElement('button')
          btn.className = `mention-item${i === selectedIndex ? ' mention-item-selected' : ''}`
          btn.textContent = `${p.emoji} ${p.titulo || 'Sin título'}`
          btn.onclick = () => props.command({ id: p.id, label: p.titulo })
          popup!.appendChild(btn)
        })
      }

      return {
        onStart(props: { items: PaginaDto[]; command: (p: { id: string; label: string }) => void; clientRect?: (() => DOMRect | null) | null }) {
          currentProps = props
          selectedIndex = 0
          popup = document.createElement('div')
          popup.className = 'mention-dropdown'
          document.body.appendChild(popup)
          buildPopup(props)
          const rect = props.clientRect?.()
          if (rect && popup) {
            popup.style.position = 'fixed'
            popup.style.top = `${rect.bottom + 4}px`
            popup.style.left = `${rect.left}px`
          }
        },
        onUpdate(props: { items: PaginaDto[]; command: (p: { id: string; label: string }) => void; clientRect?: (() => DOMRect | null) | null }) {
          currentProps = props
          selectedIndex = 0
          buildPopup(props)
          const rect = props.clientRect?.()
          if (rect && popup) {
            popup.style.top = `${rect.bottom + 4}px`
            popup.style.left = `${rect.left}px`
          }
        },
        onKeyDown({ event }: { event: KeyboardEvent }) {
          if (!currentProps || !popup) return false
          if (event.key === 'ArrowDown') {
            selectedIndex = (selectedIndex + 1) % Math.max(1, currentProps.items.length)
            buildPopup(currentProps)
            return true
          }
          if (event.key === 'ArrowUp') {
            selectedIndex = (selectedIndex - 1 + currentProps.items.length) % Math.max(1, currentProps.items.length)
            buildPopup(currentProps)
            return true
          }
          if (event.key === 'Enter') {
            const item = currentProps.items[selectedIndex]
            if (item) currentProps.command({ id: item.id, label: item.titulo })
            return true
          }
          return false
        },
        onExit() {
          popup?.remove()
          popup = null
          currentProps = null
        },
      }
    },

    command({ editor, range, props }: { editor: Editor; range: Range; props: { id: string | null; label?: string | null } }) {
      editor.chain().focus().deleteRange(range).insertContent({
        type: 'mention',
        attrs: { id: props.id ?? '', label: props.label ?? '' },
      }).run()
    },
  }
}

export default function BloqueTexto({ bloque, onChange, onSlashCommand, paginas = [], onNavegar }: Props) {
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
      Mention.configure({
        HTMLAttributes: { class: 'page-mention' },
        renderHTML({ options, node }) {
          return [
            'a',
            {
              ...options.HTMLAttributes,
              'data-id': node.attrs.id,
              href: '#',
            },
            `${node.attrs.label || 'Página'}`,
          ]
        },
        suggestion: crearSuggestion(paginas),
      }),
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
    editorProps: {
      handleClick: (_view, _pos, event) => {
        const target = event.target as HTMLElement
        if (target.classList.contains('page-mention')) {
          const id = target.getAttribute('data-id')
          if (id && onNavegar) {
            event.preventDefault()
            onNavegar(id)
          }
        }
        return false
      },
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
