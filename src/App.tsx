import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Layout from './components/Layout';
import CourseList from './pages/CourseList';
import CourseView from './pages/CourseView';
import Login from './pages/Login';
import PasswordReset from './pages/PasswordReset';
import Notebook from './pages/Notebook';
import Help from './pages/Help';
import { useAuth } from './hooks/useAuth';
import { ThemeProvider } from './contexts/ThemeContext';
import { FontSizeProvider } from './contexts/FontSizeContext';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import QuizResults from './pages/QuizResults';

// Lazy load admin-related components
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminQuizResults = lazy(() => import('./pages/AdminQuizResults'));
const CourseStudentsPage = lazy(() => import('./pages/CourseStudentsPage'));

import WeChatBrowserWarning from './components/WeChatBrowserWarning';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <>
      <WeChatBrowserWarning />
      <ThemeProvider>
        <FontSizeProvider>
          <AuthProvider>
            <LanguageProvider>
              <Router>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/reset-password" element={<PasswordReset />} />
                  
                  {/* Public routes */}
                  <Route path="/" element={
                    <Layout>
                      <CourseList />
                    </Layout>
                  } />
                  
                  <Route path="/courses" element={
                    <Layout>
                      <CourseList myCourses={false} />
                    </Layout>
                  } />
                  
                  <Route path="/mycourses" element={
                    <Layout>
                      <CourseList myCourses={true} />
                    </Layout>
                  } />

                  <Route path="/help" element={
                    <Layout>
                      <Help />
                    </Layout>
                  } />
                  
                  {/* Protected routes */}
                  <Route path="/:courseId" element={
                    <ProtectedRoute>
                      <Layout>
                        <CourseView />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/:courseId/:lessonId" element={
                    <ProtectedRoute>
                      <Layout>
                        <CourseView />
                      </Layout>
                    </ProtectedRoute>
                  } />

                  <Route path="/:courseId/:unitId/:lessonId" element={
                    <ProtectedRoute>
                      <Layout>
                        <CourseView />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin" element={
                    <ProtectedRoute>
                      <Layout>
                        <Suspense fallback={<div>Loading admin dashboard...</div>}>
                          <AdminDashboard />
                        </Suspense>
                      </Layout>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/courses/:courseId" element={
                    <ProtectedRoute>
                      <Layout>
                        <Suspense fallback={<div>Loading admin dashboard...</div>}>
                          <AdminDashboard />
                        </Suspense>
                      </Layout>
                    </ProtectedRoute>
                  } />
                  <Route path="/notebook" element={
                    <ProtectedRoute>
                      <Layout>
                        <Notebook />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  <Route path="/quiz/:courseId" element={
                    <ProtectedRoute>
                      <Layout>
                        <QuizResults />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  <Route path="/notebook/:courseId" element={
                    <ProtectedRoute>
                      <Layout>
                        <Notebook />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/quiz/:courseId" element={
                    <ProtectedRoute>
                      <Layout>
                        <Suspense fallback={<div>Loading admin quiz results...</div>}>
                          <AdminQuizResults />
                        </Suspense>
                      </Layout>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/courses/:courseId/students" element={
                    <ProtectedRoute>
                      <Layout>
                        <Suspense fallback={<div>Loading course students...</div>}>
                          <CourseStudentsPage />
                        </Suspense>
                      </Layout>
                    </ProtectedRoute>
                  } />
                </Routes>
              </Router>
            </LanguageProvider>
          </AuthProvider>
        </FontSizeProvider>
      </ThemeProvider>
    </>
  );
}

export default App;
