import type { NDEFRecord, NDEFRecordHeader } from '../types/records'
import type { TNF } from '../types/TNF'
import { NDEFMessage } from '../message'
import {
  createNDEFRecordMediaApplicationJsonFromBytes,
  createNDEFRecordMediaAudioMPEGFromBytes,
  createNDEFRecordMediaImageJPEGFromBytes,
  createNDEFRecordMediaImagePNGFromBytes,
  createNDEFRecordMediaTextHTMLFromBytes,
  createNDEFRecordMediaTextPlainFromBytes,
  createNDEFRecordMediaVideoMP4FromBytes,
} from '../records/mediaFromBytes'
import { createNDEFRecordWellKnownURIFromBytes } from '../records/wellKnownFromBytes'
import { TNFCodeLookup } from '../TNF'
import { createUnidentifiedRecord } from '../utils/record'

// Task: Implement a function that parses a Uint8Array containing a full NDEF Message
//       and returns a parsed structure of NDEF Records.

// 1. Expect the Uint8Array to start with TLV blocks. The NDEF message starts at:
//    - Type field = 0x03 (NDEF message TLV tag)
//    - Length field:
//       - If byte < 0xFF: next byte is the length
//       - If byte == 0xFF: next 2 bytes are a 16-bit big-endian length
//    - Value = the actual NDEF message

// 2. Once TLV is parsed, iterate over the NDEF message bytes:
//    - Each record has a header byte with bit flags:
//       MB (Message Begin): bit 7
//       ME (Message End):   bit 6
//       CF (Chunk Flag):    bit 5 (skip for now)
//       SR (Short Record):  bit 4
//       IL (ID Length):     bit 3
//       TNF (Type Name Format): bits 0–2 (3 bits)

// 3. After header byte, expect fields in this order:
//    - TYPE_LENGTH (1 byte)
//    - PAYLOAD_LENGTH:
//       - 1 byte if SR=1
//       - 4 bytes if SR=0 (big-endian)
//    - [ID_LENGTH (1 byte)] if IL=1
//    - TYPE (TYPE_LENGTH bytes)
//    - [ID (ID_LENGTH bytes)] if IL=1
//    - PAYLOAD (PAYLOAD_LENGTH bytes)

// 4. Repeat until MB and ME wrap the full message. Stop at ME or end of NDEF segment.

// Output: return a structure with if the records are known or not

