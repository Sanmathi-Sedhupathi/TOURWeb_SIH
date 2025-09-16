import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import enhancedAnomalyWatcher from './services/enhancedAnomalyWatcher';
import { startZoneWatcher } from './services/zoneWatcher';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

// Start enhanced anomaly watcher
try { enhancedAnomalyWatcher.start(); } catch (e) { console.warn('Enhanced anomaly watcher failed to start:', e); }
try { startZoneWatcher(); } catch (e) { /* noop */ }
