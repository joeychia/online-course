import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/useAuth';
import { Quiz, QuizQuestion, QuizOption } from '../../types';
import { firestoreService } from '../../services/firestoreService';
import { getUser, saveQuiz } from '../../services/dataService';
import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  FormControl,
  Select,
  MenuItem,
  TextField,
  Radio,
  IconButton,
  Alert,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

interface QuizEditorProps {
  quizId?: string | null;
  onSave?: (quizId: string) => Promise<void>;
}

const QuizEditor: React.FC<QuizEditorProps> = ({ quizId, onSave }) => {
  const { currentUser } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load user profile and check admin status
        if (currentUser?.uid) {
          const userProfile = await getUser(currentUser.uid);
          setIsAdmin(!!userProfile?.roles?.admin);
        }

        // Load quiz if quizId is provided
        if (quizId) {
          const quiz = await firestoreService.getQuizById(quizId);
          if (quiz) {
            setSelectedQuiz(quiz);
          }
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [quizId, currentUser]);

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (!isAdmin) {
    return <div className="p-4 text-red-600">Access denied. Admin privileges required.</div>;
  }

  const createNewQuiz = () => {
    const newQuiz: Quiz = {
      id: `quiz_${Date.now()}`,
      questions: []
    };
    setSelectedQuiz(newQuiz);
  };

  const addQuestion = () => {
    if (!selectedQuiz) return;

    const newQuestion: QuizQuestion = {
      type: 'single_choice',
      text: '',
      options: []
    };

    setSelectedQuiz({
      ...selectedQuiz,
      questions: [...selectedQuiz.questions, newQuestion]
    });
  };

  const addOption = (questionIndex: number) => {
    if (!selectedQuiz) return;

    const newOption: QuizOption = {
      text: '',
      isCorrect: false
    };

    const updatedQuestions = selectedQuiz.questions.map((question, index) => {
      if (index === questionIndex && question.type === 'single_choice') {
        return {
          ...question,
          options: [...(question.options || []), newOption]
        };
      }
      return question;
    });

    setSelectedQuiz({
      ...selectedQuiz,
      questions: updatedQuestions
    });
  };

  const updateQuestion = (questionIndex: number, updates: Partial<QuizQuestion>) => {
    if (!selectedQuiz) return;

    const updatedQuestions = selectedQuiz.questions.map((question, index) => {
      if (index === questionIndex) {
        return { ...question, ...updates };
      }
      return question;
    });

    setSelectedQuiz({
      ...selectedQuiz,
      questions: updatedQuestions
    });
  };

  const updateOption = (questionIndex: number, optionIndex: number, updates: Partial<QuizOption>) => {
    if (!selectedQuiz) return;

    const updatedQuestions = selectedQuiz.questions.map((question, qIndex) => {
      if (qIndex === questionIndex && question.type === 'single_choice' && question.options) {
        const updatedOptions = question.options.map((option, oIndex) => {
          if (oIndex === optionIndex) {
            return { ...option, ...updates };
          }
          return option;
        });
        return { ...question, options: updatedOptions };
      }
      return question;
    });

    setSelectedQuiz({
      ...selectedQuiz,
      questions: updatedQuestions
    });
  };

  const deleteQuestion = (questionIndex: number) => {
    if (!selectedQuiz) return;

    const updatedQuestions = selectedQuiz.questions.filter((_, index) => index !== questionIndex);
    setSelectedQuiz({
      ...selectedQuiz,
      questions: updatedQuestions
    });
  };

  const deleteOption = (questionIndex: number, optionIndex: number) => {
    if (!selectedQuiz) return;

    const updatedQuestions = selectedQuiz.questions.map((question, qIndex) => {
      if (qIndex === questionIndex && question.type === 'single_choice' && question.options) {
        return {
          ...question,
          options: question.options.filter((_, oIndex) => oIndex !== optionIndex)
        };
      }
      return question;
    });

    setSelectedQuiz({
      ...selectedQuiz,
      questions: updatedQuestions
    });
  };

  const handleSave = async () => {
    if (!selectedQuiz || !onSave) return;

    try {
      const id = await saveQuiz(selectedQuiz);
      await onSave(id);
      setError(null);
    } catch (err) {
      setError('Failed to save quiz');
      console.error('Error saving quiz:', err);
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1">
          Quiz Editor
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={createNewQuiz}
        >
          Create New Quiz
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {selectedQuiz && (
        <Stack spacing={4}>
          <Paper sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom>
              Questions
            </Typography>
            <Stack spacing={4}>
              {selectedQuiz.questions.map((question, questionIndex) => (
                <Paper key={questionIndex} elevation={2} sx={{ p: 3 }}>
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <TextField
                        fullWidth
                        value={question.text}
                        onChange={(e) => updateQuestion(questionIndex, { text: e.target.value })}
                        placeholder={`Question ${questionIndex + 1}`}
                        label={`Question ${questionIndex + 1}`}
                        variant="outlined"
                      />
                      <FormControl sx={{ width: 150 }}>
                        <Select
                          size="small"
                          value={question.type}
                          onChange={(e) => updateQuestion(questionIndex, { type: e.target.value as 'single_choice' | 'free_form' })}
                        >
                          <MenuItem value="single_choice">Single Choice</MenuItem>
                          <MenuItem value="free_form">Free Form</MenuItem>
                        </Select>
                      </FormControl>
                      <IconButton
                        onClick={() => deleteQuestion(questionIndex)}
                        color="error"
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Stack>

                    {question.type === 'single_choice' && (
                      <Box sx={{ pl: 2 }}>
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          onClick={() => addOption(questionIndex)}
                          sx={{ mb: 2 }}
                        >
                          Add Option
                        </Button>

                        <Stack spacing={2}>
                          {question.options?.map((option, optionIndex) => (
                            <Stack key={optionIndex} direction="row" spacing={2} alignItems="center">
                              <Radio
                                checked={option.isCorrect}
                                onChange={() => {
                                  question.options?.forEach((_, idx) => {
                                    updateOption(questionIndex, idx, { isCorrect: idx === optionIndex });
                                  });
                                }}
                              />
                              <TextField
                                value={option.text}
                                onChange={(e) => updateOption(questionIndex, optionIndex, { text: e.target.value })}
                                placeholder="Option text"
                                variant="outlined"
                                size="small"
                                sx={{ flexGrow: 1 }}
                              />
                              <IconButton
                                onClick={() => deleteOption(questionIndex, optionIndex)}
                                color="error"
                                size="small"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Stack>
                          ))}
                        </Stack>
                      </Box>
                    )}
                  </Stack>
                </Paper>
              ))}
            </Stack>
            <Button
              variant="contained"
              color="success"
              onClick={addQuestion}
              sx={{ mb: 4 }}
            >
              Add Question
            </Button>
          </Paper>

          <Button
            variant="contained"
            color="success"
            onClick={handleSave}
            size="large"
          >
            Save Quiz
          </Button>
        </Stack>
      )}
    </Box>
  );
};

export default QuizEditor;