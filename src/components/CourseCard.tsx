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
  alpha,
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
        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
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
              sx={{ 
                color: 'text.secondary',
                '&:hover': {
                  bgcolor: 'action.hover',
                  color: 'primary.main',
                }
              }}
            >
              {convertChinese('查看介紹', language)}
            </Button>
          )}
          <Button
            onClick={onPrimaryAction}
            size="small"
            variant="contained"
            sx={{
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': {
                bgcolor: 'primary.dark',
              }
            }}
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
