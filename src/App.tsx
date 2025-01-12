import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import CourseList from './pages/CourseList';
import CourseView from './pages/CourseView';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<CourseList />} />
          <Route path="/course/:courseId" element={<CourseView />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
