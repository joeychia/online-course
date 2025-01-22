import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  IconButton,
  Typography
} from '@mui/material';
import { Course } from '../../types';
import { createCourse, updateCourse, deleteCourse, getAllCourses } from '../../services/dataService';
import RichTextEditor from '../RichTextEditor';
import MarkdownViewer from '../MarkdownViewer';
import { CourseListItem } from './CourseListItem';

export const CourseManagement: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [open, setOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseName, setCourseName] = useState('');
  const [courseDescription, setCourseDescription] = useState('');

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    const courseList = await getAllCourses();
    setCourses(courseList);
  };

  const handleCreateOrUpdate = async () => {
    try {
      if (editingCourse) {
        await updateCourse(editingCourse.id, {
          name: courseName,
          description: courseDescription,
        });
      } else {
        await createCourse({
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
      loadCourses();
    } catch (error) {
      console.error('Error saving course:', error);
    }
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setCourseName(course.name);
    setCourseDescription(course.description);
    setOpen(true);
  };

  const handleDelete = async (courseId: string) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await deleteCourse(courseId);
        loadCourses();
      } catch (error) {
        console.error('Error deleting course:', error);
      }
    }
  };

  const resetForm = () => {
    setEditingCourse(null);
    setCourseName('');
    setCourseDescription('');
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Course Management</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>
          Create New Course
        </Button>
      </Box>

      <List>
        {courses.map((course) => (
          <CourseListItem
            key={course.id}
            course={course}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </List>

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
    </Box>
  );
}; 