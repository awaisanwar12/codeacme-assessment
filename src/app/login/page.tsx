// src/app/login/page.tsx
// Login page for agency team members
'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.error === 'INVALID_CREDENTIALS') {
          setError('Invalid email or password. Please try again.');
        } else if (result.error === 'VALIDATION_ERROR') {
          setError('Please enter a valid email and password.');
        } else {
          setError(result.message || 'Login failed. Please try again.');
        }
        return;
      }

      setIsSuccess(true);
      // Store user session
      if (result.data?.user) {
        sessionStorage.setItem('user', JSON.stringify(result.data.user));
      }
      // Redirect to dashboard after brief delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 500);
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-gray-900 inline-block">
            Agency Pipeline
          </Link>
          <p className="text-gray-500 mt-2">Team Dashboard Login</p>
        </div>

        {/* Login Card */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-6">Sign In</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {isSuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              Login successful! Redirecting to dashboard...
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="email" className="label">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                className="input"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={isSuccess}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="label">
                Password
              </label>
              <input
                type="password"
                id="password"
                className="input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="current-password"
                disabled={isSuccess}
              />
            </div>

            <button
              type="submit"
              className="btn btn--primary w-full"
              disabled={isLoading || isSuccess}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        {/* Back to Home link */}
        <p className="text-center mt-6 text-sm text-gray-500">
          Not a team member?{' '}
          <Link href="/" className="text-blue-600 hover:text-blue-700 hover:underline">
            Submit a project brief instead
          </Link>
        </p>
      </div>
    </div>
  );
}