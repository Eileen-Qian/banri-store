/**
 * LINE Login OAuth utility.
 */

/**
 * Build the LINE Login authorization URL.
 * @param state — passed back by LINE after auth (e.g. orderId)
 */
export function getLineLoginUrl(state = "") {
  const channelId = process.env.NEXT_PUBLIC_LINE_LOGIN_CHANNEL_ID ?? "";
  const redirectUri = encodeURIComponent(getRedirectUri());
  return (
    `https://access.line.me/oauth2/v2.1/authorize` +
    `?response_type=code` +
    `&client_id=${channelId}` +
    `&redirect_uri=${redirectUri}` +
    `&state=${encodeURIComponent(state)}` +
    `&scope=profile%20openid` +
    `&bot_prompt=aggressive`
  );
}

export function getRedirectUri() {
  // Use a fixed path so it matches the LINE Developers callback URL.
  // The order ID is carried via the `state` parameter instead.
  const locale = window.location.pathname.startsWith("/en") ? "en" : "zh";
  return `${window.location.origin}/${locale}/line-callback`;
}

/**
 * Exchange LINE authorization code for customer info.
 */
export async function exchangeLineCode(code: string) {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE ?? "";
  const res = await fetch(`${apiBase}/api/v1/auth/line`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, redirectUri: getRedirectUri() }),
  });
  if (!res.ok) throw new Error("LINE login failed");
  return res.json();
}
