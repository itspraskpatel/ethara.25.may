'use client';

import { FormEvent, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, AtSign, Badge, Sparkles } from 'lucide-react';

import { profileFormSchema, type ProfileFormPayload } from '@/features/whiteboard/schema';
import type { WhiteboardProfile } from '@/features/whiteboard/types';

type OnboardingDialogProps = {
  isOpen: boolean;
  isSubmitting: boolean;
  mode: 'create' | 'join';
  profile: WhiteboardProfile | null;
  serverError?: string | null;
  onSubmit: (payload: ProfileFormPayload) => Promise<void> | void;
};

export function OnboardingDialog({
  isOpen,
  isSubmitting,
  mode,
  profile,
  serverError,
  onSubmit,
}: OnboardingDialogProps) {
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [fieldError, setFieldError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldError(null);

    const parsed = profileFormSchema.safeParse({ displayName, email });

    if (!parsed.success) {
      const flattened = parsed.error.flatten();
      setFieldError(flattened.fieldErrors.displayName?.[0] || flattened.fieldErrors.email?.[0] || 'Please check your details.');
      return;
    }

    await onSubmit(parsed.data);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/24 px-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.form
            className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] border border-white/80 bg-white/90 p-6 shadow-[0_30px_120px_rgba(15,23,42,0.28)] backdrop-blur-2xl sm:p-8"
            initial={{ opacity: 0, y: 26, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 26, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            onSubmit={handleSubmit}
          >
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-amber-300/40 blur-2xl" />
            <div className="absolute -bottom-20 -left-12 h-48 w-48 rounded-full bg-emerald-300/30 blur-2xl" />

            <div className="relative">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-slate-950 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-white shadow-lg">
                <Sparkles size={14} /> Anonymous by default
              </div>

              <h1 className="max-w-md text-4xl font-black leading-tight text-slate-950 sm:text-5xl">
                {mode === 'create' ? 'Start a tiny riot of doodles.' : 'Step into the shared canvas.'}
              </h1>
              <p className="mt-4 text-base font-medium leading-7 text-slate-600">
                Pick a display name so strangers can see a friendly label, not your real identity. Email is optional and only saved if you share it.
              </p>

              <div className="mt-7 space-y-4">
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-sm font-black text-slate-800">
                    <Badge size={16} /> Display name
                  </span>
                  <input
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base font-bold text-slate-950 outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-950/10"
                    placeholder="Mysterious Mango"
                    maxLength={80}
                    autoFocus
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-sm font-black text-slate-800">
                    <AtSign size={16} /> Email <span className="font-bold text-slate-400">optional</span>
                  </span>
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base font-bold text-slate-950 outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-950/10"
                    placeholder="you@example.com"
                    inputMode="email"
                  />
                </label>
              </div>

              {(fieldError || serverError) && (
                <motion.p
                  className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {fieldError || serverError}
                </motion.p>
              )}

              <motion.button
                type="submit"
                className="mt-7 flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-950 px-5 py-4 text-base font-black text-white shadow-[0_16px_50px_rgba(15,23,42,0.22)] transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60"
                whileHover={{ y: -3, scale: 1.015 }}
                whileTap={{ scale: 0.96 }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving your alias...' : mode === 'create' ? 'Create shareable board' : 'Join board'}
                <ArrowRight size={18} />
              </motion.button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