/**
 * Parses a Uint8Array containing a complete NDEF message into a structured NDEFMessage object.
 *
 * This function handles the complete NDEF parsing pipeline:
 * 1. Strips leading/trailing zero bytes as per NDEF specification
 * 2. Validates and extracts the TLV (Type-Length-Value) structure
 * 3. Parses individual NDEF records with proper header decoding
 * 4. Automatically identifies and types known record formats
 * 5. Returns unknown record types as unidentified records
 *
 * The parser supports all standard TNF (Type Name Format) values and automatically
 * reconstructs high-level data from binary representations (e.g., full URIs from
 * prefix-encoded well-known URI records, parsed JSON from media records).
 *
 * @param data - Raw NDEF message bytes, typically read from an NFC tag or received via NFC communication
 *
 * @returns A typed NDEFMessage containing the parsed records with proper type information
 *
 * @throws {Error} When the NDEF message structure is malformed, including:
 *   - Invalid TLV structure (wrong type, length mismatches, missing terminator)
 *   - Malformed record headers or field lengths
 *   - Truncated data or unexpected end of message
 *   - Invalid TNF (Type Name Format) values
 *
 * @example Basic URI parsing
 * ```typescript
 * const nfcBytes = new Uint8Array([...]); // Raw bytes from NFC tag
 * const message = parseNDEFMessage(nfcBytes);
 *
 * for (const record of message.records) {
 *   if (record.tnf === 'well-known' && record.type === 'U') {
 *     console.log('Found URI:', record.payload()); // Automatically reconstructed full URI
 *   }
 * }
 * ```
 *
 * @example Handling multiple record types
 * ```typescript
 * const message = parseNDEFMessage(complexNdefBytes);
 *
 * message.records.forEach((record, index) => {
 *   console.log(`Record ${index}: ${record.tnf}/${record.type}`);
 *
 *   switch (record.tnf) {
 *     case 'well-known':
 *       if (record.type === 'U') {
 *         console.log('URI:', record.payload());
 *       }
 *       break;
 *
 *     case 'media':
 *       if (record.type === 'application/json') {
 *         console.log('JSON data:', record.payload());
 *       } else if (record.type === 'text/plain') {
 *         console.log('Text:', record.payload());
 *       }
 *       break;
 *
 *     default:
 *       console.log('Unidentified record:', record.isIdentified);
 *       console.log('Raw payload:', record.rawPayload());
 *   }
 * });
 * ```
 *
 * @example Error handling
 * ```typescript
 * try {
 *   const message = parseNDEFMessage(suspiciousBytes);
 *   console.log('Successfully parsed', message.records.length, 'records');
 * } catch (error) {
 *   if (error.message.includes('TLV structure is malformed')) {
 *     console.error('Invalid NDEF format:', error.message);
 *   } else if (error.message.includes('Unexpected end of data')) {
 *     console.error('Truncated NDEF message:', error.message);
 *   } else {
 *     console.error('Parsing failed:', error.message);
 *   }
 * }
 * ```
 *
 * @see {@link safeParseNDEFMessage} for a non-throwing alternative
 * @see {@link NDEFMessage} for details on the returned message structure
 * @see {@link https://nfc-forum.org/our-work/specification-releases/specifications/nfc-forum-technical-specifications/} NFC Forum NDEF specifications
 */
export function parseNDEFMessage(data: Uint8Array): NDEFMessage<NDEFRecord[]> {
  // Idea is that we return some kind of object and check if we can "identify" the record
  // and then type the record to the known types
  // otherwise return a "base" record as there, everything is possible

  // as per spec we first have to ignore all 0x00 bytes at the start of the message
  // until we find the first non-zero byte

  // if the first non-zero byte is not 0x03, we throw an error
  // then we need the range of the NDEF message, which is the first byte (or 3 bytes) which specifies the length of the NDEF message
  // then we can start with the first NDEF record

  // to make it easier we first strip all leading and trailing 0x00 bytes
  data = stripLeadingTrailingZeros(data)

  // if there is no data left after stripping, we return an empty NDEFMessage
  if (data.length === 0) {
    return new NDEFMessage([])
  }

  // now we check the tlv
  data = validateAndStripTLV(data)

  if (data.length === 0) {
    // if the data is empty after stripping, we return an empty array
    return new NDEFMessage()
  }

  // from this point on we parse the NDEF messages or rather the individual records
  const records: NDEFRecord[] = []
  let offset = 0

  while (offset < data.length) {
    const recordResult = parseNDEFRecord(data, offset)
    records.push(recordResult.record)
    offset = recordResult.nextOffset

    // Check if this was the last record (ME flag set)
    if (recordResult.isMessageEnd) {
      break
    }
  }

  return new NDEFMessage(records)
}

/**
 * Safely parses a Uint8Array containing an NDEF message without throwing exceptions.
 *
 * This function provides the same parsing capabilities as {@link parseNDEFMessage} but
 * wraps the operation in error handling, returning a discriminated union result type
 * instead of throwing exceptions. This makes it ideal for scenarios where you want
 * to handle parsing failures gracefully without try/catch blocks.
 *
 * The function handles all the same parsing steps as parseNDEFMessage:
 * - TLV structure validation and extraction
 * - Individual record parsing with type identification
 * - Automatic payload reconstruction for known record types
 * - Comprehensive error reporting for malformed data
 *
 * @param data - Raw NDEF message bytes to parse
 *
 * @returns A discriminated union result object:
 *   - On success: `{ success: true, message: NDEFMessage, error: undefined }`
 *   - On failure: `{ success: false, message: undefined, error: string }`
 *
 * @example Basic safe parsing
 * ```typescript
 * const result = safeParseNDEFMessage(nfcBytes);
 *
 * if (result.success) {
 *   // TypeScript knows result.message is defined and result.error is undefined
 *   console.log('Parsed successfully!');
 *   console.log('Records found:', result.message.records.length);
 *
 *   result.message.records.forEach(record => {
 *     console.log(`${record.tnf}/${record.type}: ${record.isIdentified ? 'identified' : 'unidentified'}`);
 *   });
 * } else {
 *   // TypeScript knows result.error is defined and result.message is undefined
 *   console.warn('Parsing failed:', result.error);
 *
 *   // Handle specific error types
 *   if (result.error.includes('TLV structure is malformed')) {
 *     console.log('Data does not appear to be valid NDEF format');
 *   } else if (result.error.includes('Unexpected end of data')) {
 *     console.log('NDEF message appears to be truncated');
 *   }
 * }
 * ```
 *
 * @example Functional error handling
 * ```typescript
 * const processNdefData = (bytes: Uint8Array) => {
 *   return safeParseNDEFMessage(bytes)
 *     .then(result => {
 *       if (result.success) {
 *         return result.message.records.map(record => ({
 *           type: `${record.tnf}/${record.type}`,
 *           identified: record.isIdentified,
 *           hasId: !!record.id
 *         }));
 *       } else {
 *         throw new Error(`NDEF parsing failed: ${result.error}`);
 *       }
 *     });
 * };
 * ```
 *
 * @example Integration with UI error handling
 * ```typescript
 * const handleNfcScan = async (nfcData: Uint8Array) => {
 *   const parseResult = safeParseNDEFMessage(nfcData);
 *
 *   if (parseResult.success) {
 *     setNdefMessage(parseResult.message);
 *     setError(null);
 *     showSuccessNotification(`Found ${parseResult.message.records.length} records`);
 *   } else {
 *     setNdefMessage(null);
 *     setError(parseResult.error);
 *     showErrorNotification('Failed to read NFC tag');
 *   }
 * };
 * ```
 *
 * @see {@link parseNDEFMessage} for the throwing version with detailed error information
 * @see {@link NDEFMessage} for details on the returned message structure when parsing succeeds
 */
export function safeParseNDEFMessage(data: Uint8Array): { success: boolean, message: NDEFMessage<NDEFRecord[]>, error?: undefined } | { success: false, message?: undefined, error: string } {
  try {
    const message = parseNDEFMessage(data)
    return {
      success: true,
      message,
      error: undefined,
    }
  }
  catch (error) {
    return {
      success: false,
      message: undefined,
      error: error instanceof Error ? error.message : 'Unknown error during NDEF message parsing',
    }
  }
}

export function stripLeadingTrailingZeros(data: Uint8Array): Uint8Array {
  let start = 0
  let end = data.length

  // Find the first non-zero byte
  while (start < end && data[start] === 0x00) {
    start++
  }

  // Find the last non-zero byte
  while (end > start && data[end - 1] === 0x00) {
    end--
  }

  // Return the sliced array without leading and trailing zeros
  return data.slice(start, end)
}

/**
 * Parses a TLV (Type-Length-Value) structure from a Uint8Array. Expects all leading and trailing 0x00 bytes to be stripped.
 *
 * This function extracts the length and value from the TLV structure.
 *
 * @param data - The Uint8Array containing the TLV data.
 * @returns A Uint8Array containing the value extracted from the TLV structure, excluding the TLV header and footer.
 * @throws {Error} If the TLV structure is malformed or cannot be parsed.
 */
