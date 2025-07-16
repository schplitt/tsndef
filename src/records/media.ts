import type { BaseNDEFRecordOptions } from '../types/records'
import type { NDEFRecordMediaApplicationJson, NDEFRecordMediaAudioMPEG, NDEFRecordMediaImageJPEG, NDEFRecordMediaImagePNG, NDEFRecordMediaTextHTML, NDEFRecordMediaTextPlain, NDEFRecordMediaVideoMP4 } from '../types/records/media'
import type { BinaryLike } from '../types/utils'
import { binaryLikeToUint8Array } from '../utils'
import { prepareIdForRecord, prepareTypeForRecord } from '../utils/record'

/**
 * Configuration options for creating an application/json media record.
 *
 * @template TPayload - The specific type of the JSON object payload
 */
export interface NDEFRecordMediaApplicationJsonOptions<TPayload extends object> extends BaseNDEFRecordOptions<TPayload> {
}

/**
 * Creates an NDEF media record containing JSON data (application/json).
 *
 * This function creates a type-safe NDEF record that contains structured JSON data.
 * The payload is automatically serialized to JSON format during record construction
 * and can be safely deserialized when the record is read. This is ideal for
 * sharing structured data, configuration objects, or API responses via NFC.
 *
 * @template TPayload - The TypeScript type of the JSON object being stored
 * @param NDEFInfo - Configuration object containing the JSON payload and optional ID
 * @returns A typed NDEF record containing the JSON data with proper media type headers
 *
 * @example Basic JSON data
 * ```typescript
 * const record = createNDEFRecordMediaApplicationJson({
 *   payload: {
 *     message: "Hello, NFC!",
 *     timestamp: Date.now(),
 *     version: "1.0"
 *   }
 * });
 *
 * // Access the original object (type-safe)
 * const data = record.payload();
 * console.log(data.message); // "Hello, NFC!"
 * console.log(typeof data.timestamp); // "number"
 * ```
 *
 * @example Complex nested objects
 * ```typescript
 * interface UserProfile {
 *   id: number;
 *   name: string;
 *   preferences: {
 *     theme: 'light' | 'dark';
 *     notifications: boolean;
 *   };
 *   tags: string[];
 * }
 *
 * const userRecord = createNDEFRecordMediaApplicationJson<UserProfile>({
 *   payload: {
 *     id: 12345,
 *     name: "Alice Johnson",
 *     preferences: {
 *       theme: "dark",
 *       notifications: true
 *     },
 *     tags: ["developer", "nfc-enthusiast"]
 *   },
 *   id: "user-profile"
 * });
 *
 * // TypeScript provides full type safety
 * const user = userRecord.payload();
 * const theme: 'light' | 'dark' = user.preferences.theme; // Type-safe access
 * ```
 *
 * @example API response sharing
 * ```typescript
 * interface ApiResponse {
 *   status: 'success' | 'error';
 *   data: unknown;
 *   metadata: {
 *     requestId: string;
 *     timestamp: number;
 *   };
 * }
 *
 * const apiRecord = createNDEFRecordMediaApplicationJson<ApiResponse>({
 *   payload: {
 *     status: 'success',
 *     data: { result: "Data retrieved successfully" },
 *     metadata: {
 *       requestId: "req_abc123",
 *       timestamp: Date.now()
 *     }
 *   }
 * });
 * ```
 *
 * @see {@link https://tools.ietf.org/html/rfc7159} JSON specification (RFC 7159)
 * @see {@link NDEFMessage.add} for adding records to messages
 */
export function createNDEFRecordMediaApplicationJson<const TPayload extends object>(NDEFInfo: NDEFRecordMediaApplicationJsonOptions<TPayload>): NDEFRecordMediaApplicationJson<TPayload> {
  return {
    tnf: 'media',
    payload: () => NDEFInfo.payload,
    safePayload: () => ({
      success: true,
      payload: NDEFInfo.payload,
      error: undefined,
    }),
    rawPayload: () => new TextEncoder().encode(JSON.stringify(NDEFInfo.payload)),
    ...prepareIdForRecord(NDEFInfo.id),
    ...prepareTypeForRecord('application/json'),
    isIdentified: true,
  }
}

/**
 * Configuration options for creating a text/plain media record.
 *
 * @template TPayload - The specific string literal type of the text content
 */
export interface NDEFRecordMediaTextPlainOptions<TPayload extends string> extends BaseNDEFRecordOptions<TPayload> {
}

/**
 * Creates an NDEF media record containing plain text data (text/plain).
 *
 * This function creates an NDEF record suitable for storing human-readable text
 * without formatting. The text is encoded using UTF-8 and can contain any Unicode
 * characters. This is ideal for sharing simple messages, instructions, notes,
 * or any plain text content via NFC.
 *
 * @template TPayload - The TypeScript string literal type being stored
 * @param NDEFInfo - Configuration object containing the text payload and optional ID
 * @returns A typed NDEF record containing the plain text with proper media type headers
 *
 * @example Simple text message
 * ```typescript
 * const record = createNDEFRecordMediaTextPlain({
 *   payload: "Welcome to our NFC-enabled store! Tap your phone on products for more info."
 * });
 *
 * const message = record.payload(); // Returns the original string
 * console.log(message); // "Welcome to our NFC-enabled store! ..."
 * ```
 *
 * @example Multilingual content
 * ```typescript
 * const multilingualRecord = createNDEFRecordMediaTextPlain({
 *   payload: "Hello! 👋 Bonjour! Hola! こんにちは! 你好!",
 *   id: "greeting-multilingual"
 * });
 *
 * // Unicode characters are properly preserved
 * const greeting = multilingualRecord.payload();
 * console.log(greeting.includes("👋")); // true
 * ```
 *
 * @example Instructions or help text
 * ```typescript
 * const instructions = createNDEFRecordMediaTextPlain({
 *   payload: `Device Setup Instructions:
 * 1. Power on the device
 * 2. Hold your phone near the NFC symbol
 * 3. Follow the on-screen prompts
 * 4. Wait for the green light confirmation
 *
 * For support, visit: support.example.com`,
 *   id: "setup-instructions"
 * });
 * ```
 *
 * @example Dynamic content
 * ```typescript
 * const timestamp = new Date().toISOString();
 * const statusRecord = createNDEFRecordMediaTextPlain({
 *   payload: `System Status: Online
 * Last Updated: ${timestamp}
 * Temperature: 22°C
 * Humidity: 45%`
 * });
 * ```
 *
 * @see {@link createNDEFRecordMediaTextHTML} for formatted text with HTML markup
 * @see {@link https://tools.ietf.org/html/rfc2046#section-4.1} text/plain media type specification
 */

export function createNDEFRecordMediaTextPlain<const TPayload extends string>(NDEFInfo: NDEFRecordMediaTextPlainOptions<TPayload>): NDEFRecordMediaTextPlain<TPayload> {
  return {
    tnf: 'media',
    payload: () => NDEFInfo.payload,
    safePayload: () => ({
      success: true,
      payload: NDEFInfo.payload,
      error: undefined,
    }),
    rawPayload: () => new TextEncoder().encode(NDEFInfo.payload),
    ...prepareIdForRecord(NDEFInfo.id),
    ...prepareTypeForRecord('text/plain'),
    isIdentified: true,
  }
}

/**
 * Configuration options for creating a text/html media record.
 *
 * @template TPayload - The specific string literal type of the HTML content
 */
export interface NDEFRecordMediaTextHTMLOptions<TPayload extends string> extends BaseNDEFRecordOptions<TPayload> {
}

