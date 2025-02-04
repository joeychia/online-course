import { Box, Container, Typography, Paper, Accordion, AccordionSummary, AccordionDetails, Link } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useTranslation } from '../hooks/useTranslation';
import { convertChinese } from '../utils/chineseConverter';

export default function Help() {
  const { t, language } = useTranslation();

  const newUserGuide = [
    {
      title: '1. 註冊或登入',
      content: '建立帳號或使用現有帳號登入以使用所有功能。'
    },
    {
      title: '2. 瀏覽可用課程',
      content: '探索我們的課程目錄，尋找您感興趣的課程。'
    },
    {
      title: '3. 註冊課程',
      content: '點擊「立即註冊」以註冊課程並追蹤您的學習進度。'
    },
    {
      title: '4. 開始學習',
      content: '瀏覽課程內容，完成測驗，並記錄學習筆記。'
    }
  ];

  const faq = [
    {
      question: '如何重設密碼？',
      answer: '您可以在登入頁面點擊「忘記密碼」連結來重設密碼。'
    },
    {
      question: '我可以在行動裝置上使用課程嗎？',
      answer: '是的，我們的平台完全支援響應式設計，可在所有現代行動裝置上使用。'
    },
    {
      question: '如何追蹤我的學習進度？',
      answer: '您的學習進度會自動追蹤並顯示在課程儀表板中。'
    },
    {
      question: '我可以在課程中做筆記嗎？',
      answer: '是的，每堂課都有內建的筆記功能，可自動儲存您的筆記。'
    }
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('help')}
        </Typography>

        {/* New User Guide Section */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            新手指南
          </Typography>
          <Box sx={{ mt: 2 }}>
            {newUserGuide.map((item, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  {convertChinese(item.title, language)}
                </Typography>
                <Typography color="text.secondary">
                  {convertChinese(item.content, language)}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>

        {/* FAQ Section */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            常見問題
          </Typography>
          <Box sx={{ mt: 2 }}>
            {faq.map((item, index) => (
              <Accordion key={index}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>
                    {convertChinese(item.question, language)}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography color="text.secondary">
                    {convertChinese(item.answer, language)}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </Paper>

        {/* Contact Section */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            聯絡我們
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Typography paragraph>
              如需進一步協助，請聯絡我們：
            </Typography>
            <Box sx={{ ml: 2 }}>
              <Typography paragraph>
                電子郵件：
                <Link href="mailto:support@example.com">support@example.com</Link>
              </Typography>
              <Typography paragraph>
                電話：+1 (123) 456-7890
              </Typography>
              <Typography>
                營業時間：週一至週五，上午 9:00 至下午 5:00（東部標準時間）
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}