import { Alert } from 'react-native';

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AppError {
  message: string;
  code?: string;
  severity: ErrorSeverity;
  context?: Record<string, any>;
  timestamp: number;
}

class ErrorHandler {
  private errorQueue: AppError[] = [];
  private maxQueueSize = 50;
  private errorHandlers: Map<string, (error: AppError) => void> = new Map();

  public handleError(
    error: Error | string,
    severity: ErrorSeverity = 'error',
    context?: Record<string, any>
  ): void {
    const appError: AppError = {
      message: typeof error === 'string' ? error : error.message,
      code: typeof error === 'object' ? error.name : undefined,
      severity,
      context,
      timestamp: Date.now(),
    };

    // Add to queue
    this.errorQueue.push(appError);
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }

    // Log error
    console.error(`[${severity.toUpperCase()}]`, appError.message, context);

    // Execute custom handlers
    this.errorHandlers.forEach(handler => handler(appError));

    // Show user-facing error for critical errors
    if (severity === 'critical') {
      this.showUserError(appError);
    }
  }

  public registerHandler(id: string, handler: (error: AppError) => void): void {
    this.errorHandlers.set(id, handler);
  }

  public unregisterHandler(id: string): void {
    this.errorHandlers.delete(id);
  }

  private showUserError(error: AppError): void {
    Alert.alert(
      'Error',
      error.message,
      [{ text: 'OK', style: 'default' }],
      { cancelable: true }
    );
  }

  public getRecentErrors(): AppError[] {
    return [...this.errorQueue];
  }

  public clearErrors(): void {
    this.errorQueue = [];
  }
}

export const errorHandler = new ErrorHandler();

// Convex-specific error handling
export function handleConvexError(error: any): void {
  if (error?.message?.includes('Invalid auth')) {
    errorHandler.handleError(
      'Authentication expired. Please log in again.',
      'warning',
      { convexError: error }
    );
  } else if (error?.message?.includes('Network')) {
    errorHandler.handleError(
      'Network error. Please check your connection.',
      'warning',
      { convexError: error }
    );
  } else {
    errorHandler.handleError(
      error,
      'error',
      { convexError: error }
    );
  }
}

// Game-specific error handling
export function handleGameError(error: any, context?: Record<string, any>): void {
  if (error?.message?.includes('Invalid move')) {
    errorHandler.handleError(
      'Invalid move. Please try again.',
      'info',
      { gameError: error, ...context }
    );
  } else if (error?.message?.includes('turn')) {
    errorHandler.handleError(
      'Not your turn.',
      'info',
      { gameError: error, ...context }
    );
  } else {
    errorHandler.handleError(
      error,
      'error',
      { gameError: error, ...context }
    );
  }
}