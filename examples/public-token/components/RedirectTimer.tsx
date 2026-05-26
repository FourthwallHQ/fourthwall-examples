'use client'

import { useEffect, useState } from "react"

function RedirectMessage({ seconds, href, title }: { seconds: number, href: string, title: string }) {
  if (seconds > 0) {
    return <h1 className="text-xl font-bold m-4">Redirecting in {Math.max(0, seconds)} seconds...</h1>
  }

  return <h1 className="text-xl font-bold m-4">Redirecting...</h1>
}

export default function RedirectTimer({ seconds, href, title }: { seconds: number, href: string, title: string }) {
  const [start, setStart] = useState<number | null>(null)
  const [secondsElapsed, setSecondsElapsed] = useState(0)
  useEffect(() => {
    setStart(Date.now())
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      if (!start) {
        return
      }
      const elapsed = Math.floor((Date.now() - start) / 1000)
      if (elapsed > seconds) {
        window.location.href = href
      }
      setSecondsElapsed(elapsed)
    }, 1000)
    return () => clearInterval(interval)
  }, [start, secondsElapsed])


  return <div className="flex items-center justify-center min-h-screen bg-gray-100">
    <div className="text-center">
      <h1 className="text-2xl font-bold m-4">{title}</h1>
      <RedirectMessage seconds={seconds - secondsElapsed} href={href} title={title} />
    </div>
  </div>
}