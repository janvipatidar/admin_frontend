// App-level routing
import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import ProtectedRoute from './components/ProtectedRoute';
import AddCandidate from './pages/AddCandidate';
import CandidateDetail from './pages/CandidateDetail';
import Candidates from './pages/Candidates';
import Contacts from './pages/Contacts';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';

const App = () => (
  <Routes>
    {/* Public */}
    <Route path="/admin/login" element={<Login />} />

    {/* Protected admin pages */}
    <Route
      path="/admin/dashboard"
      element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/candidates"
      element={
        <ProtectedRoute>
          <Candidates />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/contacts"
      element={
        <ProtectedRoute>
          <Contacts />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/candidate/new"
      element={
        <ProtectedRoute>
          <AddCandidate />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/candidate/:id"
      element={
        <ProtectedRoute>
          <CandidateDetail />
        </ProtectedRoute>
      }
    />

    {/* Defaults */}
    <Route path="/" element={<Navigate to="/admin/login" replace />} />
    <Route path="*" element={<Navigate to="/admin/login" replace />} />
  </Routes>
);

export default App;
