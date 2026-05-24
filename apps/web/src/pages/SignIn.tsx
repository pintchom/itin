import { useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Field, Input } from '../components/ui/Input';
import {
  resolvePostLoginPath,
  signInWithGoogle,
  useAuthConfig,
  useDevLogin,
  useEmailSignIn,
  useEmailSignUp,
  usePhoneSendOtp,
  usePhoneSignIn,
  usePhoneSignUp,
  useSession,
} from '../lib/auth';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden role="img">
      <title>Google</title>
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

type Method = 'email' | 'phone';
type Mode = 'signin' | 'signup';

export function SignIn() {
  const navigate = useNavigate();
  const { next, error } = useSearch({ from: '/signin' });
  const session = useSession();
  const authConfig = useAuthConfig();

  const [method, setMethod] = useState<Method>('email');
  const [mode, setMode] = useState<Mode>('signin');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const emailSignUp = useEmailSignUp();
  const emailSignIn = useEmailSignIn();
  const phoneSendOtp = usePhoneSendOtp();
  const phoneSignUp = usePhoneSignUp();
  const phoneSignIn = usePhoneSignIn();
  const devLogin = useDevLogin();

  const googleEnabled = authConfig.data?.google ?? false;
  const devAuthEnabled = authConfig.data?.devAuth ?? false;
  const isSignUp = mode === 'signup';

  const pending =
    emailSignUp.isPending ||
    emailSignIn.isPending ||
    phoneSendOtp.isPending ||
    phoneSignUp.isPending ||
    phoneSignIn.isPending ||
    devLogin.isPending;

  const authError = (emailSignUp.error ??
    emailSignIn.error ??
    phoneSendOtp.error ??
    phoneSignUp.error ??
    phoneSignIn.error ??
    devLogin.error) as Error | null;

  useEffect(() => {
    if (!session.data) return;
    navigate({ to: resolvePostLoginPath(next), replace: true });
  }, [session.data, next, navigate]);

  const afterAuth = () => navigate({ to: resolvePostLoginPath(next), replace: true });

  const onGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle(next);
    } catch (err) {
      setGoogleLoading(false);
      throw err;
    }
  };

  const onEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp) {
      await emailSignUp.mutateAsync({
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
    } else {
      await emailSignIn.mutateAsync({ email: email.trim(), password });
    }
    afterAuth();
  };

  const onSendOtp = async () => {
    await phoneSendOtp.mutateAsync({ phoneNumber: phone.trim() });
    setOtpSent(true);
  };

  const onPhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp) {
      if (!otpSent) {
        await onSendOtp();
        return;
      }
      await phoneSignUp.mutateAsync({
        phoneNumber: phone.trim(),
        code: otp.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
    } else {
      await phoneSignIn.mutateAsync({ phoneNumber: phone.trim(), password });
    }
    afterAuth();
  };

  const onDevSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await devLogin.mutateAsync({ firstName, lastName });
    afterAuth();
  };

  const showAltMethods = googleEnabled || devAuthEnabled;

  return (
    <div className="flex-1 flex flex-col px-6 pt-safe pb-safe">
      <div className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto">
        <h1 className="text-3xl font-semibold tracking-tight">Welcome to itin</h1>
        <p className="mt-2 text-fg-muted">
          One place for your trip's calendar. Sign in to join your party.
        </p>

        {error === 'oauth' && (
          <p className="mt-4 text-sm text-danger">
            Google sign-in failed or was cancelled. Try again.
          </p>
        )}

        {authError && <p className="mt-4 text-sm text-danger">{authError.message}</p>}

        <div className="mt-6 flex rounded-xl border border-border p-1 bg-bg-elev">
          <button
            type="button"
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${mode === 'signin' ? 'bg-bg text-fg shadow-sm' : 'text-fg-muted'}`}
            onClick={() => setMode('signin')}
          >
            Sign in
          </button>
          <button
            type="button"
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${mode === 'signup' ? 'bg-bg text-fg shadow-sm' : 'text-fg-muted'}`}
            onClick={() => setMode('signup')}
          >
            Create account
          </button>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            className={`flex-1 rounded-xl border py-2 text-sm ${method === 'email' ? 'border-accent text-fg' : 'border-border text-fg-muted'}`}
            onClick={() => setMethod('email')}
          >
            Email
          </button>
          <button
            type="button"
            className={`flex-1 rounded-xl border py-2 text-sm ${method === 'phone' ? 'border-accent text-fg' : 'border-border text-fg-muted'}`}
            onClick={() => setMethod('phone')}
          >
            Phone
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {googleEnabled && (
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              disabled={googleLoading || pending}
              onClick={() => void onGoogleSignIn()}
            >
              <GoogleIcon />
              {googleLoading ? 'Redirecting…' : 'Continue with Google'}
            </Button>
          )}

          {googleEnabled && (
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-fg-muted uppercase tracking-wide">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>
          )}

          {method === 'email' ? (
            <form onSubmit={onEmailSubmit} className="space-y-4">
              {isSignUp && (
                <>
                  <Field label="First name">
                    <Input
                      autoComplete="given-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </Field>
                  <Field label="Last name">
                    <Input
                      autoComplete="family-name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </Field>
                </>
              )}
              <Field label="Email">
                <Input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field label="Password" hint={isSignUp ? 'At least 8 characters' : undefined}>
                <Input
                  type="password"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
              <Button
                type="submit"
                className="w-full"
                disabled={
                  pending ||
                  !email.trim() ||
                  password.length < (isSignUp ? 8 : 1) ||
                  (isSignUp && (!firstName.trim() || !lastName.trim()))
                }
              >
                {pending ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
              </Button>
            </form>
          ) : (
            <form onSubmit={onPhoneSubmit} className="space-y-4">
              {isSignUp && (
                <>
                  <Field label="First name">
                    <Input
                      autoComplete="given-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </Field>
                  <Field label="Last name">
                    <Input
                      autoComplete="family-name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </Field>
                </>
              )}
              <Field label="Phone number" hint="Include country code, e.g. +1 555 123 4567">
                <Input
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setOtpSent(false);
                  }}
                />
              </Field>
              {isSignUp && (
                <Field
                  label="Verification code"
                  hint={
                    otpSent ? 'Check the API terminal for the code in dev' : 'Send a code first'
                  }
                >
                  <Input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    disabled={!otpSent}
                  />
                </Field>
              )}
              <Field label="Password" hint={isSignUp ? 'At least 8 characters' : undefined}>
                <Input
                  type="password"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
              {isSignUp && !otpSent && (
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  disabled={pending || !phone.trim()}
                  onClick={() => void onSendOtp()}
                >
                  {phoneSendOtp.isPending ? 'Sending…' : 'Send verification code'}
                </Button>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={
                  pending ||
                  !phone.trim() ||
                  password.length < (isSignUp ? 8 : 1) ||
                  (isSignUp && (!firstName.trim() || !lastName.trim() || (otpSent && !otp.trim())))
                }
              >
                {pending
                  ? 'Please wait…'
                  : isSignUp
                    ? otpSent
                      ? 'Create account'
                      : 'Send code & continue'
                    : 'Sign in'}
              </Button>
            </form>
          )}

          {devAuthEnabled && showAltMethods && (
            <details className="rounded-xl border border-border px-4 py-3 text-sm">
              <summary className="cursor-pointer text-fg-muted font-medium">
                Developer sign-in (local only)
              </summary>
              <form onSubmit={onDevSubmit} className="mt-4 space-y-3">
                <Field label="First name">
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </Field>
                <Field label="Last name">
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </Field>
                <Button type="submit" variant="ghost" className="w-full" disabled={pending}>
                  Continue with name (dev)
                </Button>
              </form>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
