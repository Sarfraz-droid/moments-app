import { supabase } from '@/lib/supabase';

/** Sends an OTP to `phone`. If `linkToCurrentUser` is true (the current session
 * is anonymous), this attaches the phone to that same user instead of the
 * plain sign-in flow, which would otherwise create a brand new account. */
export async function sendPhoneOtp(phone: string, linkToCurrentUser: boolean) {
  if (linkToCurrentUser) {
    const { error } = await supabase.auth.updateUser({ phone });
    if (error) throw error;
    return;
  }
  const { error } = await supabase.auth.signInWithOtp({ phone });
  if (error) throw error;
}

export async function verifyPhoneOtp(phone: string, token: string, linkToCurrentUser: boolean) {
  const { error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: linkToCurrentUser ? 'phone_change' : 'sms',
  });
  if (error) throw error;
}