export function validateAndStripTLV(data: Uint8Array): Uint8Array {
  // first check if it is atleast 3 bytes long.
  // -> 0x03, 0x00, 0xFE
  if (data.length < 3) {
    throw new Error('TLV structure is malformed: not enough data')
  }

  // check if the first byte is 0x03
  if (data[0] !== 0x03) {
    throw new Error('TLV structure is malformed: first byte is not 0x03')
  }

  // check if the last byte is 0xFE
  if (data[data.length - 1] !== 0xFE) {
    throw new Error('TLV structure is malformed: last byte is not 0xFE')
  }

  // Determine length format and parse the length field
  let length: number
  let headerSize: number // Size of TLV header (type + length fields)

  if (data[1]! < 0xFF) {
    // Short length format: 0x03 + 1 byte length
    length = data[1]!
    headerSize = 2 // 0x03 + length byte
  }
  else if (data[1] === 0xFF) {
    // Long length format: 0x03 + 0xFF + 2 bytes length
    if (data.length < 5) {
      throw new Error('TLV structure is malformed: long length format requires at least 5 bytes')
    }
    length = (data[2]! << 8) | data[3]!
    headerSize = 4 // 0x03 + 0xFF + 2 length bytes
  }
  else {
    throw new Error('TLV structure is malformed: invalid length field format')
  }

  // Validate the length field consistency
  const expectedTotalLength = headerSize + length + 1 // header + payload + 0xFE trailer

  if (data.length !== expectedTotalLength) {
    throw new Error(`TLV structure is malformed: expected total length ${expectedTotalLength}, got ${data.length}`)
  }

  // Handle empty NDEF message cases
  if (length === 0) {
    return new Uint8Array(0) // empty NDEF message
  }

  // Additional validation for edge cases
  if (data.length === 4) {
    throw new Error('TLV structure is malformed: length field must be 1 or 3 bytes')
  }

  // Extract the value (payload) from the TLV structure
  const value = data.slice(headerSize, data.length - 1) // remove the TLV header and footer (0xFE)

  return value
}

/**
 * Result of parsing a single NDEF record
 */
interface ParsedNDEFRecordResult {
  record: NDEFRecord
  nextOffset: number
  isMessageEnd: boolean
}

/**
 * Parse a single NDEF record from the data starting at the given offset
 */
function parseNDEFRecord(data: Uint8Array, offset: number): ParsedNDEFRecordResult {
  if (offset >= data.length) {
    throw new Error('Unexpected end of data while parsing NDEF record')
  }

  // Parse header byte
  const header = parseNDEFRecordHeader(data[offset]!)
  offset++

  // Parse TYPE_LENGTH (1 byte)
  if (offset >= data.length) {
    throw new Error('Unexpected end of data while reading TYPE_LENGTH')
  }
  const typeLength = data[offset]!
  offset++

  // Parse PAYLOAD_LENGTH (1 byte if SR=1, 4 bytes if SR=0)
  let payloadLength: number
  if (header.shortRecordFlag) {
    if (offset >= data.length) {
      throw new Error('Unexpected end of data while reading PAYLOAD_LENGTH (short record)')
    }
    payloadLength = data[offset]!
    offset++
  }
  else {
    if (offset + 4 > data.length) {
      throw new Error('Unexpected end of data while reading PAYLOAD_LENGTH (long record)')
    }
    payloadLength = (data[offset]! << 24) | (data[offset + 1]! << 16) | (data[offset + 2]! << 8) | data[offset + 3]!
    offset += 4
  }

  // Parse ID_LENGTH (1 byte if IL=1)
  let idLength = 0
  if (header.idLengthFlag) {
    if (offset >= data.length) {
      throw new Error('Unexpected end of data while reading ID_LENGTH')
    }
    idLength = data[offset]!
    offset++
  }

  // Parse TYPE (TYPE_LENGTH bytes)
  if (offset + typeLength > data.length) {
    throw new Error('Unexpected end of data while reading TYPE')
  }
  const rawType = data.slice(offset, offset + typeLength)
  offset += typeLength

  // Parse ID (ID_LENGTH bytes if IL=1)
  let rawId: Uint8Array | undefined
  if (header.idLengthFlag) {
    if (offset + idLength > data.length) {
      throw new Error('Unexpected end of data while reading ID')
    }
    rawId = data.slice(offset, offset + idLength)
    offset += idLength
  }

  // Parse PAYLOAD (PAYLOAD_LENGTH bytes)
  if (offset + payloadLength > data.length) {
    throw new Error('Unexpected end of data while reading PAYLOAD')
  }
  const rawPayload = data.slice(offset, offset + payloadLength)
  offset += payloadLength

  // Create the record based on TNF and type
  const record = createNDEFRecordFromRawData(header.tnf, rawType, rawPayload, rawId)

  return {
    record,
    nextOffset: offset,
    isMessageEnd: header.messageEndFlag,
  }
}

