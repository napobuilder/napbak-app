import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Toaster, toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';

export const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginView, setIsLoginView] = useState(true);
  const { session, loading: authLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = isLoginView
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ 
            email, 
            password, 
            options: {
              emailRedirectTo: window.location.origin,
            }
          });

      if (error) throw error;

      if (!isLoginView) {
        toast.success('Account created! Check your email to confirm your account.');
      }
      // For login, the onAuthStateChange listener will handle the UI update.

    } catch (error: any) {
      toast.error(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleView = () => {
    setIsLoginView(!isLoginView);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#121212] flex justify-center items-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  if (session) {
    return <Navigate to="/studio" replace />;
  }

  return (
    <div className="min-h-screen bg-[#121212] flex justify-center items-center">
      <div className="w-full max-w-md p-8 space-y-8 bg-[#181818] rounded-lg shadow-lg">
        <Toaster richColors position="top-center" />
        <div className="text-center">
          <img src="/napbak app.png" alt="Napbak Logo" className="h-16 w-auto mx-auto mb-6" />
          <h2 className="text-3xl font-extrabold text-white">
            {isLoginView ? 'Sign in to your account' : 'Create a new account'}
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            To save and load your projects
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">Email</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-t-md relative block w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isLoginView ? "current-password" : "new-password"}
                required
                className="appearance-none rounded-b-md relative block w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Processing...' : (isLoginView ? 'Sign In' : 'Sign Up')}
            </button>
          </div>
        </form>
        <div className="text-center text-sm text-gray-400">
          {isLoginView ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button onClick={toggleView} className="font-medium text-green-500 hover:text-green-400">
            {isLoginView ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};
