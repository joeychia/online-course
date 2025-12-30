import { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, CircularProgress, alpha } from '@mui/material';
import { firestoreService } from '../services/firestoreService';
import { useAuth } from '../hooks/useAuth';
import { Announcement, Course } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import MarkdownViewer from '../components/MarkdownViewer';


export default function AnnouncementsList() {
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        if (!currentUser?.uid) return;
        
        let announcementsData = await firestoreService.getActiveAnnouncements();
        // filter the announcement by publishDate and expireDate
        const now = new Date();
        const validAnnouncements = announcementsData.filter(announcement => {
            if (!('publishDate' in announcement && 'expireDate' in announcement)) return true;
            const publishDate = new Date(announcement.publishDate as string);
            const expireDate = new Date(announcement.expireDate as string);
            return now >= publishDate && now <= expireDate;
        });
        announcementsData = validAnnouncements;

        setAnnouncements(announcementsData as Announcement[]);
      } finally {
        setLoading(false);
      }
    };

    void fetchAnnouncements();
  }, [currentUser]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const coursesData = await firestoreService.getAllCourses();
        setCourses(coursesData);
      } catch (err) {
        console.error('Error loading courses:', err);
      }
    };
    void fetchCourses();
  }, []);

  const courseIdToName = courses.reduce((acc, course) => ({
    ...acc,
    [course.id]: course.name
  }), {} as Record<string, string>);

  if (!currentUser) return null;

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Box sx={{ mb: 4 }}>
      {announcements.length > 0 && (
        <>
        <Typography variant="h4" gutterBottom>
            {t('announcements')}
        </Typography>

          {announcements.map((announcement) => (
            <Card key={announcement.id} sx={{ 
              mb: 2, 
              '&:last-child': { mb: 0 },
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.5)
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Box component="span" sx={{ fontSize: '1.2rem', lineHeight: 1 }}>⚠️</Box>
                  <Typography variant="subtitle2" component="span">
                    {announcement.courseId ? t('forCourse', {course: courseIdToName[announcement.courseId]}) : t('forEveryone')}
                  </Typography>
                </Box>
                <MarkdownViewer
                    content={announcement.content}
                />
                <Typography variant="body2" color="text.secondary">
                  {new Date(announcement.publishDate).toLocaleDateString()}~  
                  {new Date(announcement.expireDate).toLocaleDateString()}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </Box>
  );
};