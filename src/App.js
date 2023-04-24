import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SignInPage from './pages/auth-flow/SignInPage';
import SignUpPage from './pages/auth-flow/SignUpPage';
import ResetPasswordPage from './pages/auth-flow/ResetPasswordPage';

function App() {
  return (
    <div>
      <Router>
        <Routes>
          <Route path="/" element={<SignInPage />} />
          <Route path="/sign-up" element={<SignUpPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
