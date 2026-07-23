import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      navigate('/');
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-gutter font-body-md text-on-surface antialiased selection:bg-primary-container selection:text-on-primary-container relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full bg-primary/5 blur-3xl mix-blend-multiply"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[30vw] h-[30vw] rounded-full bg-secondary/5 blur-3xl mix-blend-multiply"></div>
      </div>

      {/* Login Card */}
      <main className="w-full max-w-[440px] z-10 relative">
        <div className="bg-surface-container-lowest rounded-xl shadow-[0_4px_20px_rgba(0,43,69,0.08)] p-stack-lg md:p-[40px] flex flex-col gap-stack-lg border border-outline-variant/30">
          
          {/* Header */}
          <header className="flex flex-col items-center gap-stack-md text-center">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary text-3xl">verified</span>
              <div className="font-headline-md text-headline-md font-bold text-primary">Devoteam</div>
            </div>  <p className="font-body-md text-body-md text-on-surface-variant">Sign in to Devoteam Enterprise Portal</p>
          </header>

          {/* Form */}
          <form onSubmit={handleLogin} className="flex flex-col gap-stack-md">
            
            {/* Email Input */}
            <div className="flex flex-col gap-stack-sm">
              <label className="font-label-md text-label-md text-on-surface" htmlFor="email">Email address</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">mail</span>
                <input 
                  className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200" 
                  id="email" 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@devoteam.com" 
                  required 
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-stack-sm">
              <div className="flex items-center justify-between">
                <label className="font-label-md text-label-md text-on-surface" htmlFor="password">Password</label>
                <a className="font-label-md text-label-md text-primary hover:text-on-primary-fixed-variant transition-colors" href="#">Forgot password?</a>
              </div>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">lock</span>
                <input 
                  className="w-full pl-12 pr-12 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200" 
                  id="password" 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  required 
                />
                <button 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors focus:outline-none" 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              </div>
            </div>

            {error && (
              <p className="text-error text-sm mt-1">{error}</p>
            )}

            {/* Submit Button */}
            <button 
              className="mt-stack-sm w-full bg-primary text-on-primary font-label-md text-label-md py-[14px] rounded-xl flex items-center justify-center gap-2 transition-all duration-300 hover:bg-on-primary-fixed-variant hover:-translate-y-[2px] active:translate-y-[0px] shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed" 
              type="submit"
              disabled={loading}
            >
              <span>{loading ? 'Logging in...' : 'Login'}</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </form>

          {/* Footer / Support */}
          <div className="pt-stack-md border-t border-outline-variant/30 text-center">
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Need help? <a className="font-label-md text-label-md text-primary hover:underline underline-offset-4" href="#">Contact IT Support</a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
