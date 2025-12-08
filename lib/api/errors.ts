// ============= ERROR HANDLING =============
// Centralized error handling for all database operations

export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly originalError?: any,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'DatabaseError';
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DatabaseError);
    }
  }
}

export function handleDatabaseError(operation: string, error: any): never {
  if (error?.code === '42703' || error?.code === 'PGRST204' || error?.message?.includes('column')) {
    throw new DatabaseError(
      `Column or table does not exist. Please run the migration. Operation: ${operation}`,
      error,
      error?.code
    );
  }
  
  throw new DatabaseError(
    `Database operation failed: ${operation}. ${error?.message || 'Unknown error'}`,
    error,
    error?.code
  );
}



