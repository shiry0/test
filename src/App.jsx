import { useState } from 'react'
import JezeroMap from './components/JezeroMap.jsx'
import MarsGame from './game/MarsGame.jsx'

export default function App() {
  const [view, setView] = useState('regional')
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return <div className="map-app">
    <nav className="map-app-nav" aria-label="Map views">
      <strong>orbital<span>.</span></strong>
      <div>
        <button className={view === 'regional' ? 'active' : ''} onClick={() => setView('regional')}>Regional 2D map</button>
        <button className={view === 'game' ? 'active' : ''} onClick={() => setView('game')}>Game map + minimap</button>
      </div>
    </nav>
    {view === 'regional' ? <JezeroMap onBack={() => setView('game')} /> : <MarsGame onExit={() => setView('regional')} reducedMotion={reducedMotion} />}
  </div>
}
