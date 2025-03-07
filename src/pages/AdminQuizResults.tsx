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
  FormControlLabel,
  Checkbox,
  Button,
  Grid,
} from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { firestoreService } from '../services/firestoreService';
import { useParams } from 'react-router-dom';
import type { Course, CourseUnit } from '../types';

export default function AdminQuizResults() {
  const { courseId = '' } = useParams<{ courseId: string; }>();
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  
  const [loading, setLoading] = useState(true);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [units, setUnits] = useState<CourseUnit[]>([]);
  const [selectedUnits, setSelectedUnits] = useState<Set<string>>(new Set());
    type QuizResult = {
        userName: string;
        userEmail: string;
        unitName: string;
        score: number;
        answers: Record<string, string>;
        correctAnswers: (boolean|undefined)[];
    };

  const [quizResults, setQuizResults] = useState<Array<QuizResult>|null>(null);

  useEffect(() => {
    async function loadCourseData() {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const [courseData] = await Promise.all([
          firestoreService.getCourseById(courseId),
        ]);
        if (!courseData) throw new Error('Course not found');

        setCourse(courseData);
        setUnits(courseData.units);
      } catch (err) {
        setError(t('failedToLoadCourse'));
        console.error('Error loading course data:', err);
      } finally {
        setLoading(false);
      }
    }

    void loadCourseData();
  }, [courseId, currentUser]);

  const handleUnitToggle = (unitId: string) => {
    const newSelectedUnits = new Set(selectedUnits);
    if (selectedUnits.has(unitId)) {
      newSelectedUnits.delete(unitId);
    } else {
      if (selectedUnits.size >= 30) {
        setError(t('maxUnitsSelected', { count: 30 }));
        return;
      }
      newSelectedUnits.add(unitId);
    }
    setSelectedUnits(newSelectedUnits);
    setError(null);
  };

  const handleFetchQuizResults = async () => {
    if (selectedUnits.size === 0) return;

    try {
      setButtonLoading(true);
      const selectedUnitsArray = Array.from(selectedUnits);
      const quizHistories = await firestoreService.getQuizHistoriesByUnitIds(selectedUnitsArray);
      
      const results = await Promise.all(
        quizHistories.map(async (history) => {
          const [user, quiz] = await Promise.all([
            firestoreService.getUserById(history.userId),
            firestoreService.getQuizById(history.quizId),
          ]);

          const unit = units.find(u => 
            u.id === history.unitId
          );

          // Filter single choice questions and their answers
          const singleChoiceQuestions = quiz?.questions.filter(q => q.type === 'single_choice') || [];
          const correctAnswers = singleChoiceQuestions.map((question, index) => {
            if (!question.options) {
                return undefined;
            }
            const userAnswer = parseInt(history.answers[index]); 
            if (userAnswer >=0 && userAnswer < question.options.length) {
              const option = question.options[userAnswer];
              return option.isCorrect;
            }
            return undefined;
          });

          return {
            userName: user?.name || 'Unknown',
            userEmail: user?.email || 'Unknown',
            unitName: unit?.name || 'Unknown',
            score: history.score,
            answers: history.answers,
            correctAnswers
          };
        })
      );
      // sort results by unitName
      results.sort((a, b) => a.unitName.localeCompare(b.unitName));
      // go through each quizHistory, check if answers correctness and put it to QuizResults
      // Group results by unit
      const resultsByUnit = results.reduce((acc, result) => {
        if (!acc[result.unitName]) {
          acc[result.unitName] = [];
        }
        acc[result.unitName].push(result);
        return acc;
      }, {} as Record<string, QuizResult[]>);
      setQuizResults(Object.values(resultsByUnit).flat());
      setError(null);
    } catch (err) {
      setError(t('failedToLoadQuizResults'));
      console.error('Error fetching quiz results:', err);
    } finally {
      setButtonLoading(false);
    }
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          {course?.name} - {t('quizResults')}
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          {t('Select Units')}
        </Typography>
        <Grid container spacing={2}>
          {units.map((unit) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={unit.id}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedUnits.has(unit.id)}
                    onChange={() => handleUnitToggle(unit.id)}
                    disabled={!selectedUnits.has(unit.id) && selectedUnits.size >= 30}
                  />
                }
                label={unit.name}
                sx={{ width: '100%' }}
              />
            </Grid>
          ))}
        </Grid>
        <Button
          variant="contained"
          color="primary"
          onClick={handleFetchQuizResults}
          disabled={selectedUnits.size === 0 || buttonLoading}
          sx={{ mt: 2 }}
        >
          {buttonLoading ? (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
              {t('Fetching')}
            </Box>
          ) : (
            t('Fetch Results')
          )}
        </Button>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        {!error && !buttonLoading && quizResults && quizResults.length === 0 && selectedUnits.size > 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            {t('Result not found. Try selecting different units.')}
          </Alert>
        )}
      </Paper>

      {quizResults && quizResults.length > 0 && (
        <Box>
          {Array.from(new Set(quizResults.map(result => result.unitName))).map(unitName => (
            <Box key={unitName} sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                {unitName}
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('name')}</TableCell>
                      <TableCell>{t('email')}</TableCell>
                      <TableCell align="right">{t('score')}</TableCell>
                      {quizResults.find(r => r.unitName === unitName)?.correctAnswers.map((_, idx) => (
                        <TableCell key={idx} align="center">{`Q${idx + 1}`}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {quizResults.filter(result => result.unitName === unitName).map((result, index) => (
                      <TableRow key={index}>
                        <TableCell>{result.userName}</TableCell>
                        <TableCell>{result.userEmail}</TableCell>
                        <TableCell align="right">{result.score.toFixed(2)}%</TableCell>
                        {result.correctAnswers.map((isCorrect, idx) => (
                          <TableCell key={idx} align="center">
                            {isCorrect === undefined ? '-' : isCorrect ? '✓' : '✗'}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ))}
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 1, mb:3 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={async () => {
                try {
                  setButtonLoading(true);
                  const XLSX = await import('xlsx');
                  // Create workbook
                  const wb = XLSX.utils.book_new();
                  
                  // Group results by unit
                  const resultsByUnit = quizResults.reduce((acc, result) => {
                    if (!acc[result.unitName]) {
                      acc[result.unitName] = [];
                    }
                    acc[result.unitName].push(result);
                    return acc;
                  }, {} as Record<string, QuizResult[]>);

                  // Create a sheet for each unit
                  Object.entries(resultsByUnit).forEach(([unitName, results]) => {
                    // Prepare data for this unit
                    const sheetData = results.map(result => {
                      const row: any = {
                        'Name': result.userName,
                        'Email': result.userEmail,
                        'Score (%)': result.score.toFixed(2)
                      };
                      
                      // Add columns for each question
                      result.correctAnswers.forEach((isCorrect, idx) => {
                        row[`Q${idx + 1}`] = isCorrect === undefined ? '-' : isCorrect ? '✓' : '✗';
                      });
                      
                      return row;
                    });

                    // Create worksheet
                    const ws = XLSX.utils.json_to_sheet(sheetData);
                    XLSX.utils.book_append_sheet(wb, ws, unitName);
                  });

                  // Save the file
                  XLSX.writeFile(wb, `${course?.name || 'quiz-results'}.xlsx`);
                } catch (error) {
                  console.error('Error generating Excel file:', error);
                  setError(t('failedToGenerateExcel'));
                } finally {
                  setButtonLoading(false);
                }
              }}
            >
              {buttonLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                  {t('Generating')}
                </Box>
              ) : (
                t('Download Excel')
              )}
            </Button>
          </Box>
        </Box>
      )}
    </Container>
  );
}