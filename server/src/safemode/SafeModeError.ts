/**
 * SafeModeError — thrown when a send operation is blocked by Safe Mode rules.
 *
 * Codes:
 *   F13 — Link detected in first message to this recipient (ban-bait)
 *   F14 — Daily send cap or sending-window violation
 *   F15 — Group action blocked (number too new for group operations)
 */
export type SafeModeErrorCode = 'F13' | 'F14' | 'F15';

export class SafeModeError extends Error {
  /** Machine-readable code for caller switch statements */
  readonly code: SafeModeErrorCode;
  /** Human-readable description of what rule was violated */
  readonly detail: string;

  constructor(code: SafeModeErrorCode, detail: string) {
    super(`[SafeMode ${code}] ${detail}`);
    this.name = 'SafeModeError';
    this.code = code;
    this.detail = detail;
    // Maintain proper stack trace in V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SafeModeError);
    }
  }

  toJSON() {
    return {
      error: 'SafeModeError',
      code: this.code,
      message: this.message,
      detail: this.detail,
    };
  }
}
