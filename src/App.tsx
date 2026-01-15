import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import MeetingDetail from './pages/MeetingDetail';
import MeetingHistory from './pages/MeetingHistory';
import Settings from './pages/Settings';
import Setup from './pages/Setup';
import AdminOrchestrator from './pages/AdminOrchestrator';
import AmbientDisplay from './pages/AmbientDisplay';
import DemoModeControls from './components/DemoModeControls';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/setup" element={<Setup />} />
        <Route path="/admin" element={<AdminOrchestrator />} />
        <Route path="/display" element={<AmbientDisplay />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="meeting/:id" element={<MeetingDetail />} />
          <Route path="history" element={<MeetingHistory />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
      <DemoModeControls />
    </BrowserRouter>
  );
}

export default App;
