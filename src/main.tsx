import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Route, Routes } from 'react-router-dom'
import './styles.css'
import { AppProvider } from './data/store'
import Layout from './components/Layout'
import Home from './pages/Home'
import About from './pages/About'
import PatchNotes from './pages/PatchNotes'
import Dotle from './games/Dotle'
import Quiz from './games/Quiz'
import Lore from './games/Lore'
import Icons from './games/Icons'

// HashRouter: o GitHub Pages não reescreve rotas, então o # evita 404 ao
// recarregar em /quiz ou compartilhar um link direto.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/dotle" element={<Dotle />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/lore" element={<Lore />} />
            <Route path="/icones" element={<Icons />} />
            <Route path="/patch" element={<PatchNotes />} />
            <Route path="/sobre" element={<About />} />
            <Route path="*" element={<Home />} />
          </Route>
        </Routes>
      </HashRouter>
    </AppProvider>
  </StrictMode>
)
