import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/lib/supabaseClient';
import { appParams } from '@/lib/app-params';
import { createAxiosClient } from '@base44/sdk/dist/utils/axios-client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);
    const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
    const [authError, setAuthError] = useState(null);
    const [appPublicSettings, setAppPublicSettings] = useState(null); // Contains only { id, public_settings }
    const hasSupabase = Boolean(supabase);

    useEffect(() => {
        // If Supabase is configured, use Supabase auth; otherwise fall back to existing Base44 logic
        if (supabase) {
            // Initialize session from Supabase and listen for auth state changes.
            const init = async () => {
                try {
                    setIsLoadingAuth(true);
                    const { data } = await supabase.auth.getSession();
                    const session = data?.session ?? null;
                    if (session?.user) {
                        setUser(session.user);
                        setIsAuthenticated(true);
                    } else {
                        setUser(null);
                        setIsAuthenticated(false);
                    }
                } catch (e) {
                    console.error('Supabase session init failed', e);
                } finally {
                    setIsLoadingAuth(false);
                }
            };
            init();

            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                if (session?.user) {
                    setUser(session.user);
                    setIsAuthenticated(true);
                } else {
                    setUser(null);
                    setIsAuthenticated(false);
                }
            });

            return () => subscription?.unsubscribe && subscription.unsubscribe();
        }

        // If no Base44 app ID is configured (or it's the string 'null'), skip Base44 app checks
        // This lets the app run locally without a Base44 backend.
        if (!appParams.appId || appParams.appId === 'null') {
            setIsLoadingPublicSettings(false);
            setIsLoadingAuth(false);
            return;
        }

        checkAppState();
    }, []);

    const checkAppState = async () => {
        try {
            setIsLoadingPublicSettings(true);
            setAuthError(null);

            // First, check app public settings (with token if available)
            // This will tell us if auth is required, user not registered, etc.
            const appClient = createAxiosClient({
                baseURL: `/api/apps/public`,
                headers: {
                    'X-App-Id': appParams.appId
                },
                token: appParams.token, // Include token if available
                interceptResponses: true
            });

            try {
                const publicSettings = await appClient.get(`/prod/public-settings/by-id/${appParams.appId}`);
                setAppPublicSettings(publicSettings);

                // If we got the app public settings successfully, check if user is authenticated
                if (appParams.token) {
                    await checkUserAuth();
                } else {
                    setIsLoadingAuth(false);
                    setIsAuthenticated(false);
                }
                setIsLoadingPublicSettings(false);
            } catch (appError) {
                console.error('App state check failed:', appError);

                // Handle app-level errors
                if (appError.status === 403 && appError.data?.extra_data?.reason) {
                    const reason = appError.data.extra_data.reason;
                    if (reason === 'auth_required') {
                        setAuthError({
                            type: 'auth_required',
                            message: 'Authentication required'
                        });
                    } else if (reason === 'user_not_registered') {
                        setAuthError({
                            type: 'user_not_registered',
                            message: 'User not registered for this app'
                        });
                    } else {
                        setAuthError({
                            type: reason,
                            message: appError.message
                        });
                    }
                } else {
                    setAuthError({
                        type: 'unknown',
                        message: appError.message || 'Failed to load app'
                    });
                }
                setIsLoadingPublicSettings(false);
                setIsLoadingAuth(false);
            }
        } catch (error) {
            console.error('Unexpected error:', error);
            setAuthError({
                type: 'unknown',
                message: error.message || 'An unexpected error occurred'
            });
            setIsLoadingPublicSettings(false);
            setIsLoadingAuth(false);
        }
    };

    const checkUserAuth = async () => {
        try {
            // Now check if the user is authenticated
            setIsLoadingAuth(true);
            const currentUser = await base44.auth.me();
            setUser(currentUser);
            setIsAuthenticated(true);
            setIsLoadingAuth(false);
        } catch (error) {
            console.error('User auth check failed:', error);
            setIsLoadingAuth(false);
            setIsAuthenticated(false);

            // If user auth fails, it might be an expired token
            if (error.status === 401 || error.status === 403) {
                setAuthError({
                    type: 'auth_required',
                    message: 'Authentication required'
                });
            }
        }
    };

    const logout = (shouldRedirect = true) => {
        if (supabase) {
            supabase.auth.signOut();
            setUser(null);
            setIsAuthenticated(false);
            return;
        }

        setUser(null);
        setIsAuthenticated(false);

        if (shouldRedirect) {
            // Use the SDK's logout method which handles token cleanup and redirect
            base44.auth.logout(window.location.href);
        } else {
            // Just remove the token without redirect
            base44.auth.logout();
        }
    };

    const navigateToLogin = () => {
        if (supabase) {
            // No-op — UI should use signIn methods from context
            return;
        }
        // Use the SDK's redirectToLogin method
        base44.auth.redirectToLogin(window.location.href);
    };

    // Supabase auth helpers
    const signUpWithEmail = async (email, password) => {
        if (!supabase) return { error: new Error('Supabase not configured — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in a local .env and restart the dev server') };
        try {
            const res = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + '/verify-email' } });
            return res;
        } catch (e) {
            return { error: e };
        }
    };

    const signInWithEmail = async (email, password) => {
        if (!supabase) return { error: new Error('Supabase not configured — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in a local .env and restart the dev server') };
        try {
            const res = await supabase.auth.signInWithPassword({ email, password });
            return res;
        } catch (e) {
            return { error: e };
        }
    };

    const signInWithMagicLink = async (email) => {
        // Magic links disabled in this build; respond gracefully
        return { error: new Error('Magic link sign-in is disabled') };
    };

    const signInWithOAuth = async (provider) => {
        if (!supabase) return { error: new Error('Supabase not configured — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in a local .env and restart the dev server') };
        try {
            const res = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin } });
            return res;
        } catch (e) {
            return { error: e };
        }
    };

    const resendVerification = async (email) => {
        // Supabase handles resend via signUp flow with redirect; provide helper to trigger magic link for verification
        return signInWithMagicLink(email);
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated,
            isLoadingAuth,
            isLoadingPublicSettings,
            authError,
            appPublicSettings,
            logout,
            navigateToLogin,
            checkAppState,
            // Supabase helpers
            signUpWithEmail,
            signInWithEmail,
            signInWithMagicLink,
            signInWithOAuth,
            resendVerification,
            hasSupabase
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
