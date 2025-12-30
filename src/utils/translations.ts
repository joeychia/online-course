interface Translations {
  [key: string]: {
    'zh-TW': string;
    'zh-CN': string;
    'en-US': string;
  };
}

export const translations: Translations = {
  welcomeTo: {
    'zh-TW': '歡迎來到',
    'zh-CN': '欢迎来到',
    'en-US': 'Welcome to'
  },
  planDay: {
    'zh-TW': '今天是{{date}}，計劃的第 {{day}} 天',
    'zh-CN': '今天是{{date}}，计划的第 {{day}} 天',
    'en-US': 'Today is {{date}}, Day {{day}} of the plan'
  },
  reading: {
    'zh-TW': '讀經',
    'zh-CN': '读经',
    'en-US': 'Scripture Reading'
  },
  meditation: {
    'zh-TW': '默想經文',
    'zh-CN': '默想经文',
    'en-US': 'Meditation'
  },
  enterLesson: {
    'zh-TW': '點擊進入',
    'zh-CN': '点击进入',
    'en-US': 'Click to Enter'
  },
  noLessonToday: {
    'zh-TW': '今天沒有安排的内容或課程尚未開始。',
    'zh-CN': '今天没有安排的内容或课程尚未开始。',
    'en-US': 'No content scheduled for today or the course has not started yet.'
  },
  menu: {
    'zh-TW': '選單',
    'zh-CN': '菜单',
    'en-US': 'Menu'
  },
  courseDirectory: {
    'zh-TW': '課程目錄',
    'zh-CN': '课程目录',
    'en-US': 'Course Directory'
  },
  noNotesFound: {
    'zh-TW': '目前沒有筆記',
    'zh-CN': '目前没有笔记',
    'en-US': 'No notes found'
  },
  myNotes: {
    'zh-TW': '我的筆記',
    'zh-CN': '我的笔记',
    'en-US': 'My Notes'
  },
  // Layout
  appTitle: {
    'zh-TW': 'ECC在線課程',
    'zh-CN': 'ECC在线课程',
    'en-US': 'ECC Online Course'
  },
  homepage: {
    'zh-TW': '首頁',
    'zh-CN': '首页',
    'en-US': 'Home'
  },
  myCourses: {
    'zh-TW': '我的課程',
    'zh-CN': '我的课程',
    'en-US': 'My Courses'
  },
  fontSize: {
    'zh-TW': '字體大小',
    'zh-CN': '字体大小',
    'en-US': 'Font Size'
  },
  small: {
    'zh-TW': '小',
    'zh-CN': '小',
    'en-US': 'Small'
  },
  medium: {
    'zh-TW': '中',
    'zh-CN': '中',
    'en-US': 'Medium'
  },
  large: {
    'zh-TW': '大',
    'zh-CN': '大',
    'en-US': 'Large'
  },
  darkMode: {
    'zh-TW': '深色模式',
    'zh-CN': '深色模式',
    'en-US': 'Dark Mode'
  },
  language: {
    'zh-TW': '語言',
    'zh-CN': '语言',
    'en-US': 'Language'
  },
  traditional: {
    'zh-TW': '繁體',
    'zh-CN': '繁體',
    'en-US': '繁'
  },
  simplified: {
    'zh-TW': '简体',
    'zh-CN': '简体',
    'en-US': '简'
  },
  english: {
    'zh-TW': '英文',
    'zh-CN': '英文',
    'en-US': 'ENG'
  },
  signIn: {
    'zh-TW': '登入',
    'zh-CN': '登录',
    'en-US': 'Sign In'
  },
  signOut: {
    'zh-TW': '登出',
    'zh-CN': '登出',
    'en-US': 'Sign Out'
  },
  help: {
    'zh-TW': '幫助',
    'zh-CN': '帮助',
    'en-US': 'Help'
  },

  // Course Progress
  courseProgress: {
    'zh-TW': '課程進度',
    'zh-CN': '课程进度',
    'en-US': 'Course Progress'
  },
  noLessonsCompleted: {
    'zh-TW': '尚未完成任何課程。開始您的學習之旅！',
    'zh-CN': '尚未完成任何课程。开始您的学习之旅！',
    'en-US': 'No lessons completed yet. Start your learning journey!'
  },
  lessonsCompleted: {
    'zh-TW': '已完成 {{count}} 課',
    'zh-CN': '已完成 {{count}} 课',
    'en-US': '{{count}} lessons completed'
  },
  completionCalendar: {
    'zh-TW': '完成日曆',
    'zh-CN': '完成日历',
    'en-US': 'Completion Calendar'
  },
  noLessonsCompletedTooltip: {
    'zh-TW': '尚未完成任何課程',
    'zh-CN': '尚未完成任何课程',
    'en-US': 'No lessons completed yet'
  },
  latestCompletedLesson: {
    'zh-TW': '最近完成的課程',
    'zh-CN': '最近完成的课程',
    'en-US': 'Latest Completed Lesson'
  },
  nextUp: {
    'zh-TW': '下一課',
    'zh-CN': '下一课',
    'en-US': 'Next Up'
  },
  selectCourse: {
    'zh-TW': '請選擇課程',
    'zh-CN': '请选择课程',
    'en-US': 'Please select a course'
  },
  // Course List
  availableCourses: {
    'zh-TW': '可選課程',
    'zh-CN': '可选课程',
    'en-US': 'Available Courses'
  },
  signInToAccess: {
    'zh-TW': '請登入以訪問課程',
    'zh-CN': '请登录以访问课程',
    'en-US': 'Please sign in to access courses'
  },
  viewDescription: {
    'zh-TW': '課程介紹',
    'zh-CN': '课程介绍',
    'en-US': 'Course Description'
  },
  enterCourse: {
    'zh-TW': '進入課程',
    'zh-CN': '进入课程',
    'en-US': 'Enter Course'
  },
  failedToLoadCourses: {
    'zh-TW': '載入課程失敗。請稍後再試。',
    'zh-CN': '加载课程失败。请稍后再试。',
    'en-US': 'Failed to load courses. Please try again later.'
  },
  signInMessage: {
    'zh-TW': '登入以訪問完整課程內容並追蹤您的學習進度。',
    'zh-CN': '登录以访问完整课程内容并跟踪您的学习进度。',
    'en-US': 'Sign in to access full course content and track your learning progress.'
  },
  noCourses: {
    'zh-TW': '目前沒有可用的課程',
    'zh-CN': '目前没有可用的课程',
    'en-US': 'No courses available at the moment'
  },

  // Lesson View
  personalNotes: {
    'zh-TW': '個人筆記',
    'zh-CN': '个人笔记',
    'en-US': 'Personal Notes'
  },
  writeNotesHere: {
    'zh-TW': '在此撰寫您的筆記...',
    'zh-CN': '在此撰写您的笔记...',
    'en-US': 'Write your notes here...'
  },
  mustWriteNote: {
    'zh-TW': '可以寫下禱告、感恩、反思，或簡單的『哈利路亞』、『阿門』，才能繼續到下一天讀經內容。',
    'zh-CN': '可以写下祷告、感恩、反思，或简单的“哈利路亚”、“阿门”，才能继续到下一天读经内容。',
    'en-US': 'You can write down prayers, gratitude, reflections, or simply "Hallelujah", "Amen" to proceed to the next day\'s reading content.'
  },
  saving: {
    'zh-TW': '保存中...',
    'zh-CN': '保存中...',
    'en-US': 'Saving...'
  },
  saveAndComplete: {
    'zh-TW': '保存並完成課程',
    'zh-CN': '保存并完成课程',
    'en-US': 'Save and Complete Lesson'
  },
  previousScore: {
    'zh-TW': '上次成績：{{score}}/{{total}} 於 {{date}}',
    'zh-CN': '上次成绩：{{score}}/{{total}} 于 {{date}}',
    'en-US': 'Last Score: {{score}}/{{total}} on {{date}}'
  },
  previousTest: {
    'zh-TW': '上次測驗：於 {{date}}',
    'zh-CN': '上次测验：于 {{date}}',
    'en-US': 'Last Test: on {{date}}'
  },
  retakeQuiz: {
    'zh-TW': '重新測驗',
    'zh-CN': '重新测验',
    'en-US': 'Retake Quiz'
  },
  startQuiz: {
    'zh-TW': '開始測驗',
    'zh-CN': '开始测验',
    'en-US': 'Start Quiz'
  },
  saveNoteError: {
    'zh-TW': '儲存筆記時發生錯誤：{{message}}。請重試。',
    'zh-CN': '保存笔记时发生错误：{{message}}。请重试。',
    'en-US': 'Error saving note: {{message}}. Please try again.'
  },
  // Course View
  courseNotFound: {
    'zh-TW': '正在載入課程...',
    'zh-CN': '正在载入课程...',
    'en-US': 'Loading course...'
  },
  registerCourseTitle: {
    'zh-TW': '註冊課程',
    'zh-CN': '注册课程',
    'en-US': 'Register Course'
  },
  registerCourseDescription: {
    'zh-TW': '註冊以追蹤您的學習進度並訪問所有課程內容。',
    'zh-CN': '注册以跟踪您的学习进度并访问所有课程内容。',
    'en-US': 'Register to track your learning progress and access all course content.'
  },
  registerNow: {
    'zh-TW': '立即註冊',
    'zh-CN': '立即注册',
    'en-US': 'Register Now'
  },
  registerCourse: {
    'zh-TW': '註冊課程',
    'zh-CN': '注册课程',
    'en-US': 'Register Course'
  },
  dropCourse: {
    'zh-TW': '註銷課程',
    'zh-CN': '注销课程',
    'en-US': 'Drop Course'
  },
  dropCourseConfirm: {
    'zh-TW': '您確定要退出此課程嗎？您的進度將被保存，但您需要重新註冊才能繼續。',
    'zh-CN': '您确定要退出此课程吗？您的进度将被保存，但您需要重新注册才能继续。',
    'en-US': 'Are you sure you want to drop this course? Your progress will be saved, but you will need to re-register to continue.'
  },
  seeQuizResults: {
    'zh-TW': '查看測驗結果',
    'zh-CN': '查看测验结果',
    'en-US': 'See Quiz Results'
  },
  congratulationsTitle: {
    'zh-TW': '恭喜您完成本課程！',
    'zh-CN': '恭喜您完成本课程！',
    'en-US': 'Congratulations on completing this course!'
  },
  congratulationsMessage: {
    'zh-TW': '您在學習之旅中取得了很大的進步。',
    'zh-CN': '您在学习之旅中取得了很大的进步。',
    'en-US': 'You have made great progress in your learning journey.'
  },
  close: {
    'zh-TW': '關閉',
    'zh-CN': '关闭',
    'en-US': 'Close'
  },
  nextLesson: {
    'zh-TW': '下一課',
    'zh-CN': '下一课',
    'en-US': 'Next Lesson'
  },
  markAsComplete: {
    'zh-TW': '標記為完成',
    'zh-CN': '标记为完成',
    'en-US': 'Mark as Complete'
  },
  lessonCompleted: {
    'zh-TW': '課程已完成',
    'zh-CN': '课程已完成',
    'en-US': 'Lesson Completed'
  },

  // Login
  createAccount: {
    'zh-TW': '建立帳號',
    'zh-CN': '创建账号',
    'en-US': 'Create Account'
  },
  fillRequiredFields: {
    'zh-TW': '請填寫所有必填欄位。',
    'zh-CN': '请填写所有必填字段。',
    'en-US': 'Please fill in all required fields.'
  },
  passwordsNotMatch: {
    'zh-TW': '密碼不相符。',
    'zh-CN': '密码不匹配。',
    'en-US': 'Passwords do not match.'
  },
  passwordTooShort: {
    'zh-TW': '密碼長度必須至少為6個字符。',
    'zh-CN': '密码长度必须至少为6个字符。',
    'en-US': 'Password must be at least 6 characters long.'
  },
  failedToCreateAccount: {
    'zh-TW': '無法建立帳號。',
    'zh-CN': '无法创建账号。',
    'en-US': 'Failed to create account.'
  },
  failedToSignIn: {
    'zh-TW': '登入失敗。',
    'zh-CN': '登录失败。',
    'en-US': 'Failed to sign in.'
  },
  name: {
    'zh-TW': '姓名',
    'zh-CN': '姓名',
    'en-US': 'Name'
  },
  email: {
    'zh-TW': '電子郵件',
    'zh-CN': '电子邮件',
    'en-US': 'Email'
  },
  password: {
    'zh-TW': '密碼',
    'zh-CN': '密码',
    'en-US': 'Password'
  },
  confirmPassword: {
    'zh-TW': '確認密碼',
    'zh-CN': '确认密码',
    'en-US': 'Confirm Password'
  },
  signUp: {
    'zh-TW': '註冊',
    'zh-CN': '注册',
    'en-US': 'Sign Up'
  },
  haveAccount: {
    'zh-TW': '已經有帳號？登入',
    'zh-CN': '已有账号？登录',
    'en-US': 'Already have an account? Sign In'
  },
  noAccount: {
    'zh-TW': '還沒有帳號？註冊',
    'zh-CN': '还没有账号？注册',
    'en-US': 'Don\'t have an account? Sign Up'
  },
  or: {
    'zh-TW': '或',
    'zh-CN': '或',
    'en-US': 'Or'
  },
  continueWithGoogle: {
    'zh-TW': '使用Google帳號繼續',
    'zh-CN': '使用Google账号继续',
    'en-US': 'Continue with Google'
  },
  forgotPassword: {
    'zh-TW': '忘記密碼？',
    'zh-CN': '忘记密码？',
    'en-US': 'Forgot Password?'
  },
  resetPasswordSuccess: {
    'zh-TW': '重設密碼的連結已發送到您的電子郵件。如未收到，請檢查垃圾郵件資料夾。',
    'zh-CN': '重设密码的链接已发送到您的电子邮件。如未收到，请检查垃圾邮件文件夹。',
    'en-US': 'Password reset link has been sent to your email. Please check your spam folder if not received.'
  },
  failedToResetPassword: {
    'zh-TW': '重設密碼失敗。請稍後再試。',
    'zh-CN': '重设密码失败。请稍后再试。',
    'en-US': 'Failed to reset password. Please try again later.'
  },
  emailRequiredForPasswordReset: {
    'zh-TW': '請輸入電子郵件以重設密碼。',
    'zh-CN': '请输入电子邮件以重设密码。',
    'en-US': 'Please enter your email to reset password.'
  },
  resetPassword: {
    'zh-TW': '重設密碼',
    'zh-CN': '重设密码',
    'en-US': 'Reset Password'
  },
  newPassword: {
    'zh-TW': '新密碼',
    'zh-CN': '新密码',
    'en-US': 'New Password'
  },
  confirmNewPassword: {
    'zh-TW': '確認新密碼',
    'zh-CN': '确认新密码',
    'en-US': 'Confirm New Password'
  },
  resetPasswordFor: {
    'zh-TW': '重設密碼',
    'zh-CN': '重设密码',
    'en-US': 'Reset Password'
  },
  passwordResetSuccess: {
    'zh-TW': '密碼重設成功！',
    'zh-CN': '密码重设成功！',
    'en-US': 'Password reset successful!'
  },
  invalidResetLink: {
    'zh-TW': '無效或過期的密碼重設連結',
    'zh-CN': '无效或过期的密码重设链接',
    'en-US': 'Invalid or expired password reset link'
  },
  verifyingResetLink: {
    'zh-TW': '正在驗證密碼重設連結...',
    'zh-CN': '正在验证密码重设链接...',
    'en-US': 'Verifying password reset link...'
  },
  backToLogin: {
    'zh-TW': '返回登入',
    'zh-CN': '返回登录',
    'en-US': 'Back to Login'
  },


  // Quiz View
  correct: {
    'zh-TW': '✓ 正確',
    'zh-CN': '✓ 正确',
    'en-US': '✓ Correct'
  },
  incorrect: {
    'zh-TW': '✗ 錯誤',
    'zh-CN': '✗ 错误',
    'en-US': '✗ Incorrect'
  },
  enterYourAnswer: {
    'zh-TW': '請在此輸入你的答案...',
    'zh-CN': '请在此输入你的答案...',
    'en-US': 'Please enter your answer here...'
  },
  quizResults: {
    'zh-TW': '測驗結果',
    'zh-CN': '测验结果',
    'en-US': 'Quiz Results'
  },
  perfectScore: {
    'zh-TW': '完美的分數！做得好！',
    'zh-CN': '完美的分数！做得好！',
    'en-US': 'Perfect Score! Well done!'
  },
  reviewAnswers: {
    'zh-TW': '查看上方答案以了解可以改進的地方。',
    'zh-CN': '查看上方答案以了解可以改进的地方。',
    'en-US': 'Review the answers above to see where you can improve.'
  },
  submit: {
    'zh-TW': '提交',
    'zh-CN': '提交',
    'en-US': 'Submit'
  },
  weeklyQuiz: {
    'zh-TW': '測驗',
    'zh-CN': '测验',
    'en-US': 'Quiz'
  },
  quizReminder: {
    'zh-TW': '測驗提醒',
    'zh-CN': '测验提醒',
    'en-US': 'Quiz Reminder'
  },
  completeQuizReminder: {
    'zh-TW': '請記得完成本課程的測驗以獲得完整學習體驗。',
    'zh-CN': '请记得完成本课程的测验以获得完整学习体验。',
    'en-US': 'Please remember to complete the quiz for this course to get the full learning experience.'
  },
  lastUpdate: {
    'zh-TW': '最後更新：{{date}}',
    'zh-CN': '最后更新：{{date}}',
    'en-US': 'Last updated: {{date}}'
  },
  courseToken: {
    'zh-TW': '課程邀請碼',
    'zh-CN': '课程邀请码',
    'en-US': 'Course Invitation Code'
  },
  invalidToken: {
    'zh-TW': '密碼錯誤',
    'zh-CN': '密码错误',
    'en-US': 'Invalid Code'
  },
  cancel: {
    'zh-TW': '取消',
    'zh-CN': '取消',
    'en-US': 'Cancel'
  },
  accessDenied: {
    'zh-TW': '無法訪問課程',
    'zh-CN': '无法访问课程',
    'en-US': 'Access Denied'
  },
  pleaseRegisterFromHome: {
    'zh-TW': '請從首頁註冊課程以訪問課程內容',
    'zh-CN': '请从首页注册课程以访问课程内容',
    'en-US': 'Please register for the course from the home page to access course content'
  },
  goToHome: {
    'zh-TW': '返回首頁',
    'zh-CN': '返回首页',
    'en-US': 'Go to Home'
  },
  settings: {
    'zh-TW': '設定',
    'zh-CN': '设置',
    'en-US': 'Settings'
  },
  admin: {
    'zh-TW': '管理員',
    'zh-CN': '管理员',
    'en-US': 'Admin'
  },
  manageCourse: {
    'zh-TW': '管理課程',
    'zh-CN': '管理课程',
    'en-US': 'Manage Course'
  },
  quickJump: {
    'zh-TW': '快速跳轉',
    'zh-CN': '快速跳转',
    'en-US': 'Quick Jump'
  },
  initUnit: {
    'zh-TW': '起始',
    'zh-CN': '起始',
    'en-US': 'Start'
  },
  index: {
    'zh-TW': '目錄',
    'zh-CN': '目录',
    'en-US': 'Index'
  },
  maxUnitsSelected: {
    'zh-TW': '最多只能選擇 {{count}} 個單元',
    'zh-CN': '最多只能选择 {{count}} 个单元',
    'en-US': 'You can only select up to {{count}} units'
  },
  requiredQuestionsRemaining: {
    'zh-TW': '已完成 {{completed}}/{{total}}',
    'zh-CN': '已完成 {{completed}}/{{total}}',
    'en-US': 'Completed {{completed}}/{{total}}'
  },
  opensAt: {
    'zh-TW': '開放日期：{{date}}',
    'zh-CN': '开放日期：{{date}}',
    'en-US': 'Opens at: {{date}}'
  },
  unit: {
    'zh-TW': '單元',
    'zh-CN': '单元',
    'en-US': 'Unit'
  },
  score: {
    'zh-TW': '分數',
    'zh-CN': '分数',
    'en-US': 'Score'
  },
  date: {
    'zh-TW': '日期',
    'zh-CN': '日期',
    'en-US': 'Date'
  },
  announcements: {
    'zh-TW': '系統公告',
    'zh-CN': '系统公告',
    'en-US': 'Announcements'
  },
  noAnnouncements: {
    'zh-TW': '目前沒有公告',
    'zh-CN': '目前没有公告',
    'en-US': 'No announcements at the moment'
  },
  failedToLoadAnnouncements: {
    'zh-TW': '載入公告失敗',
    'zh-CN': '加载公告失败',
    'en-US': 'Failed to load announcements'
  },
  forCourse: {
    'zh-TW': '課程{{course}}的學員：',
    'zh-CN': '课程{{course}}的学员：',
    'en-US': 'For students of course {{course}}:'
  },
  forEveryone: {
    'zh-TW': '所有人：',
    'zh-CN': '所有人：',
    'en-US': 'For everyone:'
  },
  loginToTakeQuiz: {
    'zh-TW': '請登入以參加測驗',
    'zh-CN': '请登录以参加测验',
    'en-US': 'Please sign in to take the quiz'
  },
  loginToTakeNotes: {
    'zh-TW': '請登入以撰寫筆記',
    'zh-CN': '请登录以撰写笔记',
    'en-US': 'Please sign in to write notes'
  },
  loginToTrackProgress: {
    'zh-TW': '請登入以追蹤進度',
    'zh-CN': '请登录以追踪进度',
    'en-US': 'Please sign in to track progress'
  },
  publicAccess: {
    'zh-TW': '公開',
    'zh-CN': '公开',
    'en-US': 'Public'
  },
};
