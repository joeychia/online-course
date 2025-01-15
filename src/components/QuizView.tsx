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
} from '@mui/material';

interface Option {
  text: string;
  isCorrect: boolean;
}

interface Question {
  type: 'single_choice' | 'free_form';
  text: string;
  options?: {
    [key: string]: Option;
  };
}

interface Quiz {
  id: string;
  questions: {
    [key: string]: Question;
  };
}

interface QuizViewProps {
  quiz: Quiz;
  onSubmit: (answers: { [key: string]: string }) => void;
}

export default function QuizView({ quiz, onSubmit }: QuizViewProps) {
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = () => {
    onSubmit(answers);
  };

  const isComplete = () => {
    return Object.keys(quiz.questions).every(questionId => answers[questionId]);
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Stack spacing={4}>
          {Object.entries(quiz.questions).map(([questionId, question], index) => (
            <FormControl key={questionId} component="fieldset">
              <FormLabel component="legend">
                <Typography variant="h6" gutterBottom>
                  {index + 1}. {question.text}
                </Typography>
              </FormLabel>
              {question.type === 'single_choice' ? (
                <RadioGroup
                  value={answers[questionId] || ''}
                  onChange={(e) => handleAnswerChange(questionId, e.target.value)}
                >
                  {question.options && Object.entries(question.options).map(([optionId, option]) => (
                    <FormControlLabel
                      key={optionId}
                      value={optionId}
                      control={<Radio />}
                      label={option.text}
                    />
                  ))}
                </RadioGroup>
              ) : (
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  value={answers[questionId] || ''}
                  onChange={(e) => handleAnswerChange(questionId, e.target.value)}
                  placeholder="請在此輸入你的答案..."
                />
              )}
            </FormControl>
          ))}
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={!isComplete()}
            sx={{ mt: 2 }}
          >
            提交答案
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
} 