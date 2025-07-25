export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

export async function safeApiCall<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(input, init)
    
    // Check if response is ok
    if (!response.ok) {
      const errorText = await response.text()
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`
      }
    }
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      const responseText = await response.text()
      return {
        success: false,
        error: `Expected JSON response but got: ${contentType || 'unknown content type'}\nResponse: ${responseText.substring(0, 200)}...`
      }
    }
    
    // Try to parse JSON
    const data = await response.json()
    return data
    
  } catch (error) {
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      return {
        success: false,
        error: 'Invalid JSON response from server. The API might be returning an error page instead of JSON.'
      }
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

export function isApiResponse<T>(response: any): response is ApiResponse<T> {
  return typeof response === 'object' && 
         response !== null && 
         typeof response.success === 'boolean'
} 