import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import '@fontsource/public-sans/400.css';
import '@fontsource/public-sans/500.css';
import '@fontsource/public-sans/600.css';
import '@fontsource/public-sans/700.css';
import '@fontsource/public-sans/800.css';
import { ColorModeProvider } from './ColorModeContext';
import { RoleProvider } from './RoleContext';
import { PortProvider } from './demo/PortStore';
import { LanguageProvider } from './i18n/LanguageContext';
import SessionGate from './demo/blocks/SessionGate';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ColorModeProvider>
      <LanguageProvider>
      <SessionGate>
      <RoleProvider>
      <PortProvider>
        <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <App />
        </HashRouter>
      </PortProvider>
      </RoleProvider>
      </SessionGate>
      </LanguageProvider>
    </ColorModeProvider>
  </React.StrictMode>,
);
