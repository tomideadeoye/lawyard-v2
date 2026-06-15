# Tiptap Rich Text Editor

## Setup

```bash
pnpm add @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-placeholder @tiptap/extension-image
```

## Component Template

```tsx
'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import LinkExtension from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import ImageExtension from '@tiptap/extension-image'

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
}

export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      LinkExtension.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Write here...' }),
      ImageExtension,
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[300px] px-4 py-3 focus:outline-none',
      },
    },
  })

  if (!editor) return null

  // Toolbar button pattern
  const ToolBtn = ({ onClick, active, children }) => (
    <button
      type="button"
      onClick={onClick}
      className={`p-1.5 rounded-md transition-colors ${
        active ? 'bg-accent/20 text-accent' : 'text-muted-foreground hover:bg-muted'
      }`}
    >
      {children}
    </button>
  )

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="flex flex-wrap gap-0.5 px-3 py-2 border-b border-border bg-muted/30">
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')}>
          <Bold className="h-4 w-4" />
        </ToolBtn>
        {/* ... more toolbar buttons ... */}
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
```

## Toolbar Actions Reference

| Action | Code |
|--------|------|
| Heading 1 | `editor.chain().focus().toggleHeading({ level: 1 }).run()` |
| Heading 2 | `editor.chain().focus().toggleHeading({ level: 2 }).run()` |
| Bold | `editor.chain().focus().toggleBold().run()` |
| Italic | `editor.chain().focus().toggleItalic().run()` |
| Bullet List | `editor.chain().focus().toggleBulletList().run()` |
| Ordered List | `editor.chain().focus().toggleOrderedList().run()` |
| Blockquote | `editor.chain().focus().toggleBlockquote().run()` |
| Link | `editor.chain().focus().setLink({ href: url }).run()` (prompt for URL) |
| Image | `editor.chain().focus().setImage({ src: url }).run()` (prompt for URL) |
| Undo | `editor.chain().focus().undo().run()` |
| Redo | `editor.chain().focus().redo().run()` |

## Check Active State

```typescript
editor.isActive('bold')
editor.isActive('heading', { level: 1 })
editor.isActive('link')
editor.isActive('bulletList')
```

## Content Format

Content is stored and retrieved as **HTML string**. Tiptap returns HTML from `editor.getHTML()`. ProseMirror's internal state preserves structured content.

## Editor Styles

- Editor container: `rounded-xl border border-border overflow-hidden bg-background`
- Toolbar: `border-b border-border bg-muted/30` with flex-wrap for responsiveness
- Editor content area: uses Tailwind Typography `prose prose-sm`
- Min height: `min-h-[300px]`
