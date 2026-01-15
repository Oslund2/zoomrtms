import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { DemoModeProvider } from './contexts/DemoModeContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DemoModeProvider>
      <App />
    </DemoModeProvider>
  </StrictMode>
);
