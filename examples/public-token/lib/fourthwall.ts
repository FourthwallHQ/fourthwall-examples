export async function fourthwallOAuth(props: {
  appId: string,
  clientSecret: string,
  redirectUri: string,
  apiUrl: string,
  code: string,
}): Promise<Response> {
  const { appId, clientSecret, redirectUri, apiUrl, code } = props;

  const TOKEN_URL = `${apiUrl}/open-api/v1.0/platform/token`
  const formData = new URLSearchParams({
    client_id: appId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
    scope: '',
    code,
  });

  console.log('formData', formData.toString())

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  if (!response.ok) {
    const errorMsg = await response.text();
    throw new Error(`Failed to get access token: ${errorMsg}`)
  }

  const data = await response.json();
  const { access_token, expires_in } = data;

  // 2. Get basic shop info
  const shopIdResponse = await fetch(`${apiUrl}/open-api/v1.0/shops/current`, {
    headers: {
      'Authorization': `Bearer ${access_token}`,
    },
  });

  if (!shopIdResponse.ok) {
    throw new Error(`Failed to get shop id: ${await shopIdResponse.text()}`)
  }

  const shopId = await shopIdResponse.json();
  const { id: shop_id, domain } = shopId;

  const publicTokenResponse = await fetch(`${apiUrl}/open-api/v1.0/public-token`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${access_token}`,
    },
  });

  if (!publicTokenResponse.ok) {
    throw new Error(`Failed to get public token: ${await publicTokenResponse.text()}`)
  }

  const { token } = await publicTokenResponse.json();

  return new Response(JSON.stringify({
    shop_id,
    domain,
    public_token: token,
    expires_in,
    success: true,
  }), {
    status: 200,
  })
}
