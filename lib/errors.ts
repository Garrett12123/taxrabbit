export class AppError extends Error {
  public readonly code: string;

  constructor(message: string, code = 'APP_ERROR') {
    super(message);
    this.name = 'AppError';
    this.code = code;
  }
}

export class VaultError extends AppError {
  constructor(message: string) {
    super(message, 'VAULT_ERROR');
    this.name = 'VaultError';
  }
}

export class CryptoError extends AppError {
  constructor(message: string) {
    super(message, 'CRYPTO_ERROR');
    this.name = 'CryptoError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string) {
    super(message, 'DATABASE_ERROR');
    this.name = 'DatabaseError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export function formatZodErrors(error: { issues: ReadonlyArray<{ path: PropertyKey[]; message: string }> }): string {
  const messages = error.issues.map((issue) => {
    const field = issue.path.map(String).join('.');
    return field ? `${field}: ${issue.message}` : issue.message;
  });
  return messages.join('; ');
}

export function formatErrorForUser(error: unknown): string {
  // Typed error classes — return their messages directly
  if (error instanceof VaultError) {
    return error.message;
  }
  if (error instanceof CryptoError) {
    return 'Failed to decrypt data. The vault may be corrupted.';
  }
  if (error instanceof ValidationError) {
    return error.message;
  }
  if (error instanceof DatabaseError) {
    return 'A database error occurred. Please try again.';
  }
  if (error instanceof AppError) {
    return error.message;
  }

  // Generic errors — use string matching as fallback
  if (error instanceof Error) {
    if (error.message === 'Vault is locked') {
      return 'Your vault is locked. Please unlock it to continue.';
    }
    if (error.message === 'Incorrect password') {
      return 'The password you entered is incorrect.';
    }
    if (error.message.includes('Decryption failed')) {
      return 'Failed to decrypt data. The vault may be corrupted.';
    }
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
}
