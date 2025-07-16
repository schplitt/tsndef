import type { SafePayload } from '../types/records'
import type { NDEFRecordWellKnownURI } from '../types/records/well-known'
import { reconstructURIFromPrefix } from '../utils/record'

/**
 * Create a well-known URI record from raw payload (for parsing)
 */
export function createNDEFRecordWellKnownURIFromBytes(rawPayload: Uint8Array, id?: string): NDEFRecordWellKnownURI<string> {
  if (rawPayload.length === 0) {
    throw new Error('URI record payload cannot be empty')
  }

  const prefixCode = rawPayload[0]!
  const suffixBytes = rawPayload.slice(1)
  const suffix = new TextDecoder().decode(suffixBytes)

  // Reconstruct the full URI from prefix code and suffix
  const fullURI = reconstructURIFromPrefix(prefixCode, suffix)

  return {
    tnf: 'well-known',
    payload: () => fullURI,
    safePayload: (): SafePayload<string> => ({
      success: true,
      payload: fullURI,
      error: undefined,
    }),
    rawPayload: () => rawPayload,
    type: 'U',
    rawType: () => new TextEncoder().encode('U'),
    id,
    rawId: id ? () => new TextEncoder().encode(id) : () => undefined,
    isIdentified: true,
  }
}
