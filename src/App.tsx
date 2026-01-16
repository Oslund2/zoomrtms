import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import MeetingDetail from './pages/MeetingDetail';
import MeetingHistory from './pages/MeetingHistory';
import Settings from './pages/Settings';
import AdminOrchestrator from './pages/AdminOrchestrator';
import AmbientDisplay from './pages/AmbientDisplay';
import RTMSMonitor from './pages/RTMSMonitor';
import DemoModeControls from './components/DemoModeControls';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/setup" element={<Navigate to="/settings?tab=setup" replace />} />
        <Route path="/admin" element={<AdminOrchestrator />} />
        <Route path="/display" element={<AmbientDisplay />} />
        <Route path="/monitor" element={<RTMSMonitor />} />
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
