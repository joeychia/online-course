import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
          <Route path="/:courseId" element={<CourseView />} />
          <Route path="/:courseId/:lessonId" element={<UnitView />} />
        </Routes>
      </Layout>
    </Router>
  );
}
