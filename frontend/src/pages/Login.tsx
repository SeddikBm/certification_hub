import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const loginSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: LoginFormValues) => authService.login(data),
    onSuccess: (data) => {
      login(data.accessToken, data.refreshToken, data.user);
      if (data.user?.role === 'COLLABORATOR' || data.user?.role === 'USER') {
        navigate('/my-assignments');
      } else {
        navigate('/dashboard');
      }
    },
    onError: (error: any) => {
      setErrorMsg(error.response?.data?.message || 'Login failed. Please check your credentials.');
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    setErrorMsg('');
    mutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[150px]"></div>
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-error-container/30 blur-[100px]"></div>
      </div>

      <div className="w-full max-w-[450px] z-10">
        <div className="bg-surface-container-lowest rounded-2xl shadow-lg border border-outline-variant/10 p-10 flex flex-col items-center">
          <img alt="Devoteam Logo" className="h-12 md:h-14 object-contain mb-8" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD8P959-H660oXsHEsr0hj50FyfxDsXWtX_57a3dnlLZzAtO8cCW-Lpv2te7_LgnPGnd5xHrS5z7T6KX4mNzTf0zIis2f1dKiqgg9c95wI5CuI6yc8hvA9aCJSYr1Hy-haGkSdGayGDoiSawl0-HS_ou0ZG8Kq7v_4CO6WU4u6nl1hly16CuedfGdxvtEbpQcRRzY2VSxVqtyrX7AAO28EUKLisDgkEtqDcZo0xrPNMMNMkHCkTJwrci4cfwM8XkKXWsAQ" />
          <h1 className="text-[28px] font-bold text-on-surface mb-2 font-headline-lg">Welcome back</h1>
          <p className="text-on-surface-variant font-body-md mb-8">Sign in to Devoteam Enterprise Portal</p>

          <form className="w-full space-y-6" onSubmit={handleSubmit(onSubmit)}>
            
            {errorMsg && (
              <div className="p-3 rounded-lg bg-error-container text-on-error-container text-sm font-medium">
                {errorMsg}
              </div>
            )}

            <div className="space-y-1">
              <label className="font-label-md text-label-md text-on-surface block font-medium" htmlFor="email">Email address</label>
              <Input 
                id="email" 
                type="email" 
                leftIcon="mail" 
                placeholder="name@devoteam.com" 
                {...register('email')}
                error={!!errors.email}
              />
              {errors.email && <p className="text-error text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="font-label-md text-label-md text-on-surface block font-medium" htmlFor="password">Password</label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? 'text' : 'password'}
                  leftIcon="lock" 
                  placeholder="••••••••" 
                  {...register('password')}
                  error={!!errors.password}
                />
                <button 
                  type="button"
                  className="absolute right-4 top-0 bottom-0 flex items-center justify-center text-on-surface-variant hover:text-on-surface"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined text-[20px] leading-none">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
              {errors.password && <p className="text-error text-xs mt-1">{errors.password.message}</p>}
            </div>

            <Button 
              className="w-full text-[16px] h-12 mt-8 flex justify-center items-center gap-2" 
              type="submit"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Logging in...' : 'Login'} 
              {!mutation.isPending && <span className="material-symbols-outlined text-[20px]">arrow_forward</span>}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
