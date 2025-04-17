import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import Firebase from './business-logic/backend/Firebase';

Firebase.setup();

const element = document.getElementById('root');
if (!element) {
  throw new Error('Could not find element with id "root"');
}
const root = ReactDOM.createRoot(element);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();