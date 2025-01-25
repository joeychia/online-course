import React from 'react';
import { Box, Typography, Container } from '@mui/material';
import { CourseManagement } from '../components/admin/CourseManagement';
import { useAuth } from '../contexts/useAuth';
import { Navigate } from 'react-router-dom';
import { getUser } from '../services/dataService';
import { useState, useEffect } from 'react';

export const AdminDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        if (currentUser?.uid) {
          const userProfile = await getUser(currentUser.uid);
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
    <Container>
      <Box py={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Dashboard
        </Typography>
        <CourseManagement />
      </Box>
    </Container>
  );
};
