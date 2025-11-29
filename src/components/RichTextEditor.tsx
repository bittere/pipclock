import { useEditor, EditorContent } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import { Bold, Italic, Underline as UnderlineIcon, Code, Link as LinkIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useEffect, useImperativeHandle, forwardRef } from 'react'
import type { Editor } from '@tiptap/react'

const lowlight = createLowlight(common)

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  placeholder?: string
  className?: string
  autoFocus?: boolean
}

export interface RichTextEditorRef {
  editor: Editor | null
  insertText: (text: string) => void
}

const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(({ 
  value, 
  onChange, 
  onSubmit, 
  placeholder = 'Type a message...', 
  className,
  autoFocus = false
}, ref) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // We use the lowlight extension
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary transition-colors cursor-pointer',
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty before:content-[attr(data-placeholder)] before:text-muted-foreground before:float-left before:pointer-events-none before:h-0',
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'bg-muted rounded-md p-3 font-mono text-sm my-2',
        },
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[44px] py-3 px-4',
      },
      handleKeyDown: (_view, event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault()
          onSubmit()
          return true
        }
        return false
      },
    },
    onUpdate: ({ editor }) => {
      // Get HTML content, but if it's just empty paragraph, return empty string
      const html = editor.getHTML()
      const text = editor.getText()
      
      if (text.trim() === '' && !html.includes('<img')) {
        onChange('')
      } else {
        onChange(html)
      }
    },
  })

  // Sync external value changes (e.g. clearing after submit)
  useEffect(() => {
    if (editor && value === '' && editor.getText() !== '') {
      editor.commands.clearContent()
    }
  }, [value, editor])

  useEffect(() => {
    if (editor && autoFocus) {
      editor.commands.focus()
    }
  }, [editor, autoFocus])

  // Expose editor instance to parent via ref
  useImperativeHandle(ref, () => ({
    editor,
    insertText: (text: string) => {
      if (editor) {
        editor.chain().focus().insertContent(text).run()
      }
    }
  }), [editor])

  if (!editor) {
    return null
  }

  const toggleLink = () => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)

    // cancelled
    if (url === null) {
      return
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    // update
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  return (
    <div className={cn("relative flex flex-col w-full", className)}>
      {editor && (
        <BubbleMenu editor={editor} className="flex items-center gap-1 p-1 rounded-lg border bg-background shadow-lg">
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8", editor.isActive('bold') && "bg-muted text-foreground")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8", editor.isActive('italic') && "bg-muted text-foreground")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8", editor.isActive('underline') && "bg-muted text-foreground")}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8", editor.isActive('link') && "bg-muted text-foreground")}
            onClick={toggleLink}
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8", editor.isActive('codeBlock') && "bg-muted text-foreground")}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          >
            <Code className="h-4 w-4" />
          </Button>
        </BubbleMenu>
      )}
      
      <EditorContent editor={editor} className="max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground scrollbar-track-transparent" />
    </div>
  )
})

RichTextEditor.displayName = 'RichTextEditor'

export default RichTextEditor
