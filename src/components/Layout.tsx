import { NavLink, Outlet, Link } from 'react-router-dom'
import { useStore } from '../data/store'
import { DICTS } from '../i18n/strings'
import { Loading } from './ui'

function LangSwitch() {
  const { lang, setLang } = useStore()
  return (
    <div className="flex items-center gap-1 rounded-lg border border-line p-0.5">
      {Object.values(DICTS).map((d) => (
        <button
          key={d.code}
          type="button"
          onClick={() => setLang(d.code)}
          title={d.label}
          aria-pressed={lang === d.code}
          className={`rounded px-2 py-1 text-xs transition-colors ${
            lang === d.code ? 'bg-gold text-ink-900 font-semibold' : 'text-parch-dim hover:text-parch'
          }`}
        >
          <span aria-hidden>{d.flag}</span>
          <span className="ml-1 hidden sm:inline">{d.code === 'pt-BR' ? 'PT' : 'EN'}</span>
        </button>
      ))}
    </div>
  )
}

export default function Layout() {
  const { t, status, index, reload } = useStore()

  const link = ({ isActive }: { isActive: boolean }) =>
    `text-sm transition-colors ${isActive ? 'text-gold-bright' : 'text-parch-dim hover:text-parch'}`

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b border-line/70 bg-ink-900/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
          <Link to="/" className="font-display text-lg tracking-wide text-parch">
            Dota<span className="text-gold">quiz</span>
          </Link>
          <nav className="flex flex-1 items-center gap-5">
            <NavLink to="/" className={link} end>
              {t.nav.home}
            </NavLink>
            <NavLink to="/patch" className={link}>
              {t.nav.patch}
            </NavLink>
            <NavLink to="/sobre" className={link}>
              {t.nav.about}
            </NavLink>
          </nav>
          <LangSwitch />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {status === 'loading' && <Loading label={t.common.loading} />}
        {status === 'error' && (
          <div className="py-24 text-center">
            <p className="text-parch-dim">{t.common.error}</p>
            <button
              type="button"
              onClick={reload}
              className="mt-4 rounded-lg border border-line px-4 py-2 text-sm hover:border-gold"
            >
              {t.common.retry}
            </button>
          </div>
        )}
        {status === 'ready' && <Outlet />}
      </main>

      <footer className="border-t border-line/70 px-4 py-6 text-center text-xs text-parch-faint">
        {index && <p>{t.home.dataFrom(index.patch)}</p>}
        <p className="mt-1">Dota 2 © Valve Corporation. {t.common.disclaimer}</p>
      </footer>
    </div>
  )
}
