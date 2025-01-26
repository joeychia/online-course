import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Collapse,
  Box,
  Typography,
  CircularProgress,
  DialogActions,
  Button
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { firestoreService } from '../../services/firestoreService';
import QuizView from '../QuizView';
import type { Quiz, QuizHistory, User } from '../../types';

interface StudentsQuizResultsProps {
  courseId: string;
  lessonId: string;
  onClose: () => void;
}

interface ExpandableRowProps {
  user: User;
  quizHistory: QuizHistory;
  quiz: Quiz | null;
}

const ExpandableRow: React.FC<ExpandableRowProps> = ({ user, quizHistory, quiz }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{user.name}</TableCell>
        <TableCell>{user.email}</TableCell>
        <TableCell>{quizHistory.score}%</TableCell>
        <TableCell>{quizHistory.correct}/{quizHistory.total}</TableCell>
        <TableCell>{new Date(quizHistory.completedAt).toLocaleString()}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              {quiz && (
                <QuizView
                  quiz={quiz}
                  onSubmit={() => {}}
                  onClose={() => setOpen(false)}
                  readOnlyAnswers={quizHistory.answers}
                />
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

export const StudentsQuizResults: React.FC<StudentsQuizResultsProps> = ({
  courseId,
  lessonId,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [quizHistories, setQuizHistories] = useState<{ [userId: string]: QuizHistory }>({});
  const [quiz, setQuiz] = useState<Quiz | null>(null);

  useEffect(() => {
    loadData();
  }, [courseId, lessonId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get the lesson to get the quiz ID
      const lesson = await firestoreService.getLessonById(lessonId);
      if (!lesson?.quizId) {
        throw new Error('No quiz found for this lesson');
      }

      // Load the quiz
      const loadedQuiz = await firestoreService.getQuizById(lesson.quizId);
      setQuiz(loadedQuiz);

      // Get all users who registered for this course
      const registeredUsersId = await firestoreService.getRegisteredUsersForCourse(courseId);
      
      // Get quiz history and user data for each registered user
      const histories: { [userId: string]: QuizHistory } = {};
      const loadedUsers: User[] = [];
      
      await Promise.all(
        registeredUsersId.map(async (userId) => {
          const [history, userData] = await Promise.all([
            firestoreService.getQuizHistoryForUserLesson(userId, lessonId),
            firestoreService.getUserById(userId)
          ]);
          
          if (history && userData) {
            histories[userId] = history;
            loadedUsers.push(userData);
          }
        })
      );

      setUsers(loadedUsers);
      setQuizHistories(histories);
    } catch (error) {
      console.error('Error loading quiz results:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={true} onClose={onClose}>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" p={3}>
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Students Quiz Results</DialogTitle>
      <DialogContent>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell />
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Score</TableCell>
                <TableCell>Correct/Total</TableCell>
                <TableCell>Completed At</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => {
                const quizHistory = quizHistories[user.id];
                if (!quizHistory) return null;

                return (
                  <ExpandableRow
                    key={user.id}
                    user={user}
                    quizHistory={quizHistory}
                    quiz={quiz}
                  />
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};