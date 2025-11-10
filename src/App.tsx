import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './Layout'
import Diagrams from './pages/Diagrams'
import Devices from './pages/Devices'
import DiagramEditor from './pages/DiagramEditor'
import './App.css'

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/Diagrams" replace />} />
          <Route path="/Diagrams" element={<Diagrams />} />
          <Route path="/Devices" element={<Devices />} />
          <Route path="/DiagramEditor" element={<DiagramEditor />} />
          <Route path="*" element={<Navigate to="/Diagrams" replace />} />
        </Routes>
      </Layout>
    </Router>
  )
}
