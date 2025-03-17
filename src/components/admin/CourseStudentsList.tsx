import { useEffect, useState } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useDataGridPagination } from '../../hooks/useDataGridPagination';
import { Box, CircularProgress } from '@mui/material';
import { firestoreService } from '../../services/firestoreService';
import { useTranslation } from '../../hooks/useTranslation';

interface CourseStudentsListProps {
  courseId: string;
}

interface StudentRow {
  id: string;
  name: string;
  email: string;
  completedLessons: number;
}

const CourseStudentsList: React.FC<CourseStudentsListProps> = ({ courseId }) => {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const { t } = useTranslation();
  
  // Use the pagination hook
  const { paginationModel, handlePaginationModelChange } = useDataGridPagination();

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        // Get all registered users for the course
        const registeredUsers = await firestoreService.getRegisteredUsersForCourse(courseId);
        
        // Fetch user profiles and calculate completed lessons
        const studentData = await Promise.all(
          registeredUsers.map(async (userId) => {
            const profile = await firestoreService.getUserById(userId);
            if (!profile) return null;

            // Calculate completed lessons for this course
            const courseProgress = profile.progress?.[courseId] || {};
            const completedLessons = Object.values(courseProgress)
              .filter(progress => progress.completed)
              .length;

            return {
              id: profile.id,
              name: profile.name,
              email: profile.email,
              completedLessons
            };
          })
        );

        // Filter out null values and set students
        setStudents(studentData.filter((student): student is StudentRow => student !== null));
      } catch (error) {
        console.error('Error fetching students:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [courseId]);

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: t('Name'),
      flex: 1,
      minWidth: 150
    },
    {
      field: 'email',
      headerName: t('Email'),
      flex: 1,
      minWidth: 200
    },
    {
      field: 'completedLessons',
      headerName: t('Completed Lessons'),
      type: 'number',
      flex: 1,
      minWidth: 150
    }
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: 400, width: '100%' }}>
      <DataGrid
        rows={students}
        columns={columns}
        paginationModel={paginationModel}
        onPaginationModelChange={handlePaginationModelChange}
        pageSizeOptions={[10, 25, 50]}
        disableRowSelectionOnClick
        autoHeight
      />
    </Box>
  );
};

export default CourseStudentsList;
