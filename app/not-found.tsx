import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="mb-8">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 font-hebrew">
            הדף לא נמצא
          </h2>
          <p className="text-gray-600 font-hebrew mb-4">
            לא הצלחנו למצוא את הדף שאתה מחפש
          </p>
        </div>
        
        <Link
          href="/"
          className="inline-block w-full bg-vazana-yellow hover:bg-yellow-600 text-vazana-dark font-semibold py-2 px-4 rounded font-hebrew transition-colors text-center"
        >
          חזור לדף הבית
        </Link>
      </div>
    </div>
  )
}