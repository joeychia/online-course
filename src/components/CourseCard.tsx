import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Chip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DescriptionIcon from '@mui/icons-material/Description';
import { Course } from '../types';
import { convertChinese } from '../utils/chineseConverter';
import MarkdownViewer from './MarkdownViewer';
import { useTranslation } from '../hooks/useTranslation';

interface CourseCardProps {
  course: Course;
  onPrimaryAction: () => void;
  primaryActionText: string;
  language?: 'zh-TW' | 'zh-CN';
  showDescriptionButton?: boolean;
}

const CourseCard: React.FC<CourseCardProps> = ({
  course,
  onPrimaryAction,
  primaryActionText,
  language = 'zh-TW',
  showDescriptionButton = true,
}) => {
  const [descriptionDialogOpen, setDescriptionDialogOpen] = useState(false);
  const { t } = useTranslation();

  const handleDescriptionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDescriptionDialogOpen(true);
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          boxShadow: 6,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
          <Typography
            variant="h6"
            component="h2"
            sx={{
              flexGrow: 1,
              fontSize: 'var(--font-size-h6)',
            }}
          >
            {convertChinese(course.name, language)}
          </Typography>
          {course.isPublic && (
            <Chip 
              label={t('publicAccess')} 
              size="small" 
              color="success" 
              variant="outlined" 
              sx={{ ml: 1, flexShrink: 0 }} 
            />
          )}
        </Box>

        <Stack direction="row" spacing={2} justifyContent="space-between">
          {showDescriptionButton && (
            <Button
              startIcon={<DescriptionIcon />}
              onClick={handleDescriptionClick}
              size="small"
            >
              {convertChinese('查看介紹', language)}
            </Button>
          )}
          <Button
            onClick={onPrimaryAction}
            size="small"
            variant="contained"
          >
            {primaryActionText}
          </Button>
        </Stack>
      </CardContent>

      <Dialog
        open={descriptionDialogOpen}
        onClose={() => setDescriptionDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ m: 0, p: 2, pr: 6 }}>
          {convertChinese(course.name, language)}
          <IconButton
            onClick={() => setDescriptionDialogOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box>
            <MarkdownViewer
              content={convertChinese(course.description, language)}
            />
          </Box>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default CourseCard;
