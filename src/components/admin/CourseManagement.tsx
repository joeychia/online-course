import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Typography
} from '@mui/material';
import { Course } from '../../types';
import { firestoreService } from '../../services/firestoreService';
import RichTextEditor from '../RichTextEditor';
import CourseCard from '../CourseCard';
import { useTranslation } from '../../hooks/useTranslation';
import { CourseEditor } from './CourseEditor';

interface CourseManagementProps {
  initialCourseId?: string;
}

export const CourseManagement: React.FC<CourseManagementProps> = ({ initialCourseId }) => {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const [courses, setCourses] = useState<Course[]>([]);
  const [open, setOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseName, setCourseName] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(initialCourseId || null);

  useEffect(() => {
    loadCourses();
  }, [selectedCourseId]); // Reload courses when returning from editor

  const loadCourses = async () => {
    try {
      const courseList = await firestoreService.getAllCourses();
      setCourses(courseList);
    } catch (error) {
      console.error('Error loading courses:', error);
      setCourses([]);
    }
  };

  const handleCreateOrUpdate = async () => {
    // Validate required fields
    if (!courseName.trim()) {
      return;
    }

    try {
      if (editingCourse) {
        await firestoreService.updateCourse(editingCourse.id, {
          name: courseName,
          description: courseDescription,
        });
      } else {
        await firestoreService.createCourse({
          name: courseName,
          description: courseDescription,
          settings: { unlockLessonIndex: 1 },
          units: [],
          groupIds: {},
          isPublic: false
        });
      }
      
      setOpen(false);
      resetForm();
      await loadCourses();
    } catch (error) {
      console.error('Error saving course:', error);
    }
  };

  const resetForm = () => {
    setEditingCourse(null);
    setCourseName('');
    setCourseDescription('');
  };

  return (
    <Box p={3}>
      {selectedCourseId ? (
        <>
          <Button onClick={() => {
            setSelectedCourseId(null);
            navigate('/admin');
          }} sx={{ mb: 2 }}>
            Back to Course List
          </Button>
          <CourseEditor courseId={selectedCourseId} />
        </>
      ) : (
        <>
          <Box 
            display="flex" 
            flexDirection={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between" 
            alignItems={{ xs: 'stretch', sm: 'center' }}
            gap={2}
            mb={3}
          >
            <Typography 
              variant="h5"
              sx={{
                textAlign: { xs: 'center', sm: 'left' },
                fontSize: { xs: '1.25rem', sm: '1.5rem' }
              }}
            >
              Course Management
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => setOpen(true)}
              sx={{
                width: { xs: '100%', sm: 'auto' },
                height: { xs: '48px', sm: '40px' }
              }}
            >
              Create New Course
            </Button>
          </Box>

          <Grid container spacing={3} data-testid="course-grid">
            {courses.map((course) => (
              <Grid item xs={12} sm={6} md={4} key={course.id}>
                <CourseCard
                  course={course}
                  onPrimaryAction={() => {
                    setSelectedCourseId(course.id);
                    navigate(`/admin/courses/${course.id}`);
                  }}
                  primaryActionText={t('manageCourse')}
                  language={language}
                  showDescriptionButton={true}
                />
              </Grid>
            ))}
          </Grid>

          <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
            <DialogTitle>{editingCourse ? 'Edit Course' : 'Create New Course'}</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                label="Course Name"
                fullWidth
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
              />
              <Box mt={2}>
                <Typography variant="subtitle2" color="textSecondary" mb={1}>
                  Course Description
                </Typography>
                <RichTextEditor
                  value={courseDescription}
                  onChange={setCourseDescription}
                  placeholder="Enter course description..."
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => {
                setOpen(false);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button onClick={handleCreateOrUpdate} variant="contained" color="primary">
                {editingCourse ? 'Update' : 'Create'}
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Box>
  );
};
