import * as WebBrowser from 'expo-web-browser';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { Linking } from 'react-native';
import { getSupabaseClient } from '../../lib/supabase';

type OAuthProvider = 'google' | 'apple' | 'facebook';

function getRedirectUri(): string {
  // Use our registered app scheme; both iOS and Android have com.guinote2.app
  // We accept any path here; Supabase should allow this scheme in redirect allow list
  return 'com.guinote2.app://oauth-callback';
}

export async function startOAuth(provider: OAuthProvider): Promise<void> {
  const supabase = await getSupabaseClient();

  const redirectTo = getRedirectUri();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as any,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });
  if (error) throw error;

  const authUrl = data?.url ?? '';
  if (!authUrl) throw new Error('No OAuth URL returned');

  // Open in an auth session and wait for redirect back
  const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectTo);

  if (result.type === 'success' && result.url) {
    await handleOAuthRedirect(result.url);
  } else if (result.type === 'dismiss') {
    // user closed the sheet - do nothing
  } else {
    // As a fallback, try to read current session (supabase may have persisted via redirect)
    await supabase.auth.getSession();
  }
}

export async function handleOAuthRedirect(url: string): Promise<void> {
  const supabase = await getSupabaseClient();

  // Supabase for mobile generally returns access_token in the hash
  const { params } = QueryParams.getQueryParams(url);
  const access_token = params['access_token'];
  const refresh_token = params['refresh_token'];

  if (access_token) {
    await supabase.auth.setSession({ access_token, refresh_token });
    return;
  }

  // Some flows provide a `code` instead. If so, attempt exchange.
  const code = params['code'];
  if (code && typeof (supabase.auth as any).exchangeCodeForSession === 'function') {
    // @ts-expect-error not in RN path typings sometimes
    await (supabase.auth as any).exchangeCodeForSession(code);
    return;
  }

  // As last resort, fetch session; if none, surface an error
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    throw error || new Error('Failed to establish session after OAuth redirect');
  }
}

// Optional: allow a global listener to be registered if app is opened via deep link directly
let linkingSubscription: { remove: () => void } | null = null;

export function registerOAuthLinkingListener() {
  if (linkingSubscription) return;
  linkingSubscription = Linking.addEventListener('url', async ({ url }) => {
    if (url && (url.startsWith('com.guinote2.app://') || url.startsWith('guinote://'))) {
      try {
        await handleOAuthRedirect(url);
      } catch {
        // Ignore - handled where called
      }
    }
  }) as unknown as { remove: () => void };
}

export function unregisterOAuthLinkingListener() {
  if (linkingSubscription) {
    linkingSubscription.remove();
    linkingSubscription = null;
  }
}

// WebBrowser helper recommended by Expo; no-op on native if not needed
// This prevents dangling auth sessions on web builds
try {
  WebBrowser.maybeCompleteAuthSession();
} catch {}


