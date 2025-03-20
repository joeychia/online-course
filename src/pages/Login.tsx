import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    Divider,
    Stack,
    Link,
    Snackbar,
    Alert,
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { useAuth } from '../hooks/useAuth';
import { firestoreService } from '../services/firestoreService';
import { useTranslation } from '../hooks/useTranslation';

export default function Login() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success' as 'success' | 'error'
    });
    const navigate = useNavigate();
    const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
    const { t } = useTranslation();

    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    const showMessage = (message: string, severity: 'success' | 'error' = 'error') => {
        setSnackbar({
            open: true,
            message,
            severity
        });
    };

    const validateForm = () => {
        if (!email || !password) {
            showMessage(t('fillRequiredFields'));
            return false;
        }
        if (isSignUp) {
            if (password !== confirmPassword) {
                showMessage(t('passwordsNotMatch'));
                return false;
            }
            if (password.length < 6) {
                showMessage(t('passwordTooShort'));
                return false;
            }
        }
        return true;
    };

    const handleEmailSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            setLoading(true);
            if (isSignUp) {
                const userCredential = await signUp(email, password);
                await firestoreService.createUser({
                    id: userCredential.uid,
                    email: userCredential.email || email,
                    name: name || email.split('@')[0],
                    progress: {},
                    registeredCourses: {},
                    groupIds: {},
                    notes: {},
                    QuizHistory: {},
                    roles: {
                        student: true,
                        instructor: false,
                        admin: false
                    },
                });
            } else {
                await signIn(email, password);
            }
            navigate('/');
        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : String(err);
            showMessage(isSignUp ? `${t('failedToCreateAccount')} ${errorMessage}` : `${t('failedToSignIn')} ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            let userCredential;
            try {
                userCredential = await signInWithGoogle();
            } catch (error) {
                // Check if the error is related to missing initial state
                if (error instanceof Error && 
                    error.message.includes('missing initial state')) {
                    // Retry with popup method
                    userCredential = await signInWithGoogle();
                } else {
                    throw error;
                }
            }

            const userProfile = await firestoreService.getUserById(userCredential.uid);
            if (!userProfile) {
                await firestoreService.createUser({
                    id: userCredential.uid,
                    email: userCredential.email || '',
                    name: userCredential.displayName || userCredential.email?.split('@')[0] || '',
                    progress: {},
                    registeredCourses: {},
                    groupIds: {},
                    notes: {},
                    QuizHistory: {},
                    roles: {
                        student: true,
                        instructor: false,
                        admin: false
                    },
                });
            }
            navigate('/');
        } catch (err) {
            console.error(err);
            // Handle popup closure error
            if (err instanceof Error && 
                (err.message.includes('popup_closed_by_user') || 
                 err.message.includes('cancelled'))) {
                return;
            }
            const errorMessage = err instanceof Error ? err.message : String(err);
            showMessage(`${t('failedToSignIn')} ${errorMessage}`);
        }
    };

    const toggleMode = () => {
        setIsSignUp(!isSignUp);
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 8, mb: 4 }}>
                <Paper elevation={3} sx={{ p: 4 }}>
                    <Typography variant="h4" component="h1" align="center" gutterBottom>
                        {isSignUp ? t('createAccount') : t('signIn')}
                    </Typography>

                    <form onSubmit={handleEmailSignIn}>
                        <Stack spacing={2}>
                            {isSignUp && (
                                <TextField
                                    label={t('name')}
                                    fullWidth
                                    variant="filled"
                                    value={name}
                                    required
                                    onChange={(e) => setName(e.target.value)}
                                />
                            )}
                            <TextField
                                label={t('email')}
                                type="email"
                                fullWidth
                                variant="filled"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <TextField
                                label={t('password')}
                                type="password"
                                fullWidth
                                variant="filled"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            {!isSignUp && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                </Box>
                            )}
                            {isSignUp && (
                                <TextField
                                    label={t('confirmPassword')}
                                    type="password"
                                    fullWidth
                                    variant="filled"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            )}
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                fullWidth
                                disabled={loading}
                            >
                                {isSignUp ? t('signUp') : t('signIn')}
                            </Button>
                        </Stack>
                    </form>

                    <Box sx={{ mt: 2, textAlign: 'center', display: 'flex', justifyContent: 'center', gap: 2, flexDirection: 'column' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                            <Link
                                component="button"
                                variant="body2"
                                onClick={toggleMode}
                                sx={{ cursor: 'pointer' }}
                            >
                                {isSignUp ? t('haveAccount') : t('noAccount')}
                            </Link>
                            {!isSignUp && (
                                <Link
                                    component="button"
                                    variant="body2"
                                    onClick={async (e) => {
                                        e.preventDefault();
                                        if (!email) {
                                            showMessage(t('emailRequiredForPasswordReset'));
                                            return;
                                        }
                                        try {
                                            setLoading(true);
                                            await resetPassword(email);
                                            showMessage(t('resetPasswordSuccess'), 'success');
                                        } catch (err) {
                                            console.error(err);
                                            const errorMessage = err instanceof Error ? err.message : String(err);
                                            showMessage(`${t('failedToResetPassword')} ${errorMessage}`);
                                        } finally {
                                            setLoading(false);
                                        }
                                    }}
                                    sx={{ cursor: 'pointer' }}
                                    disabled={loading}
                                >
                                    {t('forgotPassword')}
                                </Link>
                            )}
                        </Box>
                    </Box>

                    <Divider sx={{ my: 3 }}>{t('or')}</Divider>

                    <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<GoogleIcon />}
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                    >
                        {t('continueWithGoogle')}
                    </Button>
                </Paper>
            </Box>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
}