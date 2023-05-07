import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/home/HomePage';
import TypingPage from './pages/typing/TypingPage';
import PhraseBoardsPage from './pages/phrases/PhraseBoardsPage';
import AddPhraseBoardPage from './pages/phrases/AddPhraseBoardPage';
import EditPhraseBoardPage from './pages/phrases/EditPhraseBoardPage';
import PhrasesPage from './pages/phrases/PhrasesPage';
import AddPhrasePage from './pages/phrases/AddPhrasePage';
import SignInPage from './pages/auth-flow/SignInPage';
import SignUpPage from './pages/auth-flow/SignUpPage';
import ResetPasswordPage from './pages/auth-flow/ResetPasswordPage';
import AccountPage from './pages/auth-flow/AccountPage';

function App() {
  return (
    <div>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/type" element={<TypingPage />} />
          <Route path="/boards" element={<PhraseBoardsPage />} />
          <Route path="/boards/add" element={<AddPhraseBoardPage />} />
          <Route path="/boards/edit/:id" element={<EditPhraseBoardPage />} />
          <Route path="/boards/:id/phrases" element={<PhrasesPage />} />
          <Route path="/boards/:id/phrases/add" element={<AddPhrasePage />} />
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/sign-up" element={<SignUpPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/account" element={<AccountPage />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
