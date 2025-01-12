import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CourseList from './pages/CourseList';
import CourseView from './pages/CourseView';
import Layout from './components/Layout';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<CourseList />} />
          <Route path="/courses/:courseId/units/:unitId" element={<CourseView />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
