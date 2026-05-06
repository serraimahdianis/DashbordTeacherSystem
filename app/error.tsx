"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
      <AlertTriangle className="h-12 w-12 text-amber-500" />
      <h2 className="text-xl font-bold text-gray-900">Something went wrong</h2>
      <p className="text-gray-500 max-w-md">{error.message || "An unexpected error occurred."}</p>
      <Button onClick={reset} variant="outline" className="mt-2">
        Try again
      </Button>
    </div>
  )
}
