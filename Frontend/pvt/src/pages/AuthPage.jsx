import { useState } from 'react';
import { loginUser, signupUser } from '../lib/api';

const initialLogin = {
  username: '',
  password: '',
  rememberMe: false,
};

const initialSignup = {
  fullName: '',
  username: '',
  password: '',
  confirmPassword: '',
  role: 'OPERATOR',
  agreeToTerms: false,
};

export default function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [loginForm, setLoginForm] = useState(initialLogin);
  const [signupForm, setSignupForm] = useState(initialSignup);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const session = await loginUser({
        username: loginForm.username,
        password: loginForm.password,
      });
      onAuthenticated(session);
    } catch (authError) {
      setError(authError.message || 'Unable to login');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (event) => {
    event.preventDefault();
    setError('');

    if (signupForm.password !== signupForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const session = await signupUser({
        username: signupForm.username,
        password: signupForm.password,
        role: signupForm.role,
      });
      onAuthenticated(session);
    } catch (authError) {
      setError(authError.message || 'Unable to signup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {mode === 'login' ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-10">
            <h1 className="text-3xl font-bold text-slate-900">Sign in to Architect</h1>
            <p className="mt-2 text-slate-600">Welcome back. Please enter your details.</p>

            {error && (
              <div className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700 border border-red-200">
                {error}
              </div>
            )}

            <form className="mt-8 space-y-5" onSubmit={handleLogin}>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">EMAIL ADDRESS</label>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm((prev) => ({ ...prev, username: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg bg-slate-100 border-none text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-slate-700">PASSWORD</label>
                  <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                    Forgot password?
                  </a>
                </div>
                <input
                  type="password"
                  placeholder="•••••••••"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg bg-slate-100 border-none text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <label className="flex items-center gap-3 mt-6">
                <input
                  type="checkbox"
                  checked={loginForm.rememberMe}
                  onChange={(e) => setLoginForm((prev) => ({ ...prev, rememberMe: e.target.checked }))}
                  className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-sm text-slate-700">Remember me for 30 days</span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-8 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 rounded-full transition-colors duration-200 flex items-center justify-center gap-2"
              >
                {loading ? 'Signing in...' : 'Sign in'}
                {!loading && <span>→</span>}
              </button>
            </form>

            <div className="mt-6 text-center">
              <span className="text-slate-600">Don't have an account? </span>
              <button
                onClick={() => {
                  setMode('signup');
                  setError('');
                }}
                className="font-semibold text-blue-600 hover:text-blue-700"
              >
                Sign up
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-10">
            <h1 className="text-3xl font-bold text-slate-900">Create your account</h1>
            <p className="mt-2 text-slate-600">Join us to get started</p>

            {error && (
              <div className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700 border border-red-200">
                {error}
              </div>
            )}

            <form className="mt-8 space-y-5" onSubmit={handleSignup}>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">FULL NAME</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-slate-400">👤</span>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={signupForm.fullName}
                    onChange={(e) => setSignupForm((prev) => ({ ...prev, fullName: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-slate-100 border-none text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">BUSINESS EMAIL</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-slate-400">✉️</span>
                  <input
                    type="email"
                    placeholder="john@company.com"
                    value={signupForm.username}
                    onChange={(e) => setSignupForm((prev) => ({ ...prev, username: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-slate-100 border-none text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">PASSWORD</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-slate-400">🔒</span>
                  <input
                    type="password"
                    placeholder="•••••••••"
                    value={signupForm.password}
                    onChange={(e) => setSignupForm((prev) => ({ ...prev, password: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-slate-100 border-none text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    minLength={8}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">Must be at least 8 characters with a symbol.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">CONFIRM PASSWORD</label>
                <input
                  type="password"
                  placeholder="•••••••••"
                  value={signupForm.confirmPassword}
                  onChange={(e) => setSignupForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg bg-slate-100 border-none text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  minLength={8}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">ROLE</label>
                <select
                  value={signupForm.role}
                  onChange={(e) => setSignupForm((prev) => ({ ...prev, role: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg bg-slate-100 border-none text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="OPERATOR">Operator</option>
                  <option value="ACCOUNTANT">Accountant</option>
                </select>
              </div>

              <label className="flex items-start gap-3 mt-6">
                <input
                  type="checkbox"
                  checked={signupForm.agreeToTerms}
                  onChange={(e) => setSignupForm((prev) => ({ ...prev, agreeToTerms: e.target.checked }))}
                  className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer mt-0.5"
                />
                <span className="text-sm text-slate-700">
                  I agree to the{' '}
                  <a href="#" className="font-semibold text-blue-600 hover:text-blue-700">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="font-semibold text-blue-600 hover:text-blue-700">
                    Privacy Policy
                  </a>
                  .
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-8 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 rounded-full transition-colors duration-200"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <span className="text-slate-600">Already have an account? </span>
              <button
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className="font-semibold text-blue-600 hover:text-blue-700"
              >
                Sign in
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
