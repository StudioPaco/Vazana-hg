"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Worker, Vehicle, Cart, Client, WorkType } from "@/entities/all"

export default function DatabaseTest() {
  const [results, setResults] = useState<any>({})
  const [loading, setLoading] = useState(false)

  const testDatabaseConnection = async () => {
    setLoading(true)
    const testResults: any = {}

    try {
      console.log("[v0] Testing Workers...")
      const workers = await Worker.list()
      testResults.workers = { count: workers?.length || 0, data: workers, error: null }
      console.log("[v0] Workers result:", workers)
    } catch (error) {
      console.error("[v0] Workers error:", error)
      testResults.workers = { count: 0, data: null, error: error.message }
    }

    try {
      console.log("[v0] Testing Vehicles...")
      const vehicles = await Vehicle.list()
      testResults.vehicles = { count: vehicles?.length || 0, data: vehicles, error: null }
      console.log("[v0] Vehicles result:", vehicles)
    } catch (error) {
      console.error("[v0] Vehicles error:", error)
      testResults.vehicles = { count: 0, data: null, error: error.message }
    }

    try {
      console.log("[v0] Testing Carts...")
      const carts = await Cart.list()
      testResults.carts = { count: carts?.length || 0, data: carts, error: null }
      console.log("[v0] Carts result:", carts)
    } catch (error) {
      console.error("[v0] Carts error:", error)
      testResults.carts = { count: 0, data: null, error: error.message }
    }

    try {
      console.log("[v0] Testing Clients...")
      const clients = await Client.list()
      testResults.clients = { count: clients?.length || 0, data: clients, error: null }
      console.log("[v0] Clients result:", clients)
    } catch (error) {
      console.error("[v0] Clients error:", error)
      testResults.clients = { count: 0, data: null, error: error.message }
    }

    try {
      console.log("[v0] Testing WorkTypes...")
      const workTypes = await WorkType.list()
      testResults.workTypes = { count: workTypes?.length || 0, data: workTypes, error: null }
      console.log("[v0] WorkTypes result:", workTypes)
    } catch (error) {
      console.error("[v0] WorkTypes error:", error)
      testResults.workTypes = { count: 0, data: null, error: error.message }
    }

    setResults(testResults)
    setLoading(false)
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Database Connection Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={testDatabaseConnection} disabled={loading}>
          {loading ? "Testing..." : "Test Database Connection"}
        </Button>

        {Object.keys(results).length > 0 && (
          <div className="space-y-4">
            {Object.entries(results).map(([table, result]: [string, any]) => (
              <div key={table} className="p-4 border rounded-lg">
                <h3 className="font-semibold text-lg capitalize">{table}</h3>
                <p className="text-sm text-gray-600">Count: {result.count}</p>
                {result.error && <p className="text-sm text-red-600 mt-2">Error: {result.error}</p>}
                {result.data && result.data.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium">Sample data:</p>
                    <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-32">
                      {JSON.stringify(result.data[0], null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
