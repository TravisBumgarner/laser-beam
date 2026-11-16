import { useEffect, useRef, useState } from 'react'
import type { ChatMessage, SavedChat } from '../../shared/api'
import Panel from './Panel'

const AiPanel = ({ initialPrompt, initialChat }: { initialPrompt: string; initialChat?: SavedChat | null }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialChat?.messages ?? [])
  const [sessionId, setSessionId] = useState<string | null>(initialChat?.id ?? null)
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView()
  }, [messages, thinking])

  const sentInitial = useRef(false)
  useEffect(() => {
    if (sentInitial.current || !initialPrompt.trim()) return
    sentInitial.current = true
    send(initialPrompt)
  })

  const send = async (prompt = input) => {
    const text = prompt.trim()
    if (!text || thinking) return
    setMessages((m) => [...m, { role: 'user', content: text }])
    setInput('')
    setError(null)
    setThinking(true)
    const result = await window.api.chat(text, sessionId)
    setThinking(false)
    if (result.ok) {
      setSessionId(result.sessionId)
      setMessages((m) => [...m, { role: 'assistant', content: result.text }])
    } else {
      setError(result.error)
    }
  }

  return (
    <Panel title="AI" tips={['↵ send', '⌘[ back', 'esc close']}>
      {messages.length > 0 && (
        <div className="chat">
          {messages.map((m, i) => (
            <div key={`${i}-${m.role}`} className={`bubble ${m.role}`}>
              {m.content}
            </div>
          ))}
          {thinking && <div className="bubble assistant muted">…</div>}
          <div ref={endRef} />
        </div>
      )}
      {error && <div className="output error">{error}</div>}
      <input
        autoFocus
        className="field"
        placeholder="Ask Claude…"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') send()
        }}
      />
    </Panel>
  )
}

export default AiPanel
