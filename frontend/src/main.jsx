// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Route for the home page (Empty input) */}
        <Route path="/" element={<App />} />
        
        {/* Route for specific keywords (e.g. localhost:5173/crypto) */}
        <Route path="/:keyword" element={<App />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)