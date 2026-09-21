import { supabase } from './supabaseClient';

export type AccountDeletionAvailability =
  | { status: 'available' }
  | { status: 'unavailable'; code: 'ACCOUNT_DELETION_UNAVAILABLE' };

export const ACCOUNT_DELETION_NOTICE = 'Account deletion cannot be started in this version.';

/**
 * Checks whether the backend has genuine account deletion enabled
 * (docs/ACCOUNT_DELETION_READINESS.md's retention-policy gates). Both the
 * DB flag and the Edge Function's env flag default to false, so this
 * reports 'unavailable' honestly until the maintainer explicitly approves
 * the retention policy for real users.
 */
export async function getAccountDeletionAvailability(): Promise<AccountDeletionAvailability> {
  try {
    const { data, error } = await supabase.functions.invoke('delete-account?mode=check', {
      method: 'POST',
    });
    if (error || !data || data.status !== 'available') {
      return { status: 'unavailable', code: 'ACCOUNT_DELETION_UNAVAILABLE' };
    }
    return { status: 'available' };
  } catch {
    return { status: 'unavailable', code: 'ACCOUNT_DELETION_UNAVAILABLE' };
  }
}

export class AccountDeletionUnavailableError extends Error {
  readonly code = 'ACCOUNT_DELETION_UNAVAILABLE';
  constructor() { super(ACCOUNT_DELETION_NOTICE); this.name = 'AccountDeletionUnavailableError'; }
}

export class AccountDeletionFailedError extends Error {
  readonly code: string;
  constructor(message: string, code: string) { super(message); this.name = 'AccountDeletionFailedError'; this.code = code; }
}

/**
 * Requests real account deletion. Never invoke this without both explicit
 * user confirmation dialogs shown first — the caller (SettingsScreen) owns
 * that UX. Throws AccountDeletionUnavailableError if the backend gate is
 * off, or AccountDeletionFailedError if the multi-step server deletion
 * failed partway through (see delete-account/handler.ts — not atomic
 * across Stripe/Storage/SQL/Auth, safe to retry).
 */
export async function deleteCurrentAccount(): Promise<void> {
  const { data, error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
  if (error) {
    throw new AccountDeletionFailedError(error.message || 'Account deletion request failed.', 'REQUEST_FAILED');
  }
  if (!data || data.status === 'unavailable') {
    throw new AccountDeletionUnavailableError();
  }
  if (data.status === 'error') {
    throw new AccountDeletionFailedError(data.message || 'Account deletion failed.', data.code || 'UNKNOWN');
  }
  // data.status === 'deleted': caller signs out locally next.
}

/** A late result from another account, session, press or unmounted screen is ignored. */
export function createDeletionViewGuard() {
  let generation = 0, subject: string | null = null, session: string | null = null, mounted = true;
  return {
    setSession(nextSubject: string | null, nextSession: string | null) {
      if (nextSubject !== subject || nextSession !== session) { subject = nextSubject; session = nextSession; generation++; }
    },
    begin() { return ++generation; },
    current(ticket: number) { return mounted && generation === ticket; },
    mount() { mounted = true; },
    dispose() { mounted = false; generation++; },
  };
}
