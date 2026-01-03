export default function ErrorAlert({ error, onRetry }) {
  const getErrorMessage = (error) => {
    if (!error) return "An unexpected error occurred."
    
    // Network errors
    if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
      return "Unable to connect to the server. Please check your connection and try again."
    }
    
    // HTTP errors
    if (error.response) {
      const status = error.response.status
      
      if (status === 401) {
        return "Your session has expired. Please log in again."
      }
      
      if (status === 403) {
        return "You don't have permission to access this resource."
      }
      
      if (status === 404) {
        return "The requested resource was not found."
      }
      
      if (status >= 500) {
        return "Server error. Please try again later."
      }
      
      // Try to extract error message from response
      if (error.response.data) {
        if (typeof error.response.data === 'string') {
          return error.response.data
        }
        if (error.response.data.detail) {
          return error.response.data.detail
        }
        if (error.response.data.error) {
          return error.response.data.error
        }
        // Handle validation errors
        if (typeof error.response.data === 'object') {
          const errors = Object.entries(error.response.data)
            .map(([field, messages]) => {
              const msgArray = Array.isArray(messages) ? messages : [messages]
              return `${field}: ${msgArray.join(', ')}`
            })
            .join('. ')
          if (errors) return errors
        }
      }
    }
    
    return error.message || "An unexpected error occurred."
  }

  return (
    <div className="alert alert-danger d-flex align-items-center" role="alert">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-exclamation-triangle-fill flex-shrink-0 me-2" viewBox="0 0 16 16">
        <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
      </svg>
      <div className="flex-grow-1">
        <strong>Error:</strong> {getErrorMessage(error)}
        {onRetry && (
          <button 
            className="btn btn-sm btn-outline-danger ms-3" 
            onClick={onRetry}
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  )
}
