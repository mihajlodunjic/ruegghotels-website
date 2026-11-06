import { useRef, useState } from 'react'
import shared from '../pages/Pages.module.css'
import styles from './CopyTextAction.module.css'
export function CopyTextAction({ text, label = 'Copy itinerary' }: { text: string; label?: string }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'manual'>('idle')
  const manual = useRef<HTMLTextAreaElement>(null)
  async function copy() {
    try { await navigator.clipboard.writeText(text); setStatus('copied') }
    catch { setStatus('manual'); requestAnimationFrame(() => { manual.current?.focus(); manual.current?.select() }) }
  }
  return <div className={styles.copy}><button className={shared.link} type="button" onClick={() => void copy()}>{label} <span aria-hidden="true">{status === 'copied' ? '✓' : '↗'}</span></button><p role="status" className={styles.status}>{status === 'copied' ? 'Copied to your clipboard.' : status === 'manual' ? 'Copying isn’t available here. Select and copy the text below.' : ''}</p>{status === 'manual' && <label className={styles.manual}>Your itinerary text<textarea ref={manual} readOnly value={text} rows={10} /></label>}</div>
}
