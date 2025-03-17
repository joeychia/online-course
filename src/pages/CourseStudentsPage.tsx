import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import CourseStudentsList from '../components/admin/CourseStudentsList';
import { Box, Typography, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';

const CourseStudentsPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (!courseId) {
    return <Navigate to="/admin" replace />;
  }

  const handleBack = () => {
    navigate(`/admin/courses/${courseId}`);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={handleBack} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          {t('Course Students')}
        </Typography>
      </Box>
      <CourseStudentsList courseId={courseId} />
    </Box>
  );
};

export default CourseStudentsPage;
