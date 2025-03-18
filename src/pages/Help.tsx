import { Box, Container, Typography, Paper, Accordion, AccordionSummary, AccordionDetails, Link, useTheme } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useTranslation } from '../hooks/useTranslation';
import { convertChinese } from '../utils/chineseConverter';

export default function Help() {
  const { t, language } = useTranslation();
  const theme = useTheme();

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
      answer: '您可以在登入頁面點擊「忘記密碼」。您的電子郵箱將會收到重設密碼的鏈接。如果沒有找到郵件，請檢查您的垃圾郵件夾。打開鏈接並按照指示重設密碼。之後可以使用新密碼登入。'
    },
    {
      question: '我可以在行動裝置上使用課程嗎？',
      answer: '是的，我們的平台完全支援響應式設計，可在所有現代行動裝置上使用。'
    },
    {
      question: '如何追蹤我的學習進度？',
      answer: '您的學習進度會自動追蹤並顯示在課程頁面中。'
    },
    {
      question: '我可以在課程中做筆記嗎？',
      answer: '是的，每堂課都有內建的筆記功能，可自動儲存您的筆記。'
    }
  ];

  const pwaInstall = {
    title: '安裝為應用程式',
    content: `本網站可以安裝為App使用，請依照您使用的手機瀏覽器選擇安裝步驟：

手機版Chrome瀏覽器：
1. 點擊右上角選單按鈕
2. 在選單中點擊「加到主畫面」選項
3. 點擊「安裝」按鈕即可完成

手機版Safari瀏覽器：
1. 點擊底部工具列的「分享」按鈕
2. 在分享選單中，向上滑動並點擊「加入主畫面」選項
3. 點擊右上角的「新增」按鈕即可完成安裝`
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('help')}
        </Typography>
        {/* PWA Installation Section */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            {convertChinese(pwaInstall.title, language)}
          </Typography>
          <Box sx={{ 
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'center',
            gap: 4,
            mt: 2
          }}>
            <img
              src="/PWA.png"
              alt={convertChinese('安裝為應用程式示範', language)}
              style={{ 
                width: '400px',
                borderRadius: '8px',
                boxShadow: theme.shadows[4]
              }}
            />
            <Typography color="text.secondary" whiteSpace="pre-line">
              {convertChinese(pwaInstall.content, language)}
            </Typography>
          </Box>
        </Paper>
        {/* New User Guide Section */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
           {convertChinese('新手指南', language)}
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
          {convertChinese('常見問題', language)}
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
          {convertChinese('聯繫我們', language)}
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Typography paragraph>
          {convertChinese('如需進一步協助，請聯絡我們：', language)}
            </Typography>
            <Box sx={{ ml: 2 }}>
              <Typography paragraph>
          {convertChinese('電子郵件：', language)}
                <Link href="mailto:support@example.com">edu@eccseattle.org</Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}