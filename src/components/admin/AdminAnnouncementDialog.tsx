import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';

import { firestoreService } from '../../services/firestoreService';
import { useAuth } from '../../hooks/useAuth';
import { Announcement, Course } from '../../types';

export const AdminAnnouncementDialog = ({ open, onClose, onSuccess }: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [_loadingCourses, setLoadingCourses] = useState(true);
  const { currentUser } = useAuth();
  const [content, setContent] = useState('');
  const [courseId, setCourseId] = useState('');
  const [publishDate, setPublishDate] = useState<Date | null>(new Date());
  const [expireDate, setExpireDate] = useState<Date | null>(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date;
  });

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const courseList = await firestoreService.getAllCourses();
        setCourses(courseList);
      } catch (error) {
        console.error('Error loading courses:', error);
      } finally {
        setLoadingCourses(false);
      }
    };

    loadCourses();
  }, []);

  const fetchRecipients = async () => {
  try {
    setLoadingRecipients(true);
    setEmailError('');
    
    if (courseId) {
      const studentIds = await firestoreService.getRegisteredUsersForCourse(courseId);
      const registrations = await Promise.all(
        studentIds.map(studentId => firestoreService.getUserById(studentId))
      );
      setRecipients(registrations.filter((r): r is NonNullable<typeof r> => r !== null).map(r => r.email));
    } else {
      const allUsers = await firestoreService.getAllUsersEmails();
      setRecipients(allUsers);
    }
    
    setEmailSubject(`Announcement`);
    setEmailBody(content);
    setShowEmailPreview(true);
  } catch (err) {
    setEmailError('Failed to load recipient list');
    console.error('Error fetching recipients:', err);
  } finally {
    setLoadingRecipients(false);
  }
};

const handleSendEmail = () => {
  const bcc = recipients.join(',');
  const subject = encodeURIComponent(emailSubject);
  const body = encodeURIComponent(emailBody);
  window.location.href = `mailto:?bcc=${bcc}&subject=${subject}&body=${body}`;
};

const handleSubmit = async () => {
    if (!currentUser || !publishDate || !expireDate) return;

    const announcement: Omit<Announcement, 'id'> = {
      content,
      courseId: courseId || null || undefined,
      publishDate: publishDate.toISOString(),
      expireDate: expireDate.toISOString(),
      createdAt: new Date().toISOString(),
      createdBy: currentUser.uid
    };

    try {
      await firestoreService.createAnnouncement(announcement);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to create announcement:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <>
        <DialogTitle>Create New Announcement</DialogTitle>
        <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          <TextField
            label="Announcement Content"
            multiline
            rows={4}
            fullWidth
            value={content}
            onChange={(e) => setContent(e.target.value)}
            inputProps={{ maxLength: 500 }}
            FormHelperTextProps={{ component: 'div' }}
            helperText={
              <Typography variant="caption" color={content.length >= 500 ? 'error' : 'inherit'}>
                {content.length}/500 characters
              </Typography>
            }
          />
          
          <FormControl fullWidth>
            <InputLabel>Associated Course (optional)</InputLabel>
            <Select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              label="Associated Course (optional)"
            >
              <MenuItem value="">General</MenuItem>
              {courses.map(course => (
                <MenuItem key={course.id} value={course.id}>
                  {course.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            type="datetime-local"
            label="Publish Date/Time"
            value={publishDate?.toISOString().slice(0,16) || ''}
            inputProps={{
              min: new Date().toISOString().slice(0,16)
            }}
            onChange={(e) => setPublishDate(e.target.value ? new Date(e.target.value) : null)}
          />

          <TextField
            fullWidth
            type="datetime-local"
            label="Expire Date/Time"
            value={expireDate?.toISOString().slice(0,16) || ''}
            inputProps={{
              min: publishDate?.toISOString().slice(0,16) || new Date().toISOString().slice(0,16)
            }}
            onChange={(e) => setExpireDate(e.target.value ? new Date(e.target.value) : null)}
            error={!!expireDate && !!publishDate && expireDate < publishDate}
            helperText={!!expireDate && !!publishDate && expireDate < publishDate ? 'Expire date cannot be before publish date' : ''}
          />
        </Stack>
      </DialogContent>
      {showEmailPreview && (
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            {emailError && <Alert severity="error">{emailError}</Alert>}
            <TextField
              label="BCC Recipients"
              value={recipients.join(', ')}
              fullWidth
              multiline
              onChange={(e) => setRecipients(e.target.value.split(/[,\s]+/))}
            />
            <TextField
              label="Subject"
              value={emailSubject}
              fullWidth
              onChange={(e) => setEmailSubject(e.target.value)}
            />
            <TextField
              label="Email Body"
              value={emailBody}
              multiline
              rows={4}
              fullWidth
              onChange={(e) => setEmailBody(e.target.value)}
            />
          </Stack>
        </DialogContent>
      )}
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={() => setShowEmailPreview(false)}
          disabled={loadingRecipients}
        >
          Back
        </Button>
        {showEmailPreview ? (
          <Button 
            onClick={handleSendEmail} 
            variant="contained"
            color="secondary"
          >
            Send Email In Client
          </Button>
        ) : (
          <>
            <Button 
              onClick={fetchRecipients} 
              variant="outlined"
              disabled={loadingRecipients}
            >
              {loadingRecipients ? <CircularProgress size={24} /> : 'Draft Email'}
            </Button>
            <Button onClick={handleSubmit} variant="contained">
              Create Announcement
            </Button>
          </>
        )}
      </DialogActions>
      </>
    </Dialog>
  );
};