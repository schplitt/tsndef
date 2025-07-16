import type { SafePayload } from '../types/records'
import type { NDEFRecordMediaApplicationJson, NDEFRecordMediaAudioMPEG, NDEFRecordMediaImageJPEG, NDEFRecordMediaImagePNG, NDEFRecordMediaTextHTML, NDEFRecordMediaTextPlain, NDEFRecordMediaVideoMP4 } from '../types/records/media'

/**
 * Create a media application/json record from raw payload (for parsing)
 */
export function createNDEFRecordMediaApplicationJsonFromBytes(rawPayload: Uint8Array, id?: string): NDEFRecordMediaApplicationJson {
  return {
    tnf: 'media',
    payload: () => {
      const jsonString = new TextDecoder().decode(rawPayload)
      return JSON.parse(jsonString)
    },
    safePayload: () => {
      try {
        const jsonString = new TextDecoder().decode(rawPayload)
        const parsedPayload = JSON.parse(jsonString)
        return {
          success: true,
          payload: parsedPayload,
          error: undefined,
        }
      }
      catch (error) {
        return {
          success: false,
          payload: undefined,
          error: error instanceof Error ? error.message : 'Failed to parse JSON payload',
        }
      }
    },
    rawPayload: () => rawPayload,
    type: 'application/json',
    rawType: () => new TextEncoder().encode('application/json'),
    id,
    rawId: id ? () => new TextEncoder().encode(id) : () => undefined,
    isIdentified: true,
  }
}

/**
 * Create a media text/plain record from raw payload (for parsing)
 */
export function createNDEFRecordMediaTextPlainFromBytes(rawPayload: Uint8Array, id?: string): NDEFRecordMediaTextPlain<string> {
  return {
    tnf: 'media',
    payload: () => new TextDecoder().decode(rawPayload),
    safePayload: (): SafePayload<string> => ({
      success: true,
      payload: new TextDecoder().decode(rawPayload),
      error: undefined,
    }),
    rawPayload: () => rawPayload,
    type: 'text/plain',
    rawType: () => new TextEncoder().encode('text/plain'),
    id,
    rawId: id ? () => new TextEncoder().encode(id) : () => undefined,
    isIdentified: true,
  }
}

/**
 * Create a media text/html record from raw payload (for parsing)
 */
export function createNDEFRecordMediaTextHTMLFromBytes(rawPayload: Uint8Array, id?: string): NDEFRecordMediaTextHTML<string> {
  return {
    tnf: 'media',
    payload: () => new TextDecoder().decode(rawPayload),
    safePayload: (): SafePayload<string> => ({
      success: true,
      payload: new TextDecoder().decode(rawPayload),
      error: undefined,
    }),
    rawPayload: () => rawPayload,
    type: 'text/html',
    rawType: () => new TextEncoder().encode('text/html'),
    id,
    rawId: id ? () => new TextEncoder().encode(id) : () => undefined,
    isIdentified: true,
  }
}

/**
 * Create a media image/png record from raw payload (for parsing)
 */
export function createNDEFRecordMediaImagePNGFromBytes(rawPayload: Uint8Array, id?: string): NDEFRecordMediaImagePNG<Uint8Array> {
  return {
    tnf: 'media',
    payload: () => rawPayload,
    safePayload: (): SafePayload<Uint8Array> => ({
      success: true,
      payload: rawPayload,
      error: undefined,
    }),
    rawPayload: () => rawPayload,
    type: 'image/png',
    rawType: () => new TextEncoder().encode('image/png'),
    id,
    rawId: id ? () => new TextEncoder().encode(id) : () => undefined,
    isIdentified: true,
  }
}

/**
 * Create a media image/jpeg record from raw payload (for parsing)
 */
export function createNDEFRecordMediaImageJPEGFromBytes(rawPayload: Uint8Array, id?: string): NDEFRecordMediaImageJPEG<Uint8Array> {
  return {
    tnf: 'media',
    payload: () => rawPayload,
    safePayload: (): SafePayload<Uint8Array> => ({
      success: true,
      payload: rawPayload,
      error: undefined,
    }),
    rawPayload: () => rawPayload,
    type: 'image/jpeg',
    rawType: () => new TextEncoder().encode('image/jpeg'),
    id,
    rawId: id ? () => new TextEncoder().encode(id) : () => undefined,
    isIdentified: true,
  }
}

/**
 * Create a media video/mp4 record from raw payload (for parsing)
 */
export function createNDEFRecordMediaVideoMP4FromBytes(rawPayload: Uint8Array, id?: string): NDEFRecordMediaVideoMP4<Uint8Array> {
  return {
    tnf: 'media',
    payload: () => rawPayload,
    safePayload: (): SafePayload<Uint8Array> => ({
      success: true,
      payload: rawPayload,
      error: undefined,
    }),
    rawPayload: () => rawPayload,
    type: 'video/mp4',
    rawType: () => new TextEncoder().encode('video/mp4'),
    id,
    rawId: id ? () => new TextEncoder().encode(id) : () => undefined,
    isIdentified: true,
  }
}

/**
 * Create a media audio/mpeg record from raw payload (for parsing)
 */
export function createNDEFRecordMediaAudioMPEGFromBytes(rawPayload: Uint8Array, id?: string): NDEFRecordMediaAudioMPEG<Uint8Array> {
  return {
    tnf: 'media',
    payload: () => rawPayload,
    safePayload: (): SafePayload<Uint8Array> => ({
      success: true,
      payload: rawPayload,
      error: undefined,
    }),
    rawPayload: () => rawPayload,
    type: 'audio/mpeg',
    rawType: () => new TextEncoder().encode('audio/mpeg'),
    id,
    rawId: id ? () => new TextEncoder().encode(id) : () => undefined,
    isIdentified: true,
  }
}
