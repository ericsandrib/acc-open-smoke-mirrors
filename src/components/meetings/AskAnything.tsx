import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { Sparkles, ArrowUp, X, SquarePen, Video, Lightbulb, Square } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ChatMessage, ChatStatus } from '@/types/meeting'
import { suggestedPrompts, matchReply } from '@/data/zions/chatScript'

marked.setOptions({ breaks: true, gfm: true })

function mdToHtml(md: string): string {
  const raw = marked.parse(md, { async: false }) as string
  return DOMPurify.sanitize(raw, { ADD_ATTR: ['target', 'rel'] })
}

/** Tokenize HTML into whole-tags + single visible chars for a tag-aware typewriter. */
function tokenize(html: string): string[] {
  const tokens: string[] = []
  let i = 0
  while (i < html.length) {
    if (html[i] === '<') {
      const close = html.indexOf('>', i)
      if (close === -1) { tokens.push(html.slice(i)); break }
      tokens.push(html.slice(i, close + 1))
      i = close + 1
    } else {
      tokens.push(html[i])
      i++
    }
  }
  return tokens
}

function useTypewriter(html: string, animate: boolean): string {
  const tokens = useMemo(() => tokenize(html), [html])
  const [n, setN] = useState(animate ? 0 : tokens.length)
  useEffect(() => {
    if (!animate) { setN(tokens.length); return }
    setN(0)
    let cur = 0
    const id = setInterval(() => {
      cur += 3
      setN(cur)
      if (cur >= tokens.length) clearInterval(id)
    }, 16)
    return () => clearInterval(id)
  }, [tokens, animate])
  return tokens.slice(0, n).join('')
}

const PROSE = 'prose prose-sm max-w-none text-[13px] leading-relaxed prose-p:my-1.5 prose-headings:font-semibold prose-table:text-xs prose-th:text-left prose-a:text-[#0b4f9c] text-foreground/90'

function AssistantBubble({ message, animate, onComplete }: { message: ChatMessage; animate: boolean; onComplete?: () => void }) {
  const html = useMemo(() => mdToHtml(message.text), [message.text])
  const displayed = useTypewriter(html, animate)
  useEffect(() => {
    if (animate && displayed === html) onComplete?.()
  }, [displayed, html, animate, onComplete])
  return (
    <div className="rounded-xl px-1 py-1">
      <div className={PROSE} dangerouslySetInnerHTML={{ __html: displayed }} />
    </div>
  )
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1 pl-3 py-2">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-foreground/40"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  )
}

export function AskAnything({ meetingSubject, relationshipId }: { meetingSubject?: string; relationshipId?: string }) {
  const prompts = suggestedPrompts(relationshipId)
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [status, setStatus] = useState<ChatStatus>('ready')
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, status])

  const submit = (raw: string) => {
    const text = raw.trim()
    if (!text || status !== 'ready') return
    const user: ChatMessage = { id: `u${Date.now()}`, role: 'user', text, isHistoric: true }
    setMessages((m) => [...m, user])
    setInput('')
    setStatus('submitted')
    if (taRef.current) taRef.current.style.height = 'auto'
    window.setTimeout(() => {
      const reply: ChatMessage = { id: `a${Date.now()}`, role: 'assistant', text: matchReply(text, relationshipId), isHistoric: false }
      setMessages((m) => [...m, reply])
      setStatus('streaming')
    }, 650)
  }

  const newChat = () => { setMessages([]); setStatus('ready') }

  return (
    <div className="fixed right-5 bottom-5 z-[60]">
      <AnimatePresence mode="wait">
        {open ? (
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="w-[420px] h-[min(70vh,600px)] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 h-12 border-b border-border">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0b4f9c] text-white"><Sparkles className="h-3.5 w-3.5" /></span>
                Ask Anything
              </div>
              <div className="flex items-center gap-1">
                <button onClick={newChat} title="New chat" className="p-1.5 rounded-md text-muted-foreground hover:bg-muted"><SquarePen className="h-4 w-4" /></button>
                <button onClick={() => setOpen(false)} title="Close" className="p-1.5 rounded-md text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col justify-center gap-4">
                  <div>
                    <p className="text-lg font-semibold text-foreground">Good morning.</p>
                    <p className="text-lg text-muted-foreground">What can I help with?</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {prompts.map((p) => (
                      <button
                        key={p}
                        onClick={() => submit(p)}
                        className="flex items-center gap-2 text-left rounded-full border border-border px-3 py-2 text-[13px] text-[#0b4f9c] hover:bg-[#0b4f9c0a] transition-colors"
                      >
                        <Lightbulb className="h-3.5 w-3.5 shrink-0" />
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {messages.map((msg, i) =>
                    msg.role === 'user' ? (
                      <div key={msg.id} className="self-end max-w-[80%] rounded-[18px] bg-muted px-4 py-2 text-sm text-foreground">
                        {msg.text}
                      </div>
                    ) : (
                      <AssistantBubble
                        key={msg.id}
                        message={msg}
                        animate={!msg.isHistoric && i === messages.length - 1 && status === 'streaming'}
                        onComplete={() => setStatus('ready')}
                      />
                    ),
                  )}
                  {status === 'submitted' && <ThinkingDots />}
                </div>
              )}
            </div>

            {/* Context chip + input */}
            <div className="border-t border-border p-3">
              {meetingSubject && messages.length === 0 && (
                <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">
                  <Video className="h-3 w-3" /> {meetingSubject}
                </div>
              )}
              <div className="flex items-end gap-2 rounded-xl border border-border bg-background px-3 py-2">
                <textarea
                  ref={taRef}
                  value={input}
                  rows={1}
                  placeholder={meetingSubject ? 'Ask about this meeting…' : 'Ask Anything…'}
                  onChange={(e) => {
                    setInput(e.target.value)
                    e.target.style.height = 'auto'
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(input) }
                  }}
                  className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground max-h-32"
                />
                <button
                  onClick={() => submit(input)}
                  disabled={status !== 'ready' || !input.trim()}
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors',
                    status !== 'ready' ? 'bg-foreground/80 text-background' : input.trim() ? 'bg-[#0b4f9c] text-white' : 'bg-muted text-muted-foreground',
                  )}
                  aria-label="Send"
                >
                  {status !== 'ready' ? <Square className="h-3.5 w-3.5" /> : <ArrowUp className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="pill"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 rounded-full border border-border bg-card pl-3 pr-1.5 py-1.5 shadow-lg hover:shadow-xl transition-shadow"
          >
            <Sparkles className="h-4 w-4 text-[#0b4f9c]" />
            <span className="text-sm font-medium text-foreground">Ask Anything</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0b4f9c0a]"><ArrowUp className="h-4 w-4 text-[#0b4f9c]" /></span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
