import RedirectTimer from "./RedirectTimer";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export function OAuthRedirect({ 
  authEndpoint, 
  appRedirect, 
  message, 
  redirectMessage,
}: { authEndpoint: string, appRedirect: (responseBody: any) => string, message: string, redirectMessage: string }) {
  const searchParams = useSearchParams()
  const [data, setData] = useState<{shop_id: string, domain: string} | null>(null)
  const [error, setError] = useState<string | null>(null)

  const getData = useCallback(async () => {
    const code = searchParams.get('code')
    const response = await fetch(`${authEndpoint}?code=${code}`);
    if (!response.ok) {
      const errorMsg = await response.text();
      console.error(errorMsg)
      setError(errorMsg || 'Unknown error')
      return
    }
    const data = await response.json();
    return data;
  }, [searchParams])

  useEffect(() => {
    async function fetchData() {
      const d = await getData()
      setData(d)
    }
    fetchData()
  }, [getData])

  if (error) {
    return <div>
      <h2>Error on login</h2>
      <pre>{error}</pre>
    </div>
  }

  if (!data) {
    return <div>
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h2 className="text-2xl font-bold mb-4">{message}</h2>
      </div>
    </div>
  }

  // Redirect after 2 seconds
  return (
    <RedirectTimer 
      seconds={2} 
      href={appRedirect(data)}
      title={redirectMessage}
    />
  )
}
