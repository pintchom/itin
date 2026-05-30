import type {
  EmailPasswordSignInInput,
  EmailPasswordSignUpInput,
  PhoneSendOtpInput,
  PhoneSignInInput,
  PhoneSignUpInput,
} from '@itin/shared/schemas/user';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, api, assertOk } from './api';
import { authClient } from './auth-client';
import { pendingInvite } from './invites';

export type AuthConfig = {
  google: boolean;
  devAuth: boolean;
  emailPassword: boolean;
  phone: boolean;
};

export type SessionUser = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  profileImageKey: string | null;
  phoneNumber: string | null;
  phoneNumberVerified: boolean;
};

const sessionKey = ['session'] as const;
const authConfigKey = ['auth', 'config'] as const;

/** Path on the web app after sign-in (invite flow, `next`, or default). */
export function resolvePostLoginPath(next?: string): string {
  const pending = pendingInvite.read();
  if (pending) return `/join/${pending}`;
  return next ?? '/parties';
}

export function resolvePostLoginUrl(next?: string): string {
  return `${window.location.origin}${resolvePostLoginPath(next)}`;
}

const apiOrigin = import.meta.env.VITE_API_ORIGIN ?? '';

export function useAuthConfig() {
  return useQuery({
    queryKey: authConfigKey,
    queryFn: async () => {
      const res = await fetch(`${apiOrigin}/api/auth/config`, {
        credentials: 'include',
      });
      return assertOk<AuthConfig>(res);
    },
    staleTime: 60_000,
  });
}

export async function signInWithGoogle(next?: string) {
  const callbackURL = resolvePostLoginUrl(next);
  const errorCallbackURL = `${window.location.origin}/signin?error=oauth`;
  await authClient.signIn.social({
    provider: 'google',
    callbackURL,
    errorCallbackURL,
  });
}

export function useSession() {
  return useQuery({
    queryKey: sessionKey,
    queryFn: async () => {
      const res = await api.api.me.$get();
      const data = await assertOk<{ user: SessionUser | null }>(res);
      return data.user;
    },
    staleTime: 60_000,
    retry: (_count, err) => !(err instanceof ApiError && err.status === 401),
  });
}

export function useDevLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { firstName: string; lastName: string }) => {
      const res = await api.api['dev-login'].$post({ json: input });
      await assertOk<{ ok: true }>(res);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: sessionKey }),
  });
}

export function useEmailSignUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: EmailPasswordSignUpInput) => {
      const res = await api.api.email['sign-up'].$post({ json: input });
      await assertOk<{ ok: true }>(res);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: sessionKey }),
  });
}

export function useEmailSignIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: EmailPasswordSignInInput) => {
      const res = await api.api.email['sign-in'].$post({ json: input });
      await assertOk<{ ok: true }>(res);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: sessionKey }),
  });
}

export function usePhoneSendOtp() {
  return useMutation({
    mutationFn: async (input: PhoneSendOtpInput) => {
      const res = await api.api.phone['send-otp'].$post({ json: input });
      await assertOk<{ ok: true }>(res);
    },
  });
}

export function usePhoneSignUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: PhoneSignUpInput) => {
      const res = await api.api.phone['sign-up'].$post({ json: input });
      await assertOk<{ ok: true }>(res);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: sessionKey }),
  });
}

export function usePhoneSignIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: PhoneSignInInput) => {
      const res = await api.api.phone['sign-in'].$post({ json: input });
      await assertOk<{ ok: true }>(res);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: sessionKey }),
  });
}

export function useSignOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await authClient.signOut();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: sessionKey }),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      firstName: string;
      lastName: string;
      profileImageKey?: string | null;
    }) => {
      const res = await api.api.me.$patch({ json: input });
      const data = await assertOk<{ user: SessionUser }>(res);
      return data.user;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: sessionKey }),
  });
}