/**
 * Creates an NDEF media record containing HTML markup (text/html).
 *
 * This function creates an NDEF record for storing formatted text with HTML markup.
 * Ideal for rich content, formatted messages, or simple web content that can be
 * displayed in web views or HTML-capable applications.
 *
 * @template TPayload - The TypeScript string literal type of the HTML content
 * @param NDEFInfo - Configuration object containing the HTML payload and optional ID
 * @returns A typed NDEF record containing the HTML content with proper media type headers
 *
 * @example Rich formatted content
 * ```typescript
 * const htmlRecord = createNDEFRecordMediaTextHTML({
 *   payload: `
 *     <h1>Product Information</h1>
 *     <p><strong>Name:</strong> Smart NFC Widget</p>
 *     <p><strong>Price:</strong> $29.99</p>
 *     <p><em>Tap to learn more!</em></p>
 *   `,
 *   id: "product-info"
 * });
 * ```
 *
 * @example Email signature
 * ```typescript
 * const signature = createNDEFRecordMediaTextHTML({
 *   payload: `
 *     <div style="font-family: Arial, sans-serif;">
 *       <h3>John Doe</h3>
 *       <p>Senior Developer<br>
 *       <a href="mailto:john@example.com">john@example.com</a><br>
 *       <a href="https://example.com">example.com</a></p>
 *     </div>
 *   `
 * });
 * ```
 */
export function createNDEFRecordMediaTextHTML<const TPayload extends string>(NDEFInfo: NDEFRecordMediaTextHTMLOptions<TPayload>): NDEFRecordMediaTextHTML<TPayload> {
  return {
    tnf: 'media',
    payload: () => NDEFInfo.payload,
    safePayload: () => ({
      success: true,
      payload: NDEFInfo.payload,
      error: undefined,
    }),
    rawPayload: () => new TextEncoder().encode(NDEFInfo.payload),
    ...prepareIdForRecord(NDEFInfo.id),
    ...prepareTypeForRecord('text/html'),
    isIdentified: true,
  }
}

/**
 * Configuration options for creating an image/png media record.
 *
 * @template TPayload - The binary data type (Uint8Array, Blob, or ArrayBuffer)
 */
export interface NDEFRecordMediaImagePNGOptions<TPayload extends BinaryLike> extends BaseNDEFRecordOptions<TPayload> {
}

/**
 * Creates an NDEF media record containing PNG image data (image/png).
 *
 * This function creates an NDEF record for storing PNG image files. The binary
 * image data is preserved exactly and can be displayed by NFC-capable applications
 * that support image rendering.
 *
 * @template TPayload - The TypeScript type of the binary image data
 * @param NDEFInfo - Configuration object containing the PNG data and optional ID
 * @returns A typed NDEF record containing the PNG image with proper media type headers
 *
 * @example Profile photo
 * ```typescript
 * const imageBytes = new Uint8Array([...]); // PNG file bytes
 * const photoRecord = createNDEFRecordMediaImagePNG({
 *   payload: imageBytes,
 *   id: "profile-photo"
 * });
 * ```
 *
 * @example Logo or branding
 * ```typescript
 * const logoBlob = new Blob([pngData], { type: 'image/png' });
 * const logoRecord = createNDEFRecordMediaImagePNG({
 *   payload: logoBlob,
 *   id: "company-logo"
 * });
 * ```
 */
export function createNDEFRecordMediaImagePNG<const TPayload extends BinaryLike>(NDEFInfo: NDEFRecordMediaImagePNGOptions<TPayload>): NDEFRecordMediaImagePNG<TPayload> {
  return {
    tnf: 'media',
    payload: () => NDEFInfo.payload,
    safePayload: () => ({
      success: true,
      payload: NDEFInfo.payload,
      error: undefined,
    }),
    rawPayload: () => binaryLikeToUint8Array(NDEFInfo.payload),
    ...prepareIdForRecord(NDEFInfo.id),
    ...prepareTypeForRecord('image/png'),
    isIdentified: true,
  }
}

/**
 * Configuration options for creating an image/jpeg media record.
 *
 * @template TPayload - The binary data type (Uint8Array, Blob, or ArrayBuffer)
 */
export interface NDEFRecordMediaImageJPEGOptions<TPayload extends BinaryLike> extends BaseNDEFRecordOptions<TPayload> {
}

/**
 * Creates an NDEF media record containing JPEG image data (image/jpeg).
 *
 * Similar to PNG records but optimized for JPEG format images. Ideal for
 * photographs and images where JPEG compression is preferred.
 *
 * @template TPayload - The TypeScript type of the binary image data
 * @param NDEFInfo - Configuration object containing the JPEG data and optional ID
 * @returns A typed NDEF record containing the JPEG image with proper media type headers
 */
