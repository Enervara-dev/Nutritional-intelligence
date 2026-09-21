import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <nav className="nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="nav-brand">ENERVARA</span>
          <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.18)', color: 'white', padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>
            Intelligence Suite
          </span>
        </div>
        <div className="nav-links">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            📌 All in One
          </NavLink>
          <NavLink to="/food" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            🥗 Food
          </NavLink>
          <NavLink to="/workout" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            🏃 Workout
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            👤 Profile
          </NavLink>
        </div>
      </nav>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard initialSection="all" />} />
          <Route path="/food" element={<Dashboard initialSection="food" />} />
          <Route path="/workout" element={<Dashboard initialSection="workout" />} />
          <Route path="/profile" element={<Dashboard initialSection="profile" />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
