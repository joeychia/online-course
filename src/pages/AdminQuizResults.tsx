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
    freeFormAnswers: Record<string, string>;
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
          const lastFreeFormIndex = questions.map((q, i) => ({ type: q.type, index: i }))
            .filter(q => q.type === 'free_form')
            .pop()?.index;
          const freeFormAnswer = lastFreeFormIndex !== undefined ? history.answers[lastFreeFormIndex] : '';

          return {
            userId: history.userId,
            userName: user?.name || 'Unknown',
            userEmail: user?.email || 'Unknown',
            unitName: unit?.name || 'Unknown',
            score: history.score,
            freeFormAnswer
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
        acc[result.userId].freeFormAnswers[result.unitName] = result.freeFormAnswer;
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
        <Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('name')}</TableCell>
                  <TableCell>{t('email')}</TableCell>
                  {Array.from(new Set(units.filter(unit => selectedUnits.has(unit.id)).map(unit => unit.name))).map(unitName => (
                    <TableCell key={unitName} align="right">
                      <Tooltip title={unitName} arrow>
                        <Typography>{shortenUnitName(unitName)}</Typography>
                      </Tooltip>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {quizResults.map((result) => (
                  <TableRow key={`${result.userEmail}-${result.userName}`}>
                    <TableCell>{result.userName}</TableCell>
                    <TableCell>{result.userEmail}</TableCell>
                    {Array.from(new Set(units.filter(unit => selectedUnits.has(unit.id)).map(unit => unit.name))).map(unitName => (
                      <TableCell key={unitName} align="right">
                        {result.scores[unitName] ? (
                          <Tooltip title={`${unitName}: ${result.freeFormAnswers[unitName] || '-'}`} arrow>
                            <Typography>{result.scores[unitName].toFixed(2)}%</Typography>
                          </Tooltip>
                        ) : '-'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Box sx={{ display: 'flex', gap: 2, mt: 1, mb:3 }}>
            <Button
              variant="contained"
              color="primary"
              disabled={buttonLoading}
              onClick={async () => {
                if (buttonLoading) return;
                try {
                  setButtonLoading(true);
                  const selectedUnitNames = Array.from(new Set(units.filter(unit => selectedUnits.has(unit.id)).map(unit => unit.name)));
                  
                  const scoresHeaders = ['Name', 'Email', ...selectedUnitNames.map(name => `${shortenUnitName(name)} Score (%)`)].join(',');
                  const scoresRows = quizResults.map(result => [
                    result.userName,
                    result.userEmail,
                    ...selectedUnitNames.map(unitName => 
                      result.scores[unitName] ? result.scores[unitName].toFixed(2) : '-'
                    )
                  ].join(','));

                  const scoresCSV = [scoresHeaders, ...scoresRows].join('\n');
                  // Add BOM for UTF-8 encoding recognition
                  const scoresContent = new Uint8Array([0xEF, 0xBB, 0xBF, ...new TextEncoder().encode(scoresCSV)]);
                  const scoresBlob = new Blob([scoresContent], { type: 'text/csv;charset=utf-8;' });
                  const scoresLink = document.createElement('a');
                  scoresLink.href = URL.createObjectURL(scoresBlob);
                  scoresLink.download = `${course?.name || 'quiz'}-scores.csv`;
                  scoresLink.click();
                  URL.revokeObjectURL(scoresLink.href);
                } catch (error) {
                  console.error('Error generating scores CSV:', error);
                  setError(t('failedToGenerateCSV'));
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
                t('Download Scores CSV')
              )}
            </Button>

            <Button
              variant="contained"
              color="primary"
              disabled={buttonLoading}
              onClick={async () => {
                if (buttonLoading) return;
                try {
                  setButtonLoading(true);
                  const selectedUnitNames = Array.from(new Set(units.filter(unit => selectedUnits.has(unit.id)).map(unit => unit.name)));
                  
                  const answersHeaders = ['Name', 'Email', 'Unit', 'Score', 'Free-form Answer'].join(',');
                  const answersRows: string[] = [];
                  
                  quizResults.forEach(result => {
                    selectedUnitNames.forEach(unitName => {
                      if (result.freeFormAnswers[unitName]) {
                        answersRows.push([
                          result.userName,
                          result.userEmail,
                          shortenUnitName(unitName),
                          result.scores[unitName]? result.scores[unitName].toFixed(2) : '-',
                          `"${result.freeFormAnswers[unitName].replace(/"/g, '""')}"`
                        ].join(','));
                      }
                    });
                  });

                  const answersCSV = [answersHeaders, ...answersRows].join('\n');
                  // Add BOM for UTF-8 encoding recognition
                  const answersContent = new Uint8Array([0xEF, 0xBB, 0xBF, ...new TextEncoder().encode(answersCSV)]);
                  const answersBlob = new Blob([answersContent], { type: 'text/csv;charset=utf-8;' });
                  const answersLink = document.createElement('a');
                  answersLink.href = URL.createObjectURL(answersBlob);
                  answersLink.download = `${course?.name || 'quiz'}-answers.csv`;
                  answersLink.click();
                  URL.revokeObjectURL(answersLink.href);
                } catch (error) {
                  console.error('Error generating answers CSV:', error);
                  setError(t('failedToGenerateCSV'));
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
                t('Download Free-form Answers CSV')
              )}
            </Button>
          </Box>
        </Box>
      )}
    </Container>
  );
}

// Helper function to shorten unit names by taking the first part before whitespace
const shortenUnitName = (unitName: string) => {
  return unitName.split(/\s+/)[0] || unitName;
};