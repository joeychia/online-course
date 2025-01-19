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
    Alert,
    Stack,
    Link
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { useAuth } from '../contexts/useAuth';
import { firestoreService } from '../services/firestoreService';

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

    const validateForm = () => {
        if (!email || !password) {
            setError('Please fill in all required fields.');
            return false;
        }
        if (isSignUp) {
            if (password !== confirmPassword) {
                setError('Passwords do not match.');
                return false;
            }
            if (password.length < 6) {
                setError('Password must be at least 6 characters long.');
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
                    notes: {}
                });
            } else {
                await signIn(email, password);
            }
            navigate('/');
        } catch (err) {
            console.error(err);
            setError(isSignUp ? 'Failed to create account.' : 'Failed to sign in.');
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
                    notes: {}
                });
            }
            navigate('/');
        } catch (err) {
            setError('Failed to sign in with Google.');
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
                        {isSignUp ? 'Create Account' : 'Sign In'}
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
                                    label="Name"
                                    fullWidth
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            )}
                            <TextField
                                label="Email"
                                type="email"
                                fullWidth
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <TextField
                                label="Password"
                                type="password"
                                fullWidth
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            {isSignUp && (
                                <TextField
                                    label="Confirm Password"
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
                                {isSignUp ? 'Sign Up' : 'Sign In'}
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
                            {isSignUp 
                                ? 'Already have an account? Sign in' 
                                : "Don't have an account? Sign up"}
                        </Link>
                    </Box>

                    <Divider sx={{ my: 3 }}>OR</Divider>

                    <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<GoogleIcon />}
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                    >
                        Continue with Google
                    </Button>
                </Paper>
            </Box>
        </Container>
    );
} 