import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SignInPage from './pages/auth-flow/SignInPage';
import SignUpPage from './pages/auth-flow/SignUpPage';

function App() {
  return (
    <div>
      <Router>
        <Routes>
          <Route path="/" element={<SignInPage />} />
          <Route path="/sign-up" element={<SignUpPage />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
