import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import CourseList from './pages/CourseList';
import CourseView from './pages/CourseView';
import UnitView from './pages/UnitView';
import { getMockData } from './data/mockDataLoader';

const mockData = getMockData();

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<CourseList courses={mockData.courses} />} />
          <Route path="/courses/:courseId" element={<CourseView />} />
          <Route path="/courses/:courseId/units/:unitId" element={<UnitView />} />
          <Route path="/courses/:courseId/units/:unitId/lessons/:lessonId" element={<UnitView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}
