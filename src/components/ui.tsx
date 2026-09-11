import type { ReactNode } from 'react'
import { img } from '../lib/util'
import type { Hero } from '../types'
import { useT } from '../data/store'

export function Button({
  children,
  onClick,
  variant = 'solid',
  size = 'md',
  disabled,
  type = 'button',
  className = '',
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'solid' | 'ghost' | 'quiet'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  type?: 'button' | 'submit'
  className?: string
}) {
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }
  const variants = {
    solid:
      'bg-gold text-ink-900 font-semibold hover:bg-gold-bright shadow-[0_0_20px_-6px] shadow-gold/60',
    ghost: 'border border-line text-parch hover:border-gold hover:text-gold-bright',
    quiet: 'text-parch-dim hover:text-parch',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg transition-colors disabled:opacity-40 disabled:pointer-events-none ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`panel gilded ${className}`}>{children}</div>
}

export function Portrait({ hero, size = 'md' }: { hero: Hero; size?: 'xs' | 'sm' | 'md' | 'lg' }) {
  const sizes = {
    xs: 'w-12 h-7',
    sm: 'w-16 h-9',
    md: 'w-24 h-14',
    lg: 'w-40 h-[5.6rem]',
  }
  return (
    <img
      src={img(hero.img)}
      alt={hero.name}
      loading="lazy"
      className={`${sizes[size]} shrink-0 rounded object-cover`}
    />
  )
}

/** Barra de status compartilhada pelos jogos. */
export function ScoreBar({
  score,
  streak,
  best,
  progress,
}: {
  score?: number
  streak?: number
  best?: number
  progress?: [number, number]
}) {
  const t = useT()
  const cell = (label: string, value: ReactNode) => (
    <div className="text-center">
      <div className="text-[0.65rem] uppercase tracking-widest text-parch-faint">{label}</div>
      <div className="font-display text-xl text-gold-bright tabular-nums">{value}</div>
    </div>
  )
  return (
    <div className="flex items-center justify-center gap-8">
      {progress && cell(t.common.question, `${progress[0]}/${progress[1]}`)}
      {score !== undefined && cell(t.common.score, score)}
      {streak !== undefined && cell(t.common.streak, streak)}
      {best !== undefined && cell(t.common.best, best)}
    </div>
  )
}

/** Botão de alternativa: neutro enquanto não responde, verde/vermelho depois. */
export function Choice({
  children,
  onClick,
  state,
}: {
  children: ReactNode
  onClick: () => void
  state: 'idle' | 'right' | 'wrong' | 'dimmed'
}) {
  const styles = {
    idle: 'border-line bg-ink-700/70 hover:border-gold hover:bg-ink-600 cursor-pointer',
    right: 'border-hit bg-hit/25 text-parch',
    wrong: 'border-str bg-str/15 text-parch anim-shake',
    dimmed: 'border-line/50 bg-ink-800/50 text-parch-faint',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={state !== 'idle'}
      className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors ${styles[state]}`}
    >
      {children}
    </button>
  )
}

export function Loading({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-parch-dim">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-gold" />
      <p className="font-display text-sm tracking-wide">{label}</p>
    </div>
  )
}

export function SectionTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-6 text-center">
      <h2 className="font-display text-2xl text-parch sm:text-3xl">{children}</h2>
      {sub && <p className="mt-1 text-sm text-parch-dim">{sub}</p>}
    </div>
  )
}
