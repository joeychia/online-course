import { useState } from 'react';
import {
  Box,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Button,
  Paper,
  TextField,
  Stack,
  Divider,
} from '@mui/material';
import { saveQuizHistory } from '../services/dataService';
import { useAuth } from '../contexts/useAuth';
import type { Quiz } from '../types';

interface QuizViewProps {
  quiz: Quiz;
  onSubmit: (answers: { [key: string]: string }) => void;
  courseId: string;
  lessonId: string;
  onClose: () => void;
}

export default function QuizView({ quiz, onSubmit, courseId, lessonId, onClose }: QuizViewProps) {
  const { currentUser } = useAuth();
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<{ correct: number; total: number } | null>(null);

  const handleAnswerChange = (questionIndex: number, value: string) => {
    if (!submitted) {
      setAnswers(prev => ({
        ...prev,
        [questionIndex]: value
      }));
    }
  };

  const checkAnswers = () => {
    let correct = 0;
    let total = 0;

    quiz.questions.forEach((question, questionIndex) => {
      if (question.type === 'single_choice') {
        const selectedOptionIndex = parseInt(answers[questionIndex] || '-1');
        if (selectedOptionIndex >= 0 && question.options?.[selectedOptionIndex]?.isCorrect) {
          correct++;
        }
        total++;
      }
      // For free_form questions, we don't automatically check correctness
      // They would need manual grading
    });

    return { correct, total };
  };

  const handleSubmit = async () => {
    if (!currentUser) return;

    const result = checkAnswers();
    setScore(result);
    setSubmitted(true);

    try {
      await saveQuizHistory(
        currentUser.uid,
        courseId,
        lessonId,
        answers,
        result.correct,
        result.total
      );
      
      onSubmit(answers);
    } catch (err) {
      console.error('Error saving quiz history:', err);
    }
  };

  const isComplete = () => {
    return quiz.questions.every((_, index) => answers[index] !== undefined);
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Stack spacing={4}>
          {quiz.questions.map((question, questionIndex) => (
            <FormControl key={questionIndex} component="fieldset">
              <FormLabel component="legend">
                <Typography variant="h6" gutterBottom>
                  {questionIndex + 1}. {question.text}
                </Typography>
              </FormLabel>
              {question.type === 'single_choice' ? (
                <>
                  <RadioGroup
                    value={answers[questionIndex] || ''}
                    onChange={(e) => handleAnswerChange(questionIndex, e.target.value)}
                  >
                    {question.options?.map((option, optionIndex) => (
                      <FormControlLabel
                        key={optionIndex}
                        value={optionIndex.toString()}
                        control={<Radio />}
                        label={option.text}
                        disabled={submitted}
                        sx={submitted && option.isCorrect ? {
                          '& .MuiFormControlLabel-label': {
                            color: 'success.main',
                            fontWeight: 'bold'
                          }
                        } : undefined}
                      />
                    ))}
                  </RadioGroup>
                  {submitted && question.options && (
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        mt: 1,
                        color: question.options[parseInt(answers[questionIndex] || '-1')]?.isCorrect ? 'success.main' : 'error.main'
                      }}
                    >
                      {question.options[parseInt(answers[questionIndex] || '-1')]?.isCorrect ? 
                        '✓ Correct' : 
                        '✗ Incorrect'}
                    </Typography>
                  )}
                </>
              ) : (
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  value={answers[questionIndex] || ''}
                  onChange={(e) => handleAnswerChange(questionIndex, e.target.value)}
                  placeholder="請在此輸入你的答案..."
                  disabled={submitted}
                />
              )}
            </FormControl>
          ))}
          
          {submitted && score && (
            <>
              <Divider />
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" gutterBottom>
                  Quiz Results
                </Typography>
                <Typography variant="h4" color={score.correct === score.total ? 'success.main' : 'primary.main'}>
                  {score.correct}/{score.total}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {score.correct === score.total ? 
                    'Perfect score! Well done!' : 
                    'Review the answers above to see where you can improve.'}
                </Typography>
              </Box>
            </>
          )}

          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              onClick={onClose}
            >
              Close
            </Button>
            {!submitted && (
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={!isComplete()}
              >
                Submit
              </Button>
            )}
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
} 