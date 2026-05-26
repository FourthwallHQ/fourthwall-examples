'use client'

import { OAuthRedirect } from "@/components/OAuthRedirect";
import { Suspense } from "react";

export default function OAuthFourthwallWrapped() {
  return <Suspense fallback={<div>Loading...</div>}>
    <OAuthRedirect 
      authEndpoint={`/api/oauth`} 
      appRedirect={({ domain, public_token, expires_in }) => `/?domain=${domain}&public_token=${public_token}&expires_in=${expires_in}`}
      message="Connecting your Fourthwall account..."
      redirectMessage="Taking you to connect your Twitch account..."
    />
  </Suspense>
}
