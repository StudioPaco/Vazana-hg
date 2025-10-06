'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="he" dir="rtl">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-hebrew">
              משהו השתבש!
            </h2>
            <p className="text-gray-600 mb-6 font-hebrew">
              אירעה שגיאה בלתי צפויה במערכת
            </p>
            <button
              onClick={() => reset()}
              className="bg-vazana-yellow hover:bg-yellow-600 text-vazana-dark font-semibold py-2 px-4 rounded font-hebrew"
            >
              נסה שנית
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}