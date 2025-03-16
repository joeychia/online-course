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
  Button,
  Grid,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Snackbar,
} from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { firestoreService } from '../services/firestoreService';
import { useParams } from 'react-router-dom';
import type { Course, CourseUnit } from '../types';
import React from 'react';

export default function AdminQuizResults() {
  const { courseId = '' } = useParams<{ courseId: string; }>();
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  
  const [loading, setLoading] = useState(true);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [units, setUnits] = useState<CourseUnit[]>([]);
  const [selectedUnits, setSelectedUnits] = useState<Set<string>>(new Set());
  const [startUnitId, setStartUnitId] = useState<string>('');
  const [endUnitId, setEndUnitId] = useState<string>('');
  type QuizResult = {
    userName: string;
    userEmail: string;
    scores: Record<string, number>;
    freeFormAnswers: Record<string, Array<{ question: string, answer: string }>>;
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

  const handleStartUnitChange = (event: SelectChangeEvent) => {
    const newStartUnitId = event.target.value;
    setStartUnitId(newStartUnitId);
    updateSelectedUnitsRange(newStartUnitId, endUnitId);
    // Reset quiz results when selection changes
    setQuizResults(null);
  };

  const handleEndUnitChange = (event: SelectChangeEvent) => {
    const newEndUnitId = event.target.value;
    setEndUnitId(newEndUnitId);
    updateSelectedUnitsRange(startUnitId, newEndUnitId);
    // Reset quiz results when selection changes
    setQuizResults(null);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
    setError(null);
  };

  const updateSelectedUnitsRange = (start: string, end: string) => {
    if (!start || !end) {
      // If either dropdown is not selected, don't update the selection
      setError(null);
      setSelectedUnits(new Set());
      return;
    }

    // Find the indices of the start and end units
    const startIndex = units.findIndex(unit => unit.id === start);
    const endIndex = units.findIndex(unit => unit.id === end);

    if (startIndex === -1 || endIndex === -1) {
      setError(t('invalidUnitRange'));
      setSnackbarOpen(true);
      setSelectedUnits(new Set());
      return;
    }

    // Ensure start is before end
    const [lowerIndex, upperIndex] = startIndex <= endIndex 
      ? [startIndex, endIndex] 
      : [endIndex, startIndex];

    // Get all units in the range
    const unitsInRange = units.slice(lowerIndex, upperIndex + 1);
    
    // Check if the range exceeds the maximum allowed units
    if (unitsInRange.length > 30) {
      setError(t('maxUnitsSelected', { count: 30 }));
      setSnackbarOpen(true);
      setSelectedUnits(new Set());
      return;
    }

    // Create a new set with the selected unit IDs
    const newSelectedUnits = new Set<string>();
    unitsInRange.forEach(unit => newSelectedUnits.add(unit.id));
    
    setSelectedUnits(newSelectedUnits);
    setError(null);
    
    // Reset quiz results when selection changes
    setQuizResults(null);
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

          // Find the last free-form question and its answer
          const questions = quiz?.questions || [];
          const freeFormQuestions = questions
            .map((q, i) => ({ question: q.text, index: i, type: q.type }))
            .filter(q => q.type === 'free_form' && q.question && history.answers[q.index]);
          const freeFormAnswers = freeFormQuestions.map(q => ({
            question: q.question,
            answer: history.answers[q.index]
          }));

          return {
            userId: history.userId,
            userName: user?.name || 'Unknown',
            userEmail: user?.email || 'Unknown',
            unitName: unit?.name || 'Unknown',
            score: history.score,
                        freeFormAnswers
          };
        })
      );

      // Group results by user
      const resultsByUser = results.reduce((acc, result) => {
        if (!acc[result.userId]) {
          acc[result.userId] = {
            userName: result.userName,
            userEmail: result.userEmail,
            scores: {},
            freeFormAnswers: {}
          };
        }
        acc[result.userId].scores[result.unitName] = result.score;
        acc[result.userId].freeFormAnswers[result.unitName] = result.freeFormAnswers;
        return acc;
      }, {} as Record<string, QuizResult>);

      setQuizResults(Object.values(resultsByUser));
      setError(null);
    } catch (err) {
      setError(t('failedToLoadQuizResults'));
      setSnackbarOpen(true);
      console.error('Error fetching quiz results:', err);
    } finally {
      setButtonLoading(false);
    }
  };

  const handleDownloadScoreCSV = () => {
    if (!quizResults || quizResults.length === 0) return;

    // Get all unique unit names from all results
    const allUnits = Array.from(new Set(quizResults.flatMap(r => Object.keys(r.scores))));

    const csvContent = [
      '\uFEFF' + ['Name', 'Email', ...allUnits.map(shortenUnitName)].join(','),
      ...quizResults.map(result => [
        result.userName,
        result.userEmail,
        ...allUnits.map(unitName => 
          result.scores[unitName] !== undefined 
            ? Math.ceil(result.scores[unitName])
            : 'N/A'
        )
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `quiz-results-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const shortenUnitName = (name: string) => {
    return name.split(/\s+/)[0] || name;
  };

  const handleDownloadFreeFormCSV = () => {
    if (!quizResults || quizResults.length === 0) return;

    // Get question headers from first entry matching table structure
    const sampleEntry = quizResults[0].freeFormAnswers[Object.keys(quizResults[0].freeFormAnswers)[0]];
    const questionHeaders = sampleEntry?.flatMap((_, i) => [`Question ${i + 1}`, `Answer ${i + 1}`]) || [];

    const csvContent = [
      '\uFEFF' + ['Name', 'Email', 'Unit', 'Score (%)', ...questionHeaders].join(','),
      ...quizResults.flatMap(result =>
        Object.entries(result.freeFormAnswers).map(([unitName, answers]) => [
          result.userName,
          result.userEmail,
          shortenUnitName(unitName),
          result.scores[unitName] !== undefined ? Math.ceil(result.scores[unitName]) : 'N/A',          ...answers.flatMap(qa => [qa.question, qa.answer])
        ].join(','))
      )
    ].join('\n');
  
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `free-form-responses-${new Date().toISOString().split('T')[0]}.csv`;
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
          {t('Select Units Range')}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id="start-unit-label">{t('Start Unit')}</InputLabel>
              <Select
                labelId="start-unit-label"
                id="start-unit-select"
                value={startUnitId}
                label={t('Start Unit')}
                onChange={handleStartUnitChange}
              >
                {units.map((unit) => (
                  <MenuItem key={unit.id} value={unit.id}>
                    {unit.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id="end-unit-label">{t('End Unit')}</InputLabel>
              <Select
                labelId="end-unit-label"
                id="end-unit-select"
                value={endUnitId}
                label={t('End Unit')}
                onChange={handleEndUnitChange}
              >
                {units.map((unit) => (
                  <MenuItem key={unit.id} value={unit.id}>
                    {unit.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {t('Selected Units')}: {selectedUnits.size}
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          onClick={handleFetchQuizResults}
          disabled={selectedUnits.size === 0 || buttonLoading || error !== null}
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
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert severity="error" onClose={handleSnackbarClose}>
            {error}
          </Alert>
        </Snackbar>
        {!error && !buttonLoading && quizResults && quizResults.length === 0 && selectedUnits.size > 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            {t('Result not found. Try selecting different units.')}
          </Alert>
        )}
      </Paper>

      {quizResults && quizResults.length > 0 && (
        <>
          <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
            Assessment Scores
            <Button
              variant="contained"
              color="secondary"
              onClick={handleDownloadScoreCSV}
              disabled={!quizResults || quizResults.length === 0}
              sx={{ ml: 2 }}
            >
              Download Scores CSV
            </Button>
          </Typography>
          <TableContainer component={Paper} sx={{ mb: 4 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  {Array.from(new Set(quizResults.flatMap(r => Object.keys(r.scores)))).map(unitName => (
                    <TableCell key={unitName}>{shortenUnitName(unitName)}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {quizResults.map((result) => (
                  <TableRow key={`${result.userEmail}-scores`}>
                    <TableCell>{result.userName}</TableCell>
                    <TableCell sx={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {result.userEmail}
                    </TableCell>
                    {Array.from(new Set(Object.keys(result.scores))).map(unitName => (
                      <TableCell key={unitName}>
                        {Math.ceil(result.scores[unitName])}%                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
            Free-form Responses
            <Button
              variant="contained"
              color="secondary"
              onClick={handleDownloadFreeFormCSV}
              disabled={!quizResults || quizResults.length === 0}
              sx={{ ml: 2 }}
            >
              Download Free-form Responses
            </Button>
          </Typography>
          <TableContainer component={Paper} sx={{ mb: 4 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Unit</TableCell>
                  
                  <TableCell>Score</TableCell>
                  {quizResults?.[0]?.freeFormAnswers[Object.keys(quizResults[0].freeFormAnswers)[0]]?.map((_, i) => (
                    <React.Fragment key={i}>
                      <TableCell>Question {i + 1}</TableCell>
                      <TableCell>Answer {i + 1}</TableCell>
                    </React.Fragment>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {quizResults?.map((result) =>
                  Object.entries(result.freeFormAnswers).map(([unitName, answers]) => (
                    <TableRow key={`${result.userEmail}-${unitName}`}>
                      <TableCell>{result.userName}</TableCell>
                      <TableCell sx={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{result.userEmail}</TableCell>
                      <TableCell>{shortenUnitName(unitName)}</TableCell>
                      
                      <TableCell>{Math.ceil(result.scores[unitName])}%</TableCell>                      {answers.map((qa, index) => (
                        <React.Fragment key={index}>
                          <TableCell sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
  <Tooltip title={qa.question} disableInteractive={false} disableTouchListener={false}>
    <span>{qa.question}</span>
  </Tooltip>
</TableCell>
                          <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
  <Tooltip title={qa.answer} disableInteractive={false} disableTouchListener={false}>
    <span>{qa.answer}</span>
  </Tooltip>
</TableCell>
                        </React.Fragment>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Container>
  );
}