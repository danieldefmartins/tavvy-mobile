import { supabase } from './supabaseClient';

export const ACCOUNT_DELETION_NOTICE = 'This permanently removes your sign-in, private profile, cards, reviews, saved activity, uploaded files, and live location sessions. Shared business and payroll history may remain without an account ownership link. Public place, event, and campground listings remain without your creator link. Stripe subscriptions linked to your account will be canceled; Apple or Google subscriptions must be managed in your store subscription settings.';

/** Call only after an explicit destructive confirmation. Never send a user ID. */
export async function deleteCurrentAccount(): Promise<void> {
  const { data, error } = await supabase.functions.invoke('delete-account', { body: { confirmation: 'DELETE' } });
  if (error) {
    let detail: string | undefined;
    try {
      const body = await error.context?.json();
      if (typeof body?.error === 'string') detail = body.error;
    } catch { /* A network failure may have an unknown server outcome. */ }
    throw new Error(detail || 'Account deletion could not be confirmed. Please retry; do not assume your account is deleted.');
  }
  if (data?.deleted !== true) throw new Error('Account deletion could not be confirmed. Please retry.');
  // A local sign-out failure must not turn a confirmed server deletion into a false deletion failure.
  await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
}
