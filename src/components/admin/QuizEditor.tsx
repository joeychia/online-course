import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Quiz, QuizQuestion, QuizOption } from '../../types';
import { firestoreService } from '../../services/firestoreService';
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
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextareaAutosize,
} from '@mui/material';

interface QuizEditorProps {
  quizId?: string | null;
  onSave?: (quizId: string) => Promise<void>;
}

const QuizEditor: React.FC<QuizEditorProps> = ({ quizId, onSave }) => {
  const { currentUser } = useAuth();
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [_, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importText, setImportText] = useState('');
  

  const addQuestion = () => {
    if (!selectedQuiz) {
      console.debug('[QuizEditor] Cannot add question - no quiz selected');
      return;
    }

    const newQuestion: QuizQuestion = {
      type: 'single_choice',
      text: '',
      options: [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
      ]
    };

    console.debug('[QuizEditor] Adding new question to quiz:', { quizId: selectedQuiz.id });
    setSelectedQuiz({
      ...selectedQuiz,
      questions: [...selectedQuiz.questions, newQuestion]
    });
  };

  const updateQuestion = (index: number, updates: Partial<QuizQuestion>) => {
    if (!selectedQuiz) {
      console.debug('[QuizEditor] Cannot update question - no quiz selected');
      return;
    }

    console.debug('[QuizEditor] Updating question:', { index, updates, quizId: selectedQuiz.id });
    const updatedQuestions = [...selectedQuiz.questions];
    updatedQuestions[index] = { ...updatedQuestions[index], ...updates };

    setSelectedQuiz({
      ...selectedQuiz,
      questions: updatedQuestions
    });
  };

  const deleteQuestion = (index: number) => {
    if (!selectedQuiz) {
      console.debug('[QuizEditor] Cannot delete question - no quiz selected');
      return;
    }

    console.debug('[QuizEditor] Deleting question:', { index, quizId: selectedQuiz.id });
    const updatedQuestions = selectedQuiz.questions.filter((_, i) => i !== index);
    setSelectedQuiz({
      ...selectedQuiz,
      questions: updatedQuestions
    });
  };

  const addOption = (questionIndex: number) => {
    if (!selectedQuiz) {
      console.debug('[QuizEditor] Cannot add option - no quiz selected');
      return;
    }

    const updatedQuestions = [...selectedQuiz.questions];
    const question = updatedQuestions[questionIndex];

    if (question.type === 'single_choice' && question.options) {
      console.debug('[QuizEditor] Adding new option to question:', { questionIndex, quizId: selectedQuiz.id });
      question.options.push({ text: '', isCorrect: false });
      setSelectedQuiz({
        ...selectedQuiz,
        questions: updatedQuestions
      });
    }
  };

  const updateOption = (questionIndex: number, optionIndex: number, updates: Partial<QuizOption>) => {
    if (!selectedQuiz) {
      console.debug('[QuizEditor] Cannot update option - no quiz selected');
      return;
    }

    const updatedQuestions = [...selectedQuiz.questions];
    const question = updatedQuestions[questionIndex];

    if (question.type === 'single_choice' && question.options) {
      console.debug('[QuizEditor] Updating option:', { questionIndex, optionIndex, updates, quizId: selectedQuiz.id });
      question.options[optionIndex] = { ...question.options[optionIndex], ...updates };
      setSelectedQuiz({
        ...selectedQuiz,
        questions: updatedQuestions
      });
    }
  };

  const deleteOption = (questionIndex: number, optionIndex: number) => {
    if (!selectedQuiz) {
      console.debug('[QuizEditor] Cannot delete option - no quiz selected');
      return;
    }

    const updatedQuestions = [...selectedQuiz.questions];
    const question = updatedQuestions[questionIndex];

    if (question.type === 'single_choice' && question.options) {
      console.debug('[QuizEditor] Deleting option:', { questionIndex, optionIndex, quizId: selectedQuiz.id });
      question.options = question.options.filter((_, i) => i !== optionIndex);
      setSelectedQuiz({
        ...selectedQuiz,
        questions: updatedQuestions
      });
    }
  };

  useEffect(() => {
    const loadQuiz = async () => {
      if (!quizId) {
        // Create a new empty quiz when no quizId is provided
        setSelectedQuiz({
          id: `quiz_${Date.now()}`,
          questions: []
        });
        setLoading(false);
        return;
      }

      try {
        console.debug('[QuizEditor] Loading quiz:', { quizId });
        const quiz = await firestoreService.getQuizById(quizId);
        if (quiz) {
          console.debug('[QuizEditor] Quiz loaded successfully:', { questionCount: quiz.questions.length });
          setSelectedQuiz(quiz);
        } else {
          console.debug('[QuizEditor] Quiz not found');
          setError('Quiz not found');
        }
      } catch (err) {
        console.error('[QuizEditor] Error loading quiz:', err);
        setError('Failed to load quiz');
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [quizId]);

  const handleSave = async () => {
    if (!selectedQuiz || !currentUser) {
      console.debug('[QuizEditor] Cannot save quiz - missing quiz or user');
      return;
    }

    try {
      console.debug('[QuizEditor] Saving quiz:', { quizId: selectedQuiz.id, questionCount: selectedQuiz.questions.length });
      const savedQuizId = await firestoreService.saveQuiz(selectedQuiz);
      if (onSave) {
        await onSave(savedQuizId);
      }
      console.debug('[QuizEditor] Quiz saved successfully:', { savedQuizId });
    } catch (err) {
      console.error('[QuizEditor] Error saving quiz:', err);
      setError('Failed to save quiz');
    }
  };

  const handleImport = async () => {
    try {
      reportError(null);
      const questions = parseQuizText(importText);
      setSelectedQuiz(prev => ({
        ...prev,
        questions: prev ? [...prev.questions, ...questions] : questions,
        id: prev?.id || `quiz_${Date.now()}`
      }));
      setIsImportDialogOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid quiz format';
      setError(message);
      console.error('Import error:', err);
    }
  };

  const parseQuizText = (text: string) => {
    console.debug('[QuizEditor] Starting quiz text parsing');
    const questions: QuizQuestion[] = [];
    const errors: string[] = [];
    
    // Split by one or more blank lines and remove any leading/trailing whitespace
    const questionBlocks = text.split(/\n\s*\n+/).map(block => block.trim()).filter(block => block);
    console.debug('[QuizEditor] Found question blocks:', { count: questionBlocks.length });

    questionBlocks.forEach((block, blockIndex) => {
      console.debug(`[QuizEditor] Processing block ${blockIndex + 1}:`, { block });
      // Split by any type of line break and clean up
      const lines = block.split(/\r?\n/).map(line => line.trim()).filter(line => line);
      console.debug(`[QuizEditor] Block ${blockIndex + 1} lines:`, { lineCount: lines.length });
      
      // Look for question line (number followed by dot and text)
      const questionMatch = lines[0]?.match(/^\d+\.\s*(.+)/);
      if (!questionMatch) {
        errors.push(`Block ${blockIndex + 1}: Missing question number format`);
        return;
      }

      console.debug(`[QuizEditor] Block ${blockIndex + 1}: Found question:`, { text: questionMatch[1] });
      const options: QuizOption[] = [];
      let correctAnswer = '';
      let answerFound = false;

      // Process remaining lines
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        
        // Check for answer line with more flexible matching
        const answerMatch = line.match(/答案[：:]+\s*([A-D])/i) || line.match(/Answer[：:]+\s*([A-D])/i);
        if (answerMatch) {
          correctAnswer = answerMatch[1].toUpperCase();
          answerFound = true;
          console.debug(`[QuizEditor] Block ${blockIndex + 1}: Found correct answer:`, { answer: correctAnswer });
          continue;
        }

        // Check for option line with more flexible matching
        const optionMatch = line.match(/^\s*([A-D])[.．。]\s*(.+)/i);
        if (optionMatch) {
          console.debug(`[QuizEditor] Block ${blockIndex + 1}: Found option:`, { 
            letter: optionMatch[1],
            text: optionMatch[2].trim()
          });
          options.push({
            text: optionMatch[2].trim(),
            isCorrect: false
          });
        }
      }

      // Handle free-form questions if no options/answer found
      if (options.length === 0 && !answerFound) {
        console.debug(`[QuizEditor] Block ${blockIndex + 1}: Creating free-form question`);
        questions.push({
          type: 'free_form',
          text: questionMatch[1].trim(),
          options: []
        });
      }
      // Handle single-choice questions
      else if (options.length > 0 && answerFound) {
        // Set the correct answer
        const correctIndex = correctAnswer.charCodeAt(0) - 'A'.charCodeAt(0);
        if (correctIndex >= 0 && correctIndex < options.length) {
          options[correctIndex].isCorrect = true;
          console.debug(`[QuizEditor] Block ${blockIndex + 1}: Created complete question:`, {
            text: questionMatch[1].trim(),
            optionCount: options.length,
            correctAnswer
          });

          questions.push({
            type: 'single_choice',
            text: questionMatch[1].trim(),
            options
          });
        } else {
          console.debug(`[QuizEditor] Block ${blockIndex + 1}: Invalid correct answer index:`, {
            correctAnswer,
            correctIndex,
            optionsLength: options.length
          });
        }
      } else {
        console.debug(`[QuizEditor] Block ${blockIndex + 1}: Incomplete question:`, {
          hasOptions: options.length > 0,
          hasAnswer: answerFound
        });
      }
    });

    if (errors.length > 0) {
      throw new Error(`Validation errors:\n${errors.join('\n')}`);
    }
    return questions;
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
          onClick={() => setIsImportDialogOpen(true)}
        >
          Import Quiz
        </Button>
      </Stack>

      {/* Import Dialog */}
      <Dialog
        open={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Import Quiz Questions</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Paste your quiz questions in the format below:
            <br />
            1. Some single choice question text
            <br />
            A. Option A
            <br />
            B. Option B
            <br />
            C. Option C
            <br />
            D. Option D
            <br />
            答案：A
            <br /><br />
            2. Some freeform question text
            <br /><br />
            3. Another freeform question text
          </Typography>
          
          <TextareaAutosize
            minRows={10}
            style={{
              width: '100%',
              padding: '8px',
              fontFamily: 'monospace'
            }}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Paste your quiz questions here..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsImportDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleImport} variant="contained" color="primary">
            Import
          </Button>
        </DialogActions>
        {error && (
          <Alert severity="error" sx={{ mt: 2, mx: 2 }}>
            {error}
          </Alert>
        )}
      </Dialog>

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
