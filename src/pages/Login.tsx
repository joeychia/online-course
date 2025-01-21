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
    Link
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { useAuth } from '../contexts/useAuth';
import { firestoreService } from '../services/firestoreService';
import { useTranslation } from '../hooks/useTranslation';

export default function Login() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { signIn, signUp, signInWithGoogle } = useAuth();
    const { t } = useTranslation();

    const validateForm = () => {
        if (!email || !password) {
            setError(t('fillRequiredFields'));
            return false;
        }
        if (isSignUp) {
            if (password !== confirmPassword) {
                setError(t('passwordsNotMatch'));
                return false;
            }
            if (password.length < 6) {
                setError(t('passwordTooShort'));
                return false;
            }
        }
        return true;
    };

    const handleEmailSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            setError('');
            setLoading(true);
            if (isSignUp) {
                const userCredential = await signUp(email, password);
                // Create user profile in Firestore
                await firestoreService.createUser({
                    id: userCredential.uid,
                    email: userCredential.email || email,
                    name: name || email.split('@')[0],
                    progress: {},
                    registeredCourses: {},
                    groupIds: {},
                    notes: {},
                    QuizHistory: {}
                });
            } else {
                await signIn(email, password);
            }
            navigate('/');
        } catch (err) {
            console.error(err);
            setError(isSignUp ? t('failedToCreateAccount') : t('failedToSignIn'));
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            setError('');
            setLoading(true);
            const userCredential = await signInWithGoogle();
            // Check if user profile exists, create if it doesn't
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
                    QuizHistory: {}
                });
            }
            navigate('/');
        } catch (err) {
            setError(t('failedToSignIn'));
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setIsSignUp(!isSignUp);
        setError('');
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 8, mb: 4 }}>
                <Paper elevation={3} sx={{ p: 4 }}>
                    <Typography variant="h4" component="h1" align="center" gutterBottom>
                        {isSignUp ? t('createAccount') : t('signIn')}
                    </Typography>
                    
                    {error && (
                        <Typography 
                            color="error" 
                            role="alert"
                            sx={{ mt: 2, textAlign: 'center' }}
                        >
                            {error}
                        </Typography>
                    )}

                    <form onSubmit={handleEmailSignIn}>
                        <Stack spacing={2}>
                            {isSignUp && (
                                <TextField
                                    label={t('name')}
                                    fullWidth
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            )}
                            <TextField
                                label={t('email')}
                                type="email"
                                fullWidth
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <TextField
                                label={t('password')}
                                type="password"
                                fullWidth
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            {isSignUp && (
                                <TextField
                                    label={t('confirmPassword')}
                                    type="password"
                                    fullWidth
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

                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                        <Link
                            component="button"
                            variant="body2"
                            onClick={toggleMode}
                            sx={{ cursor: 'pointer' }}
                        >
                            {isSignUp ? t('haveAccount') : t('noAccount')}
                        </Link>
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
        </Container>
    );
}