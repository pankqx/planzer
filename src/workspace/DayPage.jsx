import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { TaskList, TaskItem } from '@tiptap/extension-list'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import Highlight from '@tiptap/extension-highlight'
import { useStore } from '../store'
import { getNote, putNote, dropNote, compressImage } from '../lib/db'
import { MONTHS, parseKey } from '../lib/date'
import { addDays, todayKey } from '../lib/tasks'
import { TaskRow, QuickAdd, Icon } from './TaskBits'

const WD = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/** A whole page for one day: a notebook on the right, that day's tasks and habits on the left. */
export default function DayPage() {
  const key = useStore((s) => s.dayPage)
  const openDay = useStore((s) => s.openDay)
  useEffect(() => {
    if (!key) return
    const k = (e) => {
      if (e.key === 'Escape' && !useStore.getState().taskOpen) openDay(null)
    }
    addEventListener('keydown', k)
    return () => removeEventListener('keydown', k)
  }, [key, openDay])
  return (
    <AnimatePresence>
      {key && (
        <motion.div key="dp" className="dp-veil" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="dp" initial={{ y: 60, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
            <Page dateKey={key} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Page({ dateKey }) {
  const openDay = useStore((s) => s.openDay)
  const tasks = useStore((s) => s.tasks)
  const habits = useStore((s) => s.habits)
  const toggleHabit = useStore((s) => s.toggleHabit)
  const [tab, setTab] = useState('notes')
  const { y, m, d } = parseKey(dateKey)
  const wd = WD[new Date(y, m, d).getDay()]
  const today = todayKey()
  const list = useMemo(() => tasks.filter((t) => t.date === dateKey && !t.parentId).sort((a, b) => a.done - b.done || (a.time || '99').localeCompare(b.time || '99') || a.priority - b.priority), [tasks, dateKey])
  const future = dateKey > today
  const rel = dateKey === today ? 'Today' : dateKey === addDays(today, 1) ? 'Tomorrow' : dateKey === addDays(today, -1) ? 'Yesterday' : null
  return (
    <>
      <header className="dp-head">
        <button className="dp-back" onClick={() => openDay(null)} aria-label="Close day page">
          ← Back
        </button>
        <div className="dp-date">
          <button className="dp-arrow" onClick={() => openDay(addDays(dateKey, -1))} aria-label="Previous day">
            ‹
          </button>
          <div className="dp-date-txt">
            <span className="dp-dn">{d}</span>
            <span>
              <b>{wd}</b>
              <small>
                {MONTHS[m]} {y} {rel && <em>{rel}</em>}
              </small>
            </span>
          </div>
          <button className="dp-arrow" onClick={() => openDay(addDays(dateKey, 1))} aria-label="Next day">
            ›
          </button>
        </div>
        <div className="dp-tabs" role="tablist">
          <button className={tab === 'notes' ? 'on' : ''} onClick={() => setTab('notes')}>
            Notes
          </button>
          <button className={tab === 'tasks' ? 'on' : ''} onClick={() => setTab('tasks')}>
            Tasks {list.filter((t) => !t.done).length > 0 && <b>{list.filter((t) => !t.done).length}</b>}
          </button>
        </div>
      </header>
      <div className={`dp-body show-${tab}`}>
        <aside className="dp-side">
          <div className="dp-h">To-do</div>
          <ul className="tlist">
            {list.map((t) => (
              <TaskRow key={t.id} t={t} showDate={false} />
            ))}
          </ul>
          {!list.length && <p className="dp-empty">No tasks yet for this day.</p>}
          <QuickAdd date={dateKey} placeholder="Add a task for this day…" />
          {habits.length > 0 && (
            <>
              <div className="dp-h" style={{ marginTop: 22 }}>
                Habits
              </div>
              <div className="dp-habits">
                {habits.map((h) => {
                  const on = !!h.log[dateKey]
                  return (
                    <button key={h.id} className={on ? 'on' : ''} style={{ '--c': h.color }} disabled={future} onClick={() => toggleHabit(h.id, dateKey)}>
                      <i>{on ? '✓' : ''}</i>
                      {h.name}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </aside>
        <section className="dp-notes">
          <Notebook key={dateKey} dateKey={dateKey} />
        </section>
      </div>
    </>
  )
}

const TEMPLATES = {
  Journal: '<h2>How I feel</h2><p></p><h2>Three good things</h2><ol><li><p></p></li><li><p></p></li><li><p></p></li></ol><h2>Tomorrow I will…</h2><ul data-type="taskList"><li data-type="taskItem" data-checked="false"><p></p></li></ul>',
  Meeting: '<h2>Meeting</h2><p><strong>Who:</strong> </p><p><strong>Agenda</strong></p><ul><li><p></p></li></ul><p><strong>Action items</strong></p><ul data-type="taskList"><li data-type="taskItem" data-checked="false"><p></p></li></ul>',
  Checklist: '<h2>Checklist</h2><ul data-type="taskList"><li data-type="taskItem" data-checked="false"><p></p></li><li data-type="taskItem" data-checked="false"><p></p></li></ul>',
  Plan: '<h2>Top 3 for today</h2><ol><li><p></p></li><li><p></p></li><li><p></p></li></ol><h3>Morning</h3><p></p><h3>Afternoon</h3><p></p><h3>Evening</h3><p></p>',
}

function summarize(editor) {
  const text = editor.getText({ blockSeparator: ' ' }).replace(/\s+/g, ' ').trim()
  let images = 0
  editor.state.doc.descendants((n) => {
    if (n.type.name === 'image') images++
  })
  let todos = 0
  let doneTodos = 0
  editor.state.doc.descendants((n) => {
    if (n.type.name === 'taskItem') {
      todos++
      if (n.attrs.checked) doneTodos++
    }
  })
  return { preview: text.slice(0, 160), words: text ? text.split(' ').length : 0, images, todos, doneTodos, updated: Date.now() }
}

function Notebook({ dateKey }) {
  const setNoteIndex = useStore((s) => s.setNoteIndex)
  const [loaded, setLoaded] = useState(false)
  const [saved, setSaved] = useState('')
  const [info, setInfo] = useState(null)
  const timer = useRef()
  const fileRef = useRef()

  const insertFiles = useCallback(async (editor, files, pos) => {
    for (const f of files) {
      if (!f.type.startsWith('image/')) continue
      const src = await compressImage(f)
      const chain = editor.chain().focus()
      if (pos != null) chain.insertContentAt(pos, { type: 'image', attrs: { src } })
      else chain.setImage({ src })
      chain.run()
    }
  }, [])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: { openOnClick: false, autolink: true, linkOnPaste: true, HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' } } }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Image.configure({ allowBase64: true }),
      Highlight,
      Placeholder.configure({ placeholder: ({ node }) => (node.type.name === 'heading' ? 'Heading' : 'Write anything… type “[] ” for a checkbox, “- ” for a list, “# ” for a heading') }),
    ],
    editorProps: {
      attributes: { class: 'nb-doc', spellcheck: 'true' },
      handlePaste: (view, event) => {
        const files = [...(event.clipboardData?.files || [])].filter((f) => f.type.startsWith('image/'))
        if (!files.length) return false
        insertFiles(editorRef.current, files)
        return true
      },
      handleDrop: (view, event) => {
        const files = [...(event.dataTransfer?.files || [])].filter((f) => f.type.startsWith('image/'))
        if (!files.length) return false
        event.preventDefault()
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos
        insertFiles(editorRef.current, files, pos)
        return true
      },
    },
    onUpdate: ({ editor }) => {
      setSaved('Saving…')
      clearTimeout(timer.current)
      timer.current = setTimeout(async () => {
        const s = summarize(editor)
        setInfo(s)
        if (editor.isEmpty && !s.images) {
          await dropNote(dateKey)
          setNoteIndex(dateKey, null)
        } else {
          await putNote(dateKey, editor.getJSON())
          setNoteIndex(dateKey, s)
        }
        setSaved('Saved')
      }, 500)
    },
  })
  const editorRef = useRef(editor)
  editorRef.current = editor

  useEffect(() => {
    if (!editor) return
    let alive = true
    getNote(dateKey).then((doc) => {
      if (!alive) return
      if (doc) editor.commands.setContent(doc, { emitUpdate: false })
      setInfo(doc ? summarize(editor) : null)
      setLoaded(true)
    })
    return () => {
      alive = false
      // flush a pending save when leaving the page
      if (timer.current) {
        clearTimeout(timer.current)
        const s = summarize(editor)
        if (editor.isEmpty && !s.images) {
          dropNote(dateKey)
          setNoteIndex(dateKey, null)
        } else {
          putNote(dateKey, editor.getJSON())
          setNoteIndex(dateKey, s)
        }
      }
    }
  }, [editor, dateKey, setNoteIndex])

  if (!editor) return null
  const empty = loaded && editor.isEmpty
  return (
    <div className="nb">
      <Toolbar editor={editor} onPhoto={() => fileRef.current.click()} />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={async (e) => {
          await insertFiles(editor, [...e.target.files])
          e.target.value = ''
        }}
      />
      <div className="nb-paper" onClick={(e) => e.target === e.currentTarget && editor.commands.focus('end')}>
        {empty && (
          <div className="nb-templates">
            <span>Start with a template:</span>
            {Object.keys(TEMPLATES).map((k) => (
              <button key={k} onClick={() => editor.chain().focus().setContent(TEMPLATES[k]).run()}>
                {k}
              </button>
            ))}
          </div>
        )}
        <EditorContent editor={editor} />
      </div>
      <footer className="nb-foot">
        <span>{info ? `${info.words} words${info.images ? ` · ${info.images} photo${info.images > 1 ? 's' : ''}` : ''}${info.todos ? ` · ${info.doneTodos}/${info.todos} checked` : ''}` : 'Empty page'}</span>
        <span className="nb-saved">{saved}</span>
      </footer>
    </div>
  )
}

const B = ({ on, title, onClick, children, disabled }) => (
  <button type="button" className={`tb ${on ? 'on' : ''}`} title={title} aria-label={title} aria-pressed={!!on} onMouseDown={(e) => e.preventDefault()} onClick={onClick} disabled={disabled}>
    {children}
  </button>
)

function Toolbar({ editor, onPhoto }) {
  const [, force] = useState(0)
  const [link, setLink] = useState(null)
  useEffect(() => {
    const f = () => force((n) => n + 1)
    editor.on('selectionUpdate', f)
    editor.on('transaction', f)
    return () => {
      editor.off('selectionUpdate', f)
      editor.off('transaction', f)
    }
  }, [editor])
  const c = () => editor.chain().focus()
  const inTask = editor.isActive('taskItem')
  const listType = inTask ? 'taskItem' : 'listItem'
  const inList = editor.isActive('listItem') || inTask
  const block = editor.isActive('heading', { level: 1 }) ? 'h1' : editor.isActive('heading', { level: 2 }) ? 'h2' : editor.isActive('heading', { level: 3 }) ? 'h3' : 'p'
  return (
    <div className="nb-tools" role="toolbar" aria-label="Formatting">
      <B title="Undo" onClick={() => c().undo().run()} disabled={!editor.can().undo()}>
        ↶
      </B>
      <B title="Redo" onClick={() => c().redo().run()} disabled={!editor.can().redo()}>
        ↷
      </B>
      <i className="sep" />
      <select
        className="tb-sel"
        value={block}
        onChange={(e) => {
          const v = e.target.value
          if (v === 'p') c().setParagraph().run()
          else c().toggleHeading({ level: Number(v[1]) }).run()
        }}
        aria-label="Text style"
      >
        <option value="p">Text</option>
        <option value="h1">Title</option>
        <option value="h2">Heading</option>
        <option value="h3">Subheading</option>
      </select>
      <i className="sep" />
      <B title="Bold" on={editor.isActive('bold')} onClick={() => c().toggleBold().run()}>
        <b>B</b>
      </B>
      <B title="Italic" on={editor.isActive('italic')} onClick={() => c().toggleItalic().run()}>
        <em>I</em>
      </B>
      <B title="Underline" on={editor.isActive('underline')} onClick={() => c().toggleUnderline().run()}>
        <u>U</u>
      </B>
      <B title="Strikethrough" on={editor.isActive('strike')} onClick={() => c().toggleStrike().run()}>
        <s>S</s>
      </B>
      <B title="Highlight" on={editor.isActive('highlight')} onClick={() => c().toggleHighlight().run()}>
        <span className="hl">H</span>
      </B>
      <i className="sep" />
      <B title="Bulleted list" on={editor.isActive('bulletList')} onClick={() => c().toggleBulletList().run()}>
        <svg viewBox="0 0 24 24">
          <circle cx="5" cy="7" r="1.3" />
          <circle cx="5" cy="12" r="1.3" />
          <circle cx="5" cy="17" r="1.3" />
          <path d="M9.5 7H20M9.5 12H20M9.5 17H20" />
        </svg>
      </B>
      <B title="Numbered list" on={editor.isActive('orderedList')} onClick={() => c().toggleOrderedList().run()}>
        <svg viewBox="0 0 24 24">
          <path d="M9.5 7H20M9.5 12H20M9.5 17H20M4 5.5h1.5v4M4 14.5c.3-.6 2-.8 2 .3 0 .8-2 1.5-2 2.7h2.2" />
        </svg>
      </B>
      <B title="Checklist" on={editor.isActive('taskList')} onClick={() => c().toggleTaskList().run()}>
        <svg viewBox="0 0 24 24">
          <rect x="3.5" y="4.5" width="6" height="6" rx="1.5" />
          <path d="M5 7.5l1.2 1.2L8.5 6M13 7.5h7.5M3.5 14.5h6v6h-6zM13 17.5h7.5" />
        </svg>
      </B>
      <B title="Indent (make a sub-list)" disabled={!inList} onClick={() => c().sinkListItem(listType).run()}>
        <svg viewBox="0 0 24 24">
          <path d="M4 5h16M10 10h10M10 14h10M4 19h16M4 9.5l3 2.5-3 2.5" />
        </svg>
      </B>
      <B title="Outdent" disabled={!inList} onClick={() => c().liftListItem(listType).run()}>
        <svg viewBox="0 0 24 24">
          <path d="M4 5h16M10 10h10M10 14h10M4 19h16M7 9.5L4 12l3 2.5" />
        </svg>
      </B>
      <i className="sep" />
      <B title="Quote" on={editor.isActive('blockquote')} onClick={() => c().toggleBlockquote().run()}>
        ❝
      </B>
      <B title="Divider" onClick={() => c().setHorizontalRule().run()}>
        ―
      </B>
      <B title="Link" on={editor.isActive('link')} onClick={() => setLink(editor.getAttributes('link').href || 'https://')}>
        <svg viewBox="0 0 24 24">
          <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
        </svg>
      </B>
      <B title="Add photo" onClick={onPhoto}>
        <svg viewBox="0 0 24 24">
          <rect x="3" y="5" width="18" height="14" rx="2.5" />
          <circle cx="9" cy="10" r="1.8" />
          <path d="M21 16l-5-5-8 8" />
        </svg>
      </B>
      <B title="Clear formatting" onClick={() => c().unsetAllMarks().clearNodes().run()}>
        ⌫
      </B>
      {link !== null && (
        <form
          className="tb-link"
          onSubmit={(e) => {
            e.preventDefault()
            const v = link.trim()
            if (!v || v === 'https://') c().extendMarkRange('link').unsetLink().run()
            else {
              const href = /^https?:\/\//i.test(v) ? v : `https://${v}`
              if (editor.state.selection.empty && !editor.isActive('link')) c().insertContent({ type: 'text', text: v.replace(/^https?:\/\//, ''), marks: [{ type: 'link', attrs: { href } }] }).run()
              else c().extendMarkRange('link').setLink({ href }).run()
            }
            setLink(null)
          }}
        >
          <input autoFocus value={link} onChange={(e) => setLink(e.target.value)} placeholder="Paste a link" onKeyDown={(e) => e.key === 'Escape' && setLink(null)} />
          <button type="submit">Save</button>
          <button type="button" onClick={() => (c().extendMarkRange('link').unsetLink().run(), setLink(null))}>
            Remove
          </button>
        </form>
      )}
    </div>
  )
}
