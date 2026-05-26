import { fourthwallOAuth } from '../../../lib/fourthwall'

export async function GET(request: Request) {
  const APP_ID = process.env.NEXT_PUBLIC_FOURTHWALL_APP_ID;
  if (!APP_ID) {
    throw new Error("APP_ID is not set")
  }

  const CLIENT_SECRET = process.env.FOURTHWALL_APP_SECRET;
  if (!CLIENT_SECRET) {
    throw new Error("CLIENT_SECRET is not set")
  }
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL
  if (!BASE_URL) {
    throw new Error("BASE_URL is not set")
  }
  const FOURTHWALL_BASE_URL = process.env.NEXT_PUBLIC_FOURTHWALL_BASE_URL;
  if (!FOURTHWALL_BASE_URL) {
    throw new Error("FOURTHWALL_BASE_URL is not set")
  }
  const FOURTHWALL_API_URL = `https://api.${FOURTHWALL_BASE_URL}`;

  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  if (!code) {
    return new Response(JSON.stringify({ error: `No code provided ${request.url}` }), {
      status: 400,
    });
  }

  return await fourthwallOAuth({
    appId: APP_ID,
    clientSecret: CLIENT_SECRET,
    redirectUri: `${BASE_URL}/oauth`,
    apiUrl: FOURTHWALL_API_URL,
    code: code,
  });
}
