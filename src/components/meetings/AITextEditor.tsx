import { useEffect, useRef } from 'react'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import CharacterCount from '@tiptap/extension-character-count'
import Placeholder from '@tiptap/extension-placeholder'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Link as LinkIcon,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  NotepadText,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const CHAR_LIMIT = 32000

function ToolBarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'p-1.5 rounded-md text-foreground/70 hover:bg-muted hover:text-foreground transition-colors disabled:opacity-40',
        active && 'bg-muted text-foreground',
      )}
    >
      {children}
    </button>
  )
}

function ToolBar({ editor, disabled }: { editor: Editor | null; disabled?: boolean }) {
  if (!editor) return null
  const I = 'h-4 w-4'
  const setLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Link URL', prev ?? 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    const href = /^https?:\/\//.test(url) ? url : `https://${url}`
    editor.chain().focus().extendMarkRange('link').setLink({ href }).run()
  }
  return (
    <div className="flex items-center gap-0.5">
      <ToolBarButton title="Bold" active={editor.isActive('bold')} disabled={disabled} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className={I} /></ToolBarButton>
      <ToolBarButton title="Italic" active={editor.isActive('italic')} disabled={disabled} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className={I} /></ToolBarButton>
      <ToolBarButton title="Underline" active={editor.isActive('underline')} disabled={disabled} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon className={I} /></ToolBarButton>
      <ToolBarButton title="Strikethrough" active={editor.isActive('strike')} disabled={disabled} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough className={I} /></ToolBarButton>
      <ToolBarButton title="Link" active={editor.isActive('link')} disabled={disabled} onClick={setLink}><LinkIcon className={I} /></ToolBarButton>
      <span className="mx-1 h-5 w-px bg-border" />
      <ToolBarButton title="Heading 1" active={editor.isActive('heading', { level: 1 })} disabled={disabled} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 className={I} /></ToolBarButton>
      <ToolBarButton title="Heading 2" active={editor.isActive('heading', { level: 2 })} disabled={disabled} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className={I} /></ToolBarButton>
      <ToolBarButton title="Bullet list" active={editor.isActive('bulletList')} disabled={disabled} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className={I} /></ToolBarButton>
      <ToolBarButton title="Numbered list" active={editor.isActive('orderedList')} disabled={disabled} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className={I} /></ToolBarButton>
      <span className="mx-1 h-5 w-px bg-border" />
      <ToolBarButton title="Align left" active={editor.isActive({ textAlign: 'left' })} disabled={disabled} onClick={() => editor.chain().focus().setTextAlign('left').run()}><AlignLeft className={I} /></ToolBarButton>
      <ToolBarButton title="Align center" active={editor.isActive({ textAlign: 'center' })} disabled={disabled} onClick={() => editor.chain().focus().setTextAlign('center').run()}><AlignCenter className={I} /></ToolBarButton>
      <ToolBarButton title="Align right" active={editor.isActive({ textAlign: 'right' })} disabled={disabled} onClick={() => editor.chain().focus().setTextAlign('right').run()}><AlignRight className={I} /></ToolBarButton>
    </div>
  )
}

export function AITextEditor({
  content,
  disabled,
  bottomText,
  footer,
  onChange,
}: {
  content: string
  disabled?: boolean
  bottomText?: string
  footer?: React.ReactNode
  onChange?: (html: string) => void
}) {
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true, HTMLAttributes: { target: '_blank', rel: 'noopener' } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      CharacterCount.configure({ limit: CHAR_LIMIT }),
      Placeholder.configure({ placeholder: 'The AI summary will appear here…' }),
    ],
    content,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none px-8 py-6 min-h-[320px] focus:outline-none ' +
          'prose-headings:font-semibold prose-h2:text-lg prose-h3:text-[15px] ' +
          'prose-p:text-[15px] prose-li:text-[15px] prose-strong:text-foreground ' +
          'prose-a:text-[#0b4f9c] prose-a:underline text-foreground/90',
      },
    },
    onUpdate: ({ editor }) => {
      if (!onChange) return
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => onChange(editor.getHTML()), 1000)
    },
  })

  useEffect(() => {
    if (editor && !disabled !== editor.isEditable) editor.setEditable(!disabled)
  }, [disabled, editor])

  const count = editor?.storage.characterCount?.characters?.() ?? 0

  return (
    <div className="flex flex-col">
      {/* Header bar */}
      <div className={cn('rounded-t-xl border border-border flex items-center justify-between h-14 pl-4 pr-2', disabled ? 'bg-secondary/40' : 'bg-card')}>
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <NotepadText className="h-4 w-4 text-muted-foreground" />
          Summary
        </div>
        <ToolBar editor={editor} disabled={disabled} />
      </div>

      {/* Content */}
      <div className={cn('border-l border-r border-border', disabled ? 'bg-secondary/40' : 'bg-card')}>
        <EditorContent editor={editor} />
      </div>

      {/* Footer */}
      <div className={cn('rounded-b-xl border border-border overflow-hidden', disabled ? 'bg-secondary/40' : 'bg-card')}>
        {footer ? <div className="min-h-[56px]">{footer}</div> : <div className="h-2" />}
      </div>
      <div className="pt-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
          <Sparkles className="h-3 w-3" /> {bottomText ?? 'AI-generated draft. Review for accuracy before approving.'}
        </span>
        <span className={cn('text-xs tabular-nums', count > CHAR_LIMIT * 0.95 ? 'text-amber-600' : 'text-muted-foreground')}>
          {count.toLocaleString()} / {CHAR_LIMIT.toLocaleString()}
        </span>
      </div>
    </div>
  )
}
