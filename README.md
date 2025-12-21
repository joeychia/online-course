# Online Course System

A modern online learning platform built with React, TypeScript, and Material-UI that allows users to preview and take courses.

## Features

### Guest Features
- Preview courses without signing in
- View course structure and first lesson of each unit
- Browse available courses and their descriptions

### User Features
- Sign up/sign in functionality
- Course registration and progress tracking
- Note-taking for lessons
- Quiz participation and history
- Progress-based lesson unlocking
- Multi-language support (English, Simplified Chinese, Traditional Chinese)

### Admin Features
- Course management (create/edit/delete)
- Unit and lesson management
- Lesson editor with rich text support
- Quiz creation and management
- Student progress tracking

### Upcoming Features
- Group joining and collaboration
- Group management
- Grade tracking and monitoring
- Personal dashboard

## Technical Stack

- **Frontend**:
  - React 18
  - TypeScript
  - Material-UI v5
  - React Router v6
  - Firebase Auth
  - Responsive design
  - PWA support
  - Toast UI Editor (Markdown support)

- **Backend**:
  - Cloud Firestore

- **Testing**:
  - Vitest

## Getting Started

1. Clone the repository
```bash
git clone [repository-url]
cd online-course-system
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

## Project Structure

```
src/
├── components/        # Reusable UI components
├── pages/            # Page components
├── contexts/         # React contexts
├── types/           # TypeScript type definitions
├── services/        # API and service layer
├── hooks/           # Custom React hooks
├── utils/           # Utility functions
├── config/          # Configuration files
└── mockData.ts      # Temporary mock data
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details
