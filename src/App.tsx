import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import CourseList from './pages/CourseList';
import CourseView from './pages/CourseView';
import Login from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import Notebook from './pages/Notebook';
import { useAuth } from './contexts/useAuth';
import { ThemeProvider } from './contexts/ThemeContext';
import { FontSizeProvider } from './contexts/FontSizeContext';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';

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
                  
                  {/* Public routes */}
                  <Route path="/" element={
                    <Layout>
                      <CourseList />
                    </Layout>
                  } />
                  
                  <Route path="/courses" element={
                    <Layout>
                      <CourseList />
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
                        <AdminDashboard />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/courses/:courseId" element={
                    <ProtectedRoute>
                      <Layout>
                        <AdminDashboard />
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
                  <Route path="/notebook/:courseId" element={
                    <ProtectedRoute>
                      <Layout>
                        <Notebook />
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