export function createNDEFRecordMediaImageJPEG<const TPayload extends BinaryLike>(NDEFInfo: NDEFRecordMediaImageJPEGOptions<TPayload>): NDEFRecordMediaImageJPEG<TPayload> {
  return {
    tnf: 'media',
    payload: () => NDEFInfo.payload,
    safePayload: () => ({
      success: true,
      payload: NDEFInfo.payload,
      error: undefined,
    }),
    rawPayload: () => binaryLikeToUint8Array(NDEFInfo.payload),
    ...prepareIdForRecord(NDEFInfo.id),
    ...prepareTypeForRecord('image/jpeg'),
    isIdentified: true,
  }
}

/**
 * Configuration options for creating a video/mp4 media record.
 *
 * @template TPayload - The binary data type (Uint8Array, Blob, or ArrayBuffer)
 */
export interface NDEFRecordMediaVideoMP4Options<TPayload extends BinaryLike> extends BaseNDEFRecordOptions<TPayload> {
}

/**
 * Creates an NDEF media record containing MP4 video data (video/mp4).
 *
 * This function creates an NDEF record for storing MP4 video files. Note that
 * due to NFC tag size limitations, this is typically used for short clips or
 * references to larger video files.
 *
 * @template TPayload - The TypeScript type of the binary video data
 * @param NDEFInfo - Configuration object containing the MP4 data and optional ID
 * @returns A typed NDEF record containing the MP4 video with proper media type headers
 */
export function createNDEFRecordMediaVideoMP4<const TPayload extends BinaryLike>(NDEFInfo: NDEFRecordMediaVideoMP4Options<TPayload>): NDEFRecordMediaVideoMP4<TPayload> {
  return {
    tnf: 'media',
    payload: () => NDEFInfo.payload,
    safePayload: () => ({
      success: true,
      payload: NDEFInfo.payload,
      error: undefined,
    }),
    rawPayload: () => binaryLikeToUint8Array(NDEFInfo.payload),
    ...prepareIdForRecord(NDEFInfo.id),
    ...prepareTypeForRecord('video/mp4'),
    isIdentified: true,
  }
}

/**
 * Configuration options for creating an audio/mpeg media record.
 *
 * @template TPayload - The binary data type (Uint8Array, Blob, or ArrayBuffer)
 */
export interface NDEFRecordMediaAudioMPEGOptions<TPayload extends BinaryLike> extends BaseNDEFRecordOptions<TPayload> {
}

/**
 * Creates an NDEF media record containing MPEG audio data (audio/mpeg).
 *
 * This function creates an NDEF record for storing MPEG audio files such as
 * MP3s. Due to size constraints, typically used for short audio clips, jingles,
 * or audio signatures.
 *
 * @template TPayload - The TypeScript type of the binary audio data
 * @param NDEFInfo - Configuration object containing the MPEG data and optional ID
 * @returns A typed NDEF record containing the MPEG audio with proper media type headers
 *
 * @example Short audio message
 * ```typescript
 * const audioBytes = new Uint8Array([...]); // MP3 file bytes
 * const audioRecord = createNDEFRecordMediaAudioMPEG({
 *   payload: audioBytes,
 *   id: "welcome-message"
 * });
 * ```
 */
export function createNDEFRecordMediaAudioMPEG<const TPayload extends BinaryLike>(NDEFInfo: NDEFRecordMediaAudioMPEGOptions<TPayload>): NDEFRecordMediaAudioMPEG<TPayload> {
  return {
    tnf: 'media',
    payload: () => NDEFInfo.payload,
    safePayload: () => ({
      success: true,
      payload: NDEFInfo.payload,
      error: undefined,
    }),
    rawPayload: () => binaryLikeToUint8Array(NDEFInfo.payload),
    ...prepareIdForRecord(NDEFInfo.id),
    ...prepareTypeForRecord('audio/mpeg'),
    isIdentified: true,
  }
}
