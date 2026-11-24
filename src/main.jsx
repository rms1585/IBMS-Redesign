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
import { CfTrucksProvider } from './CfTrucksContext';
import { AuditProvider } from './AuditContext';
import { CfAlertsProvider } from './CfAlertsContext';
import { ManifestsProvider } from './ManifestsContext';
import { CustomsProvider } from './CustomsContext';
import { WarehouseProvider } from './WarehouseContext';
import { TruckWeightsProvider } from './TruckWeightsContext';
import { PortProvider } from './demo/PortStore';
import { LanguageProvider } from './i18n/LanguageContext';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ColorModeProvider>
      <LanguageProvider>
      <RoleProvider>
      <PortProvider>
        <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuditProvider>
            <CfTrucksProvider>
              <CfAlertsProvider>
                <ManifestsProvider>
                  <CustomsProvider>
                    <WarehouseProvider>
                      <TruckWeightsProvider>
                        <App />
                      </TruckWeightsProvider>
                    </WarehouseProvider>
                  </CustomsProvider>
                </ManifestsProvider>
              </CfAlertsProvider>
            </CfTrucksProvider>
          </AuditProvider>
        </HashRouter>
      </PortProvider>
      </RoleProvider>
      </LanguageProvider>
    </ColorModeProvider>
  </React.StrictMode>,
);
