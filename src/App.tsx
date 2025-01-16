import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import CourseList from './pages/CourseList';
import CourseView from './pages/CourseView';
import UnitView from './pages/UnitView';
import LessonView from './pages/LessonView';
import Login from './pages/Login';
import { useAuth } from './contexts/AuthContext';

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

export default function App() {
  return (
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
      </Routes>
    </Router>
  );
}
