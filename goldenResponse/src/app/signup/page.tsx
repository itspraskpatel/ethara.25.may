"use client";

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

export default function SignupPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const name = [trimmedFirst, trimmedLast].filter(Boolean).join(' ');

    if (!name || !trimmedEmail || !trimmedPassword) {
      setError('Please complete all required fields.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email: trimmedEmail,
          password: trimmedPassword,
        }),
      });

      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || 'Signup failed.');
      }
      //save name and email to local storage for pre-filling login form
      localStorage.setItem('signupName', name);
      localStorage.setItem('signupEmail', trimmedEmail);

      const result = await signIn('credentials', {
        email: trimmedEmail,
        password: trimmedPassword,
        redirect: false,
      });

      if (result?.error) {
        throw new Error('Signup succeeded, but login failed. Please sign in.');
      }

      window.location.href = '/dashboard';
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signup failed.';
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

      <Card className="w-full max-w-md border-none shadow-xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="space-y-1 text-center pt-10 pb-6">
          <CardTitle className="text-3xl font-bold font-headline">Join Tasko</CardTitle>
          <CardDescription>Start managing your projects with ease</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-10">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="Alex"
                  className="rounded-xl h-11 bg-secondary/30 border"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Rivers"
                  className="rounded-xl h-11 bg-secondary/30 border"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="alex@example.com"
                className="rounded-xl h-11 bg-secondary/30 border"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="*******"
                className="rounded-xl h-11 bg-secondary/30 border"
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
              {submitting ? 'Creating...' : 'Create Account'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="pb-10">
          <p className="text-sm w-full text-center text-muted-foreground font-medium">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline font-bold">Sign in</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}