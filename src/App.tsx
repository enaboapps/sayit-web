import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/home/HomePage';
import TypingPage from './pages/typing/TypingPage';
import PhraseBoardsPage from './pages/phrases/PhraseBoardsPage';
import AddPhraseBoardPage from './pages/phrases/AddPhraseBoardPage';
import EditPhraseBoardPage from './pages/phrases/EditPhraseBoardPage';
import PhrasesPage from './pages/phrases/PhrasesPage';
import AddPhrasePage from './pages/phrases/AddPhrasePage';
import EditPhrasePage from './pages/phrases/EditPhrasePage';
import SettingsLandingPage from './settings/ui/SettingsLandingPage';
import SignInPage from './pages/auth-flow/SignInPage';
import SignUpPage from './pages/auth-flow/SignUpPage';
import ResetPasswordPage from './pages/auth-flow/ResetPasswordPage';
import AccountPage from './pages/auth-flow/AccountPage';
import Paywall from './business-logic/payments/ui/Paywall';
import PaymentSuccess from './business-logic/payments/ui/PaymentSuccess';
import PaymentCancel from './business-logic/payments/ui/PaymentCancel';

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
          <Route path="/boards/:id/phrases/edit/:phraseId" element={<EditPhrasePage />} />
          <Route path="/settings" element={<SettingsLandingPage />} />
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/sign-up" element={<SignUpPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/paywall" element={<Paywall />} />
          <Route path="/paywall/success" element={<PaymentSuccess />} />
          <Route path="/paywall/cancel" element={<PaymentCancel />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
