"use client";

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
export default function LoginPage() {
  
  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem('signupEmail') ?? '';
    } catch {
      return '';
    }
  });
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    if (!trimmedEmail || !trimmedPassword) {
      setError('Please enter your email and password.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const callbackUrl = (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('callbackUrl') : null) || '/dashboard';
      const result = await signIn('credentials', {
        email: trimmedEmail,
        password: trimmedPassword,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        throw new Error('Invalid email or password.');
      }
      localStorage.setItem('signupEmail', trimmedEmail);
      window.location.href = result?.url || callbackUrl;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="mb-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/20">T</div>
        <span className="text-3xl font-headline font-bold tracking-tight">Tasko</span>
      </div>

      <Card className="w-full max-w-md border-none shadow-xl rounded-[2rem] overflow-hidden">
        <CardHeader className="space-y-1 text-center pt-10 pb-6">
          <CardTitle className="text-3xl font-bold font-headline">Welcome back</CardTitle>
          <CardDescription>Enter your credentials to access your workspace</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 px-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="alex@example.com" 
                className="rounded-xl h-12 bg-secondary/30 border focus-visible:ring-primary/20" 
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Button variant="link" className="px-0 h-auto text-xs text-primary font-semibold">Forgot password?</Button>
              </div>
              <Input 
                id="password" 
                type="password" 
                placeholder="**********"
                className="rounded-xl h-12 bg-secondary/30 border focus-visible:ring-primary/20" 
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}
            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-lg font-semibold mt-4 shadow-lg shadow-primary/20"
              disabled={submitting}
            >
              {submitting ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          
          {/* <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-4 text-muted-foreground font-medium">Or continue with</span>
            </div>
          </div> */}

          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="h-12 rounded-xl border-none bg-secondary/30 hover:bg-secondary/50 gap-2 font-semibold">
            </Button>
          </div>
        </CardContent>
        <CardFooter className="pb-10 flex flex-col gap-4">
          <p className="text-sm text-center text-muted-foreground font-medium">
            Don't have an account?{' '}
            <Link href="/signup" className="text-primary hover:underline font-bold">Sign up</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}