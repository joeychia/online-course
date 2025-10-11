import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Container,
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    Stack,
    Snackbar,
    Alert,
    CircularProgress,
} from '@mui/material';
import { authService } from '../services/authService';
import { useTranslation } from '../hooks/useTranslation';

export default function PasswordReset() {
    const [searchParams] = useSearchParams();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(true);
    const [email, setEmail] = useState('');
    const [oobCode, setOobCode] = useState('');
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success' as 'success' | 'error'
    });
    const navigate = useNavigate();
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

    const [hasVerified, setHasVerified] = useState(false);

    useEffect(() => {
        let isMounted = true; // Track if component is still mounted
        
        const mode = searchParams.get('mode');
        const code = searchParams.get('oobCode');

        if (mode !== 'resetPassword' || !code) {
            navigate('/login');
            return;
        }

        // Only verify once
        if (hasVerified) {
            return;
        }

        setOobCode(code);

        // Verify the reset code
        const verifyCode = async () => {
            try {
                const userEmail = await authService.verifyPasswordResetCode(code);
                if (isMounted) {
                    setEmail(userEmail);
                    setVerifying(false);
                    setHasVerified(true);
                }
            } catch (error) {
                console.error('Error verifying password reset code:', error);
                if (isMounted) {
                    setVerifying(false);
                    setHasVerified(true);
                    showMessage(t('invalidResetLink') || 'Invalid or expired password reset link. Please request a new password reset email.');
                }
            }
        };

        verifyCode();
        
        // Cleanup function to prevent state updates on unmounted component
        return () => {
            isMounted = false;
        };
    }, [searchParams, navigate, t, hasVerified]);

    // Track timeout for cleanup
    const [redirectTimeout, setRedirectTimeout] = useState<NodeJS.Timeout | null>(null);

    // Cleanup timeout on component unmount
    useEffect(() => {
        return () => {
            if (redirectTimeout) {
                clearTimeout(redirectTimeout);
            }
        };
    }, [redirectTimeout]);

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newPassword || !confirmPassword) {
            showMessage(t('fillRequiredFields') || 'Please fill in all required fields');
            return;
        }

        if (newPassword !== confirmPassword) {
            showMessage(t('passwordsNotMatch') || 'Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            showMessage(t('passwordTooShort') || 'Password must be at least 6 characters long');
            return;
        }

        try {
            setLoading(true);
            console.log('Starting password reset with oobCode:', oobCode);
            
            // Ensure we have a valid oobCode
            if (!oobCode) {
                throw new Error('No password reset code available');
            }
            
            await authService.confirmPasswordReset(oobCode, newPassword);
            console.log('Password reset successful, showing success message');
            
            // Clear the loading state first
            setLoading(false);
            
            // Show success message
            showMessage(t('passwordResetSuccess') || 'Password has been reset successfully!', 'success');
            
            // Don't redirect immediately, let user see the success message
            const timeoutId = setTimeout(() => {
                console.log('Redirecting to login after success');
                navigate('/login');
            }, 3000);
            
            // Store timeout for cleanup
            setRedirectTimeout(timeoutId);
        } catch (error) {
            console.error('Error resetting password:', error);
            setLoading(false);
            
            const errorMessage = error instanceof Error ? error.message : String(error);
            
            // Check for specific Firebase error codes
            if (errorMessage.includes('auth/invalid-action-code') || errorMessage.includes('auth/expired-action-code')) {
                showMessage(t('invalidResetLink') || 'Invalid or expired password reset link. Please request a new password reset email.');
            } else if (errorMessage.includes('auth/weak-password')) {
                showMessage(t('passwordTooWeak') || 'Password is too weak. Please choose a stronger password.');
            } else if (errorMessage.includes('No password reset code available')) {
                showMessage(t('noResetCode') || 'No password reset code available. Please try again.');
            } else {
                showMessage(t('failedToResetPassword') || `Failed to reset password: ${errorMessage}`);
            }
        }
    };

    if (verifying) {
        return (
            <Container maxWidth="sm">
                <Box sx={{ mt: 8, mb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                    <CircularProgress />
                    <Typography variant="body1" sx={{ mt: 2 }}>
                        {t('verifyingResetLink') || 'Verifying password reset link...'}
                    </Typography>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 8, mb: 4 }}>
                <Paper elevation={3} sx={{ p: 4 }}>
                    <Typography variant="h4" component="h1" align="center" gutterBottom>
                        {t('resetPassword') || 'Reset Password'}
                    </Typography>
                    
                    {email ? (
                        <>
                            <Typography variant="body1" align="center" sx={{ mb: 3, color: 'text.secondary' }}>
                                {t('resetPasswordFor') || 'Reset password for'}: {email}
                            </Typography>

                            <form onSubmit={handlePasswordReset}>
                                <Stack spacing={2}>
                                    <TextField
                                        label={t('newPassword') || 'New Password'}
                                        type="password"
                                        fullWidth
                                        variant="filled"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                    />
                                    <TextField
                                        label={t('confirmNewPassword') || 'Confirm New Password'}
                                        type="password"
                                        fullWidth
                                        variant="filled"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        color="primary"
                                        fullWidth
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <CircularProgress size={24} />
                                        ) : (
                                            t('resetPassword') || 'Reset Password'
                                        )}
                                    </Button>
                                </Stack>
                            </form>
                        </>
                    ) : (
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="body1" sx={{ mb: 3, color: 'error.main' }}>
                                {t('invalidResetLink') || 'Invalid or expired password reset link. Please request a new password reset email.'}
                            </Typography>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => navigate('/login')}
                            >
                                {t('backToLogin') || 'Back to Login'}
                            </Button>
                        </Box>
                    )}
                </Paper>
            </Box>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={snackbar.severity === 'success' ? 8000 : 6000}
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