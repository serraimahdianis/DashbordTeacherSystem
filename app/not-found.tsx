import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileQuestion } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
      <FileQuestion className="h-12 w-12 text-gray-400" />
      <h2 className="text-xl font-bold text-gray-900">Page not found</h2>
      <p className="text-gray-500 max-w-md">The page you are looking for does not exist or has been moved.</p>
      <Link href="/" className="mt-2">
        <Button variant="outline">Back to dashboard</Button>
      </Link>
    </div>
  )
}
