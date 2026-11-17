/**
 * Route map: public pages live outside `Layout`; forum tools use `Layout` + `ProtectedRoute`.
 * Add new `<Route>` entries here, then register the section in `config/navConfig.js`
 * (sidebar link and/or page title) so the shell stays in sync.
 */
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ChatSessionProvider } from './contexts/ChatSessionContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import Auth from './pages/Auth/Auth';
import Dashboard from './pages/Dashboard/Dashboard';
import Landing from './pages/Landing/Landing';
import MyQuestions from './pages/MyQuestions/MyQuestions';
import PostQuestion from './pages/PostQuestion/PostQuestion';
import QuestionDetail from './pages/QuestionDetail/QuestionDetail';
import RagDocuments from './pages/RagDocuments/RagDocuments';
import ChatBot from './pages/ChatBot/ChatBot';

/** Layout shell + shared Ask AI session (persists across child route changes). */
function AuthenticatedShell() {
  return (
    <ChatSessionProvider>
      <Layout />
    </ChatSessionProvider>
  );
}

function App() {
  // Theme + Sidebar providers wrap the router so shell chrome can share state.
  return (
    <ThemeProvider>
      <SidebarProvider>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public routes */}
              <Route path='/' element={<Landing />} />
              <Route path='/auth' element={<Auth />} />

              {/* Protected routes with Layout */}
              <Route element={<AuthenticatedShell />}>
                <Route path='/dashboard' element={<ProtectedRoute> <Dashboard /></ProtectedRoute> }/>
                <Route
                  path='/questions/ask'
                  element={
                    <ProtectedRoute>
                      <PostQuestion />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path='/my-questions'
                  element={
                    <ProtectedRoute>
                      <MyQuestions />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path='/questions/:questionHash'
                  element={
                    <ProtectedRoute>
                      <QuestionDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path='/rag-documents'
                  element={
                    <ProtectedRoute>
                      <RagDocuments />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path='/chatbot'
                  element={
                    <ProtectedRoute>
                      <ChatBot />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* Catch-all redirect */}
              <Route path='*' element={<Navigate to='/' replace />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </SidebarProvider>
    </ThemeProvider>
  );
}

export default App;
