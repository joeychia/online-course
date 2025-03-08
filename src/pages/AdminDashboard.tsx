import React from 'react';
import { Box, Typography, Container } from '@mui/material';
import { CourseManagement } from '../components/admin/CourseManagement';
import { useAuth } from '../hooks/useAuth';
import { Navigate, useParams } from 'react-router-dom';
import { firestoreService } from '../services/firestoreService';
import { useState, useEffect } from 'react';

const AdminDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { courseId } = useParams();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        if (currentUser?.uid) {
          const userProfile = await firestoreService.getUserById(currentUser.uid);
          setIsAdmin(!!userProfile?.roles?.admin);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [currentUser]);

  if (loading) {
    return <Box p={4}>Loading...</Box>;
  }

  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  return (
    <Container maxWidth="lg">
      <Box py={{ xs: 2, sm: 4 }}>
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom
          sx={{
            fontSize: { xs: '1.5rem', sm: '2rem' },
            textAlign: { xs: 'center', sm: 'left' },
            mb: { xs: 2, sm: 3 },
            fontWeight: 700
          }}
        >
          Admin Dashboard
        </Typography>
        <CourseManagement initialCourseId={courseId} />
      </Box>
    </Container>
  );
};

export default AdminDashboard;
