import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles.css';
import App from './App.jsx';
import AdminPage from './Admin.jsx';

const Page = window.location.pathname === '/admin' || window.location.pathname === '/admin/'
  ? AdminPage
  : App;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Page />
  </React.StrictMode>,
);