/**
 * Parse the header byte of an NDEF record
 */
function parseNDEFRecordHeader(headerByte: number): NDEFRecordHeader {
  const chunkFlag = (headerByte & 0x20) !== 0 // bit 5
  // ensure that chunkflag is false as it is currently not supported

  if (chunkFlag) {
    throw new Error('Chunked records are not supported yet')
  }

  return {
    messageBeginFlag: (headerByte & 0x80) !== 0, // bit 7
    messageEndFlag: (headerByte & 0x40) !== 0, // bit 6
    chunkFlag: false, // bit 5
    shortRecordFlag: (headerByte & 0x10) !== 0, // bit 4
    idLengthFlag: (headerByte & 0x08) !== 0, // bit 3
    tnf: TNFCodeLookup((headerByte & 0x07) as any), // bits 0-2
  }
}

/**
 * Create an NDEF record from raw parsed data
 */
function createNDEFRecordFromRawData(
  tnf: TNF,
  rawType: Uint8Array,
  rawPayload: Uint8Array,
  rawId?: Uint8Array,
): NDEFRecord {
  const typeString = new TextDecoder().decode(rawType)
  const id = rawId ? new TextDecoder().decode(rawId) : undefined

  // Try to create specific record types based on TNF and type
  if (tnf === 'well-known') {
    return createWellKnownRecord(typeString, rawPayload, id)
  }
  else if (tnf === 'media') {
    return createMediaRecord(typeString, rawPayload, id)
  }
  else {
    // For unknown TNF or unsupported types, create an unidentified record
    return createUnidentifiedRecord(tnf, typeString, rawPayload, id)
  }
}

/**
 * Create a well-known NDEF record
 */
function createWellKnownRecord(type: string, rawPayload: Uint8Array, id?: string): NDEFRecord {
  if (type === 'U') {
    return createNDEFRecordWellKnownURIFromBytes(rawPayload, id)
  }
  else {
    // Unknown well-known type
    return createUnidentifiedRecord('well-known', type, rawPayload, id)
  }
}

/**
 * Create a media NDEF record
 */
function createMediaRecord(type: string, rawPayload: Uint8Array, id?: string): NDEFRecord {
  if (type === 'application/json') {
    return createNDEFRecordMediaApplicationJsonFromBytes(rawPayload, id)
  }
  else if (type === 'text/plain') {
    return createNDEFRecordMediaTextPlainFromBytes(rawPayload, id)
  }
  else if (type === 'text/html') {
    return createNDEFRecordMediaTextHTMLFromBytes(rawPayload, id)
  }
  else if (type === 'image/png') {
    return createNDEFRecordMediaImagePNGFromBytes(rawPayload, id)
  }
  else if (type === 'image/jpeg') {
    return createNDEFRecordMediaImageJPEGFromBytes(rawPayload, id)
  }
  else if (type === 'video/mp4') {
    return createNDEFRecordMediaVideoMP4FromBytes(rawPayload, id)
  }
  else if (type === 'audio/mpeg') {
    return createNDEFRecordMediaAudioMPEGFromBytes(rawPayload, id)
  }
  else {
    // Unknown media type, create unidentified record
    return createUnidentifiedRecord('media', type, rawPayload, id)
  }
}
