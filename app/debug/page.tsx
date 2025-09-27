import DatabaseTest from "@/components/debug/database-test"

export default function DebugPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-8">Debug Page</h1>
      <DatabaseTest />
    </div>
  )
}
