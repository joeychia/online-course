import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Button,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import QuizView from '../components/QuizView';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { firestoreService } from '../services/firestoreService';
import { convertChinese } from '../utils/chineseConverter';
import { useParams } from 'react-router-dom';
import type { QuizHistory, UserProfile, Quiz } from '../types';

export default function QuizResults() {
  const { courseId = '' } = useParams<{ courseId: string; }>();
  const { currentUser } = useAuth();
  const { t, language } = useTranslation();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizHistories, setQuizHistories] = useState<QuizHistory[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [selectedHistory, setSelectedHistory] = useState<QuizHistory | null>(null);
  const [quizDialogOpen, setQuizDialogOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [courseName, setCourseName] = useState('');

  useEffect(() => {
    async function loadData() {
      if (!currentUser || !courseId) {
        setLoading(false);
        return;
      }

      try {
        const [profile, histories, course] = await Promise.all([
          firestoreService.getUserById(currentUser.uid),
          firestoreService.getQuizHistoryForUserCourse(currentUser.uid, courseId),
          firestoreService.getCourseById(courseId)
        ]);

        setUserProfile(profile);
        setQuizHistories(histories ?? []);
        setCourseName(course?.name ?? '');
        setError(null);
      } catch (err) {
        setError(t('failedToLoadQuizResults'));
        console.error('Error loading quiz results:', err);
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [courseId, currentUser]);

  useEffect(() => {
    async function checkAdminStatus() {
      if (currentUser) {
        const profile = await firestoreService.getUserById(currentUser.uid);
        setIsAdmin(profile?.roles?.admin || false);
      }
    }
    void checkAdminStatus();
  }, [currentUser]);

  const handleDownloadCSV = () => {
    if (!userProfile) return;

    const csvContent = [
      ['Unit', 'Score (%)', 'Correct', 'Total', 'Date'].join(','),
      ...quizHistories.map(history => [
        history.title || '',
        history.score.toFixed(2),
        history.correct,
        history.total,
        new Date(history.completedAt).toLocaleDateString('en-US')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `quiz-${userProfile.name}-${userProfile.email}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!currentUser) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="warning">{t('pleaseSignIn')}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      {courseName && (
        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          {convertChinese(courseName, language)}
        </Typography>
      )}
      
      <Typography variant="h5" gutterBottom>
        {t('quizResults')}
      </Typography>



      {isAdmin && userProfile && (
        <Button
          variant="contained"
          color="primary"
          onClick={handleDownloadCSV}
          sx={{ mb: 2 }}
        >
          Download CSV
        </Button>
      )}

      {userProfile && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography>
            {t('name')}: {userProfile.name}
          </Typography>
          <Typography>
            {t('email')}: {userProfile.email}
          </Typography>
        </Paper>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('unit')}</TableCell>
              <TableCell align="right">{t('score')}</TableCell>
              <TableCell align="right">{t('correct')}</TableCell>
              <TableCell align="right">{t('date')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {quizHistories.length && quizHistories.map((history) => (
              <TableRow 
                key={`${history.quizId}-${history.completedAt}`}
                onClick={async () => {
                  try {
                    const quiz = await firestoreService.getQuizById(history.quizId);
                    setSelectedQuiz(quiz);
                    setSelectedHistory(history);
                    setQuizDialogOpen(true);
                  } catch (err) {
                    console.error('Error loading quiz:', err);
                  }
                }}
                sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
              >
                <TableCell>
                  {convertChinese(history.title || '', language)}
                </TableCell>
                <TableCell align="right">
                  {history.score.toFixed(2)}%
                </TableCell>
                <TableCell align="right">
                  {history.correct}/{history.total}
                </TableCell>
                <TableCell align="right">
                  {new Date(history.completedAt).toLocaleDateString(
                    language === 'zh-TW' ? 'zh-TW' : 'zh-CN',
                    { year: 'numeric', month: 'long', day: 'numeric' }
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog 
        open={quizDialogOpen} 
        onClose={() => setQuizDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ m: 0, p: 2, pr: 6 }}>
          {t('quizResults')}
          <IconButton
            onClick={() => setQuizDialogOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedQuiz && (
            <QuizView 
              quiz={selectedQuiz} 
              onSubmit={() => {}} 
              onClose={() => setQuizDialogOpen(false)}
              readOnlyAnswers={selectedHistory?.answers}
            />
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
}