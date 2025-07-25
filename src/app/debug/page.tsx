'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'

export default function DebugPage() {
  const { data: session, status } = useSession()
  const [apiResults, setApiResults] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)

  const testAPI = async (endpoint: string, name: string) => {
    try {
      const response = await fetch(endpoint)
      const data = await response.json()
      setApiResults((prev: Record<string, any>) => ({
        ...prev,
        [name]: {
          status: response.status,
          data: data,
          ok: response.ok
        }
      }))
    } catch (error) {
      setApiResults((prev: Record<string, any>) => ({
        ...prev,
        [name]: {
          status: 'ERROR',
          data: error instanceof Error ? error.message : 'Unknown error',
          ok: false
        }
      }))
    }
  }

  const runAllTests = async () => {
    setLoading(true)
    setApiResults({})
    
    await testAPI('/api/auth/session', 'session')
    await testAPI('/api/roles', 'roles')
    await testAPI('/api/sites', 'sites')
    await testAPI('/api/auth/users', 'users')
    
    setLoading(false)
  }

  useEffect(() => {
    runAllTests()
  }, [])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Authentication & API Debug Page</h1>
      
      {/* Session Status */}
      <div className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Session Status</h2>
        <div className="space-y-2">
          <p><strong>Status:</strong> {status}</p>
          <p><strong>Session exists:</strong> {session ? 'Yes' : 'No'}</p>
          {session && (
            <div className="mt-4 p-3 bg-gray-50 rounded">
              <h3 className="font-medium mb-2">Session Data:</h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(session, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* API Tests */}
      <div className="mb-8 p-4 border rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">API Tests</h2>
          <button 
            onClick={runAllTests}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Run Tests'}
          </button>
        </div>
        
        <div className="space-y-4">
          {Object.entries(apiResults).map(([name, result]: [string, any]) => (
            <div key={name} className={`p-3 rounded border-l-4 ${
              result.ok ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
            }`}>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium">{name.toUpperCase()} API</h3>
                <span className={`px-2 py-1 rounded text-sm ${
                  result.ok ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                }`}>
                  {result.status}
                </span>
              </div>
              <pre className="text-sm overflow-auto bg-white p-2 rounded">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </div>

      {/* Browser Info */}
      <div className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Browser Info</h2>
        <div className="space-y-2 text-sm">
          <p><strong>User Agent:</strong> {navigator.userAgent}</p>
          <p><strong>Cookies Enabled:</strong> {navigator.cookieEnabled ? 'Yes' : 'No'}</p>
          <p><strong>Current URL:</strong> {window.location.href}</p>
          <p><strong>Local Storage Available:</strong> {typeof(Storage) !== "undefined" ? 'Yes' : 'No'}</p>
        </div>
      </div>

      {/* Instructions */}
      <div className="p-4 border rounded-lg bg-blue-50">
        <h2 className="text-xl font-semibold mb-4">Debug Instructions</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>Check if session status shows "authenticated"</li>
          <li>Verify that session data contains user information</li>
          <li>Check API test results - all should return status 200 except when expected</li>
          <li>If session is null, try logging in at <a href="/auth/signin" className="text-blue-600 underline">/auth/signin</a></li>
          <li>If APIs fail, check browser network tab for detailed error messages</li>
        </ol>
      </div>
    </div>
  )
} 