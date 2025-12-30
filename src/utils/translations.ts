interface Translations {
  [key: string]: {
    'zh-TW': string;
    'zh-CN': string;
  };
}

export const translations: Translations = {
  welcomeTo: {
    'zh-TW': '歡迎來到',
    'zh-CN': '欢迎来到'
  },
  planDay: {
    'zh-TW': '今天是{{date}}，計劃的第 {{day}} 天',
    'zh-CN': '今天是{{date}}，计划的第 {{day}} 天'
  },
  reading: {
    'zh-TW': '讀經',
    'zh-CN': '读经'
  },
  meditation: {
    'zh-TW': '默想經文',
    'zh-CN': '默想经文'
  },
  enterLesson: {
    'zh-TW': '點擊進入',
    'zh-CN': '点击进入'
  },
  noLessonToday: {
    'zh-TW': '今天沒有安排的内容或課程尚未開始。',
    'zh-CN': '今天没有安排的内容或课程尚未开始。'
  },
  menu: {
    'zh-TW': '選單',
    'zh-CN': '菜单'
  },
  courseDirectory: {
    'zh-TW': '課程目錄',
    'zh-CN': '课程目录'
  },
  noNotesFound: {
    'zh-TW': '目前沒有筆記',
    'zh-CN': '目前没有笔记'
  },
  myNotes: {
    'zh-TW': '我的筆記',
    'zh-CN': '我的笔记'
  },
  // Layout
  appTitle: {
    'zh-TW': 'ECC在線課程',
    'zh-CN': 'ECC在线课程'
  },
  homepage: {
    'zh-TW': '首頁',
    'zh-CN': '首页'
  },
  myCourses: {
    'zh-TW': '我的課程',
    'zh-CN': '我的课程'
  },
  fontSize: {
    'zh-TW': '字體大小',
    'zh-CN': '字体大小'
  },
  small: {
    'zh-TW': '小',
    'zh-CN': '小'
  },
  medium: {
    'zh-TW': '中',
    'zh-CN': '中'
  },
  large: {
    'zh-TW': '大',
    'zh-CN': '大'
  },
  darkMode: {
    'zh-TW': '深色模式',
    'zh-CN': '深色模式'
  },
  language: {
    'zh-TW': '語言',
    'zh-CN': '语言'
  },
  traditional: {
    'zh-TW': '繁體',
    'zh-CN': '繁體'
  },
  simplified: {
    'zh-TW': '简体',
    'zh-CN': '简体'
  },
  signIn: {
    'zh-TW': '登入',
    'zh-CN': '登录'
  },
  signOut: {
    'zh-TW': '登出',
    'zh-CN': '登出'
  },
  help: {
    'zh-TW': '幫助',
    'zh-CN': '帮助'
  },

  // Course Progress
  courseProgress: {
    'zh-TW': '課程進度',
    'zh-CN': '课程进度'
  },
  noLessonsCompleted: {
    'zh-TW': '尚未完成任何課程。開始您的學習之旅！',
    'zh-CN': '尚未完成任何课程。开始您的学习之旅！'
  },
  lessonsCompleted: {
    'zh-TW': '已完成 {{count}} 課',
    'zh-CN': '已完成 {{count}} 课'
  },
  completionCalendar: {
    'zh-TW': '完成日曆',
    'zh-CN': '完成日历'
  },
  noLessonsCompletedTooltip: {
    'zh-TW': '尚未完成任何課程',
    'zh-CN': '尚未完成任何课程'
  },
  latestCompletedLesson: {
    'zh-TW': '最近完成的課程',
    'zh-CN': '最近完成的课程'
  },
  nextUp: {
    'zh-TW': '下一課',
    'zh-CN': '下一课'
  },
  selectCourse: {
    'zh-TW': '請選擇課程',
    'zh-CN': '请选择课程'
  },
  // Course List
  availableCourses: {
    'zh-TW': '可選課程',
    'zh-CN': '可选课程'
  },
  signInToAccess: {
    'zh-TW': '請登入以訪問課程',
    'zh-CN': '请登录以访问课程'
  },
  viewDescription: {
    'zh-TW': '課程介紹',
    'zh-CN': '课程介绍'
  },
  enterCourse: {
    'zh-TW': '進入課程',
    'zh-CN': '进入课程'
  },
  failedToLoadCourses: {
    'zh-TW': '載入課程失敗。請稍後再試。',
    'zh-CN': '加载课程失败。请稍后再试。'
  },
  signInMessage: {
    'zh-TW': '登入以訪問完整課程內容並追蹤您的學習進度。',
    'zh-CN': '登录以访问完整课程内容并跟踪您的学习进度。'
  },
  noCourses: {
    'zh-TW': '目前沒有可用的課程',
    'zh-CN': '目前没有可用的课程'
  },

  // Lesson View
  personalNotes: {
    'zh-TW': '個人筆記',
    'zh-CN': '个人笔记'
  },
  writeNotesHere: {
    'zh-TW': '在此撰寫您的筆記...',
    'zh-CN': '在此撰写您的笔记...'
  },
  mustWriteNote: {
    'zh-TW': '可以寫下禱告、感恩、反思，或簡單的『哈利路亞』、『阿門』，才能繼續到下一天讀經內容。',
    'zh-CN': '可以写下祷告、感恩、反思，或简单的“哈利路亚”、“阿门”，才能继续到下一天读经内容。'
  },
  saving: {
    'zh-TW': '保存中...',
    'zh-CN': '保存中...'
  },
  saveAndComplete: {
    'zh-TW': '保存並完成課程',
    'zh-CN': '保存并完成课程'
  },
  previousScore: {
    'zh-TW': '上次成績：{{score}}/{{total}} 於 {{date}}',
    'zh-CN': '上次成绩：{{score}}/{{total}} 于 {{date}}'
  },
  previousTest: {
    'zh-TW': '上次測驗：於 {{date}}',
    'zh-CN': '上次测验：于 {{date}}'
  },
  retakeQuiz: {
    'zh-TW': '重新測驗',
    'zh-CN': '重新测验'
  },
  startQuiz: {
    'zh-TW': '開始測驗',
    'zh-CN': '开始测验'
  },
  saveNoteError: {
    'zh-TW': '儲存筆記時發生錯誤：{{message}}。請重試。',
    'zh-CN': '保存笔记时发生错误：{{message}}。请重试。'
  },
  // Course View
  courseNotFound: {
    'zh-TW': '正在載入課程...',
    'zh-CN': '正在载入课程...'
  },
  registerCourseTitle: {
    'zh-TW': '註冊課程',
    'zh-CN': '注册课程'
  },
  registerCourseDescription: {
    'zh-TW': '註冊以追蹤您的學習進度並訪問所有課程內容。',
    'zh-CN': '注册以跟踪您的学习进度并访问所有课程内容。'
  },
  registerNow: {
    'zh-TW': '立即註冊',
    'zh-CN': '立即注册'
  },
  registerCourse: {
    'zh-TW': '註冊課程',
    'zh-CN': '注册课程'
  },
  dropCourse: {
    'zh-TW': '註銷課程',
    'zh-CN': '注销课程'
  },
  dropCourseConfirm: {
    'zh-TW': '您確定要退出此課程嗎？您的進度將被保存，但您需要重新註冊才能繼續。',
    'zh-CN': '您确定要退出此课程吗？您的进度将被保存，但您需要重新注册才能继续。'
  },
  seeQuizResults: {
    'zh-TW': '查看測驗結果',
    'zh-CN': '查看测验结果'
  },
  congratulationsTitle: {
    'zh-TW': '恭喜您完成本課程！',
    'zh-CN': '恭喜您完成本课程！'
  },
  congratulationsMessage: {
    'zh-TW': '您在學習之旅中取得了很大的進步。',
    'zh-CN': '您在学习之旅中取得了很大的进步。'
  },
  close: {
    'zh-TW': '關閉',
    'zh-CN': '关闭'
  },
  nextLesson: {
    'zh-TW': '下一課',
    'zh-CN': '下一课'
  },
  markAsComplete: {
    'zh-TW': '標記為完成',
    'zh-CN': '标记为完成'
  },
  lessonCompleted: {
    'zh-TW': '課程已完成',
    'zh-CN': '课程已完成'
  },

  // Login
  createAccount: {
    'zh-TW': '建立帳號',
    'zh-CN': '创建账号'
  },
  fillRequiredFields: {
    'zh-TW': '請填寫所有必填欄位。',
    'zh-CN': '请填写所有必填字段。'
  },
  passwordsNotMatch: {
    'zh-TW': '密碼不相符。',
    'zh-CN': '密码不匹配。'
  },
  passwordTooShort: {
    'zh-TW': '密碼長度必須至少為6個字符。',
    'zh-CN': '密码长度必须至少为6个字符。'
  },
  failedToCreateAccount: {
    'zh-TW': '無法建立帳號。',
    'zh-CN': '无法创建账号。'
  },
  failedToSignIn: {
    'zh-TW': '登入失敗。',
    'zh-CN': '登录失败。'
  },
  name: {
    'zh-TW': '姓名',
    'zh-CN': '姓名'
  },
  email: {
    'zh-TW': '電子郵件',
    'zh-CN': '电子邮件'
  },
  password: {
    'zh-TW': '密碼',
    'zh-CN': '密码'
  },
  confirmPassword: {
    'zh-TW': '確認密碼',
    'zh-CN': '确认密码'
  },
  signUp: {
    'zh-TW': '註冊',
    'zh-CN': '注册'
  },
  haveAccount: {
    'zh-TW': '已經有帳號？登入',
    'zh-CN': '已有账号？登录'
  },
  noAccount: {
    'zh-TW': '還沒有帳號？註冊',
    'zh-CN': '还没有账号？注册'
  },
  or: {
    'zh-TW': '或',
    'zh-CN': '或'
  },
  continueWithGoogle: {
    'zh-TW': '使用Google帳號繼續',
    'zh-CN': '使用Google账号继续'
  },
  forgotPassword: {
    'zh-TW': '忘記密碼？',
    'zh-CN': '忘记密码？'
  },
  resetPasswordSuccess: {
    'zh-TW': '重設密碼的連結已發送到您的電子郵件。如未收到，請檢查垃圾郵件資料夾。',
    'zh-CN': '重设密码的链接已发送到您的电子邮件。如未收到，请检查垃圾邮件文件夹。'
  },
  failedToResetPassword: {
    'zh-TW': '重設密碼失敗。請稍後再試。',
    'zh-CN': '重设密码失败。请稍后再试。'
  },
  emailRequiredForPasswordReset: {
    'zh-TW': '請輸入電子郵件以重設密碼。',
    'zh-CN': '请输入电子邮件以重设密码。'
  },
  resetPassword: {
    'zh-TW': '重設密碼',
    'zh-CN': '重设密码'
  },
  newPassword: {
    'zh-TW': '新密碼',
    'zh-CN': '新密码'
  },
  confirmNewPassword: {
    'zh-TW': '確認新密碼',
    'zh-CN': '确认新密码'
  },
  resetPasswordFor: {
    'zh-TW': '重設密碼',
    'zh-CN': '重设密码'
  },
  passwordResetSuccess: {
    'zh-TW': '密碼重設成功！',
    'zh-CN': '密码重设成功！'
  },
  invalidResetLink: {
    'zh-TW': '無效或過期的密碼重設連結',
    'zh-CN': '无效或过期的密码重设链接'
  },
  verifyingResetLink: {
    'zh-TW': '正在驗證密碼重設連結...',
    'zh-CN': '正在验证密码重设链接...'
  },
  backToLogin: {
    'zh-TW': '返回登入',
    'zh-CN': '返回登录'
  },


  // Quiz View
  correct: {
    'zh-TW': '✓ 正確',
    'zh-CN': '✓ 正确'
  },
  incorrect: {
    'zh-TW': '✗ 錯誤',
    'zh-CN': '✗ 错误'
  },
  enterYourAnswer: {
    'zh-TW': '請在此輸入你的答案...',
    'zh-CN': '请在此输入你的答案...'
  },
  quizResults: {
    'zh-TW': '測驗結果',
    'zh-CN': '测验结果'
  },
  perfectScore: {
    'zh-TW': '完美的分數！做得好！',
    'zh-CN': '完美的分数！做得好！'
  },
  reviewAnswers: {
    'zh-TW': '查看上方答案以了解可以改進的地方。',
    'zh-CN': '查看上方答案以了解可以改进的地方。'
  },
  submit: {
    'zh-TW': '提交',
    'zh-CN': '提交'
  },
  weeklyQuiz: {
    'zh-TW': '測驗',
    'zh-CN': '测验'
  },
  quizReminder: {
    'zh-TW': '測驗提醒',
    'zh-CN': '测验提醒'
  },
  completeQuizReminder: {
    'zh-TW': '請記得完成本課程的測驗以獲得完整學習體驗。',
    'zh-CN': '请记得完成本课程的测验以获得完整学习体验。'
  },
  lastUpdate: {
    'zh-TW': '最後更新：{{date}}',
    'zh-CN': '最后更新：{{date}}'
  },
  courseToken: {
    'zh-TW': '課程邀請碼',
    'zh-CN': '课程邀请码'
  },
  invalidToken: {
    'zh-TW': '密碼錯誤',
    'zh-CN': '密码错误'
  },
  cancel: {
    'zh-TW': '取消',
    'zh-CN': '取消'
  },
  accessDenied: {
    'zh-TW': '無法訪問課程',
    'zh-CN': '无法访问课程'
  },
  pleaseRegisterFromHome: {
    'zh-TW': '請從首頁註冊課程以訪問課程內容',
    'zh-CN': '请从首页注册课程以访问课程内容'
  },
  goToHome: {
    'zh-TW': '返回首頁',
    'zh-CN': '返回首页'
  },
  settings: {
    'zh-TW': '設定',
    'zh-CN': '设置'
  },
  admin: {
    'zh-TW': '管理員',
    'zh-CN': '管理员'
  },
  manageCourse: {
    'zh-TW': '管理課程',
    'zh-CN': '管理课程'
  },
  quickJump: {
    'zh-TW': '快速跳轉',
    'zh-CN': '快速跳转'
  },
  initUnit: {
    'zh-TW': '起始',
    'zh-CN': '起始'
  },
  index: {
    'zh-TW': '目錄',
    'zh-CN': '目录'
  },
  maxUnitsSelected: {
    'zh-TW': '最多只能選擇 {{count}} 個單元',
    'zh-CN': '最多只能选择 {{count}} 个单元'
  },
  requiredQuestionsRemaining: {
    'zh-TW': '已完成 {{completed}}/{{total}}',
    'zh-CN': '已完成 {{completed}}/{{total}}'
  },
  opensAt: {
    'zh-TW': '開放日期：{{date}}',
    'zh-CN': '开放日期：{{date}}'
  },
  unit: {
    'zh-TW': '單元',
    'zh-CN': '单元'
  },
  score: {
    'zh-TW': '分數',
    'zh-CN': '分数'
  },
  date: {
    'zh-TW': '日期',
    'zh-CN': '日期'
  },
  announcements: {
    'zh-TW': '系統公告',
    'zh-CN': '系统公告'
  },
  noAnnouncements: {
    'zh-TW': '目前沒有公告',
    'zh-CN': '目前没有公告'
  },
  failedToLoadAnnouncements: {
    'zh-TW': '載入公告失敗',
    'zh-CN': '加载公告失败'
  },
  forCourse: {
    'zh-TW': '課程{{course}}的學員：',
    'zh-CN': '课程{{course}}的学员：'
  },
  forEveryone: {
    'zh-TW': '所有人：',
    'zh-CN': '所有人：'
  },
  loginToTakeQuiz: {
    'zh-TW': '請登入以參加測驗',
    'zh-CN': '请登录以参加测验'
  },
  loginToTakeNotes: {
    'zh-TW': '請登入以撰寫筆記',
    'zh-CN': '请登录以撰写笔记'
  },
  loginToTrackProgress: {
    'zh-TW': '請登入以追蹤進度',
    'zh-CN': '请登录以追踪进度'
  },
  publicAccess: {
    'zh-TW': '公開',
    'zh-CN': '公开'
  },
};
