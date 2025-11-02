import { appLogger } from './logger';
import { ERROR_PATTERNS } from '../constants';

/**
 * Standardized error handling utility for Dreamer App
 * Provides consistent error handling patterns across the application
 */

export interface AppError {
  code: string;
  message: string;
  originalError?: unknown;
  context?: string;
  isRetryable?: boolean;
}

export interface ErrorHandlerOptions {
  showUserMessage?: boolean;
  logToConsole?: boolean;
  retryable?: boolean;
  context?: string;
}

/**
 * Creates a standardized AppError
 */
export function createAppError(
  code: string,
  message: string,
  originalError?: unknown,
  context?: string
): AppError {
  return {
    code,
    message,
    originalError,
    context,
    isRetryable: ERROR_PATTERNS.ERROR_CODES.RATE_LIMITED === code ||
                 ERROR_PATTERNS.ERROR_CODES.TIMEOUT === code
  };
}

/**
 * Sanitizes error messages to prevent sensitive information exposure
 */
export function sanitizeErrorMessage(error: unknown): string {
  const errorStr = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack || '' : '';
  
  // Combine message and stack for comprehensive sanitization
  const fullErrorText = `${errorStr}\n${errorStack}`;
  
  // Remove API keys (various patterns)
  const sanitized = fullErrorText
    // Remove actual API keys
    .replace(/AIza[0-9A-Za-z\-_]{35}/g, '[API_KEY]')
    .replace(/api[_-]?key["']?\s*[:=]\s*["']?([0-9A-Za-z\-_]{32,})/gi, 'api_key: [REDACTED]')
    // Remove authorization headers
    .replace(/authorization["']?\s*[:=]\s*["']?Bearer\s+[0-9A-Za-z\-_.]+/gi, 'Authorization: Bearer [REDACTED]')
    // Remove any long alphanumeric strings that might be tokens
    .replace(/\b[0-9A-Za-z\-_]{40,}\b/g, '[REDACTED_TOKEN]')
    // Remove process env references
    .replace(/process\.env\.[A-Z_]+/g, '[ENV_VAR]')
    // Keep only the error type and sanitized message
    .split('\n')[0];
    
  return sanitized;
}

/**
 * Handles errors with consistent logging and user feedback
 */
export function handleError(
  error: unknown,
  options: ErrorHandlerOptions = {}
): AppError {
  const {
    showUserMessage = true,
    logToConsole = true,
    retryable = false,
    context = 'Unknown Context'
  } = options;

  // Create standardized error
  const appError = createAppError(
    ERROR_PATTERNS.ERROR_CODES.NETWORK_FAILED,
    ERROR_PATTERNS.GENERIC_ERROR,
    error,
    context
  );

  // Determine error code based on error type
  if (error instanceof TypeError) {
    appError.code = ERROR_PATTERNS.ERROR_CODES.VALIDATION_FAILED;
    appError.message = ERROR_PATTERNS.VALIDATION_ERROR;
  } else if (error instanceof DOMException && error.name === 'AbortError') {
    appError.code = ERROR_PATTERNS.ERROR_CODES.TIMEOUT;
    appError.message = ERROR_PATTERNS.TIMEOUT_ERROR;
    appError.isRetryable = true;
  } else if (error instanceof RangeError) {
    appError.code = ERROR_PATTERNS.ERROR_CODES.VALIDATION_FAILED;
    appError.message = ERROR_PATTERNS.VALIDATION_ERROR;
  }

  // Apply retryable flag
  if (retryable) {
    appError.isRetryable = true;
  }

  // Log error
  if (logToConsole) {
    const sanitizedMessage = sanitizeErrorMessage(error);
    
    if (appError.code === ERROR_PATTERNS.ERROR_CODES.VALIDATION_FAILED) {
      appLogger.warn(`[${context}] ${appError.message}`, sanitizedMessage);
    } else {
      appLogger.error(`[${context}] ${appError.message}`, sanitizedMessage);
    }
  }

  // Show user message if requested
  if (showUserMessage) {
    showUserFriendlyError(appError);
  }

  return appError;
}

/**
 * Shows user-friendly error messages
 */
function showUserFriendlyError(error: AppError): void {
  // In a real app, you might want to use a toast notification system
  // For now, we'll use alert for critical errors and console.warn for warnings
  if (error.code === ERROR_PATTERNS.ERROR_CODES.VALIDATION_FAILED) {
    console.warn(`Validation Error: ${error.message}`);
  } else {
    alert(error.message);
  }
}

/**
 * Wraps async functions with standardized error handling
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context: string,
  options: ErrorHandlerOptions = {}
) {
  return async (...args: T): Promise<R | null> => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, { ...options, context });
      return null;
    }
  };
}

/**
 * Handles file upload errors
 */
export function handleFileUploadError(error: unknown, fileName: string): AppError {
  const appError = handleError(error, {
    showUserMessage: true,
    context: `File Upload: ${fileName}`
  });

  // Customize error message based on error type
  if (error instanceof Error) {
    if (error.message.includes('size')) {
      appError.code = ERROR_PATTERNS.ERROR_CODES.FILE_TOO_LARGE;
      appError.message = ERROR_PATTERNS.FILE_UPLOAD_ERROR;
    } else if (error.message.includes('type')) {
      appError.code = ERROR_PATTERNS.ERROR_CODES.UNSUPPORTED_FILE_TYPE;
      appError.message = ERROR_PATTERNS.FILE_UPLOAD_ERROR;
    }
  }

  return appError;
}

/**
 * Handles AI service errors
 */
export function handleAIServiceError(error: unknown, serviceName: string): AppError {
  const appError = handleError(error, {
    showUserMessage: true,
    retryable: true,
    context: `AI Service: ${serviceName}`
  });

  appError.code = ERROR_PATTERNS.ERROR_CODES.GENERATION_FAILED;
  appError.message = ERROR_PATTERNS.AI_SERVICE_ERROR;

  return appError;
}

/**
 * Validates file before processing
 */
export function validateFile(file: File, maxSize: number, allowedTypes: string[]): AppError | null {
  // Check file size
  if (file.size > maxSize) {
    return createAppError(
      ERROR_PATTERNS.ERROR_CODES.FILE_TOO_LARGE,
      `File "${file.name}" exceeds the maximum size of ${Math.round(maxSize / 1024 / 1024)}MB`,
      undefined,
      'File Validation'
    );
  }

  // Check file type
  if (!allowedTypes.some(type => file.type.includes(type) || file.name.toLowerCase().endsWith(type))) {
    return createAppError(
      ERROR_PATTERNS.ERROR_CODES.UNSUPPORTED_FILE_TYPE,
      `File "${file.name}" has an unsupported file type. Allowed types: ${allowedTypes.join(', ')}`,
      undefined,
      'File Validation'
    );
  }

  return null;
}

/**
 * Creates a fallback value for failed operations
 */
export function createFallbackValue<T>(defaultValue: T, error: AppError): T {
  appLogger.warn(`[${error.context}] Using fallback value:`, error.message);
  return defaultValue;
}

/**
 * Rate limiting error handler
 */
export function handleRateLimitError(): AppError {
  return createAppError(
    ERROR_PATTERNS.ERROR_CODES.RATE_LIMITED,
    'Too many requests. Please wait a moment before trying again.',
    undefined,
    'Rate Limiting'
  );
}

/**
 * Network error handler
 */
export function handleNetworkError(error: unknown): AppError {
  return handleError(error, {
    showUserMessage: true,
    retryable: true,
    context: 'Network Request'
  });
}