import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import Home from './pages/Home'
import Join from './pages/Join'
import Create from './pages/Create'
import Lobby from './pages/Lobby'
import Play from './pages/Play'
import End from './pages/End'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="join" element={<Join />} />
          <Route path="create" element={<Create />} />
          <Route path="lobby" element={<Lobby />} />
          <Route path="play" element={<Play />} />
          <Route path="end" element={<End />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
