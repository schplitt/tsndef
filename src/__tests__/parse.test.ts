import { describe, expect, it } from 'vitest'
import { NDEFMessage } from '../message'
import { parseNDEFMessage, safeParseNDEFMessage, stripLeadingTrailingZeros, validateAndStripTLV } from '../parse/index'
import {
  createNDEFRecordMediaApplicationJson,
  createNDEFRecordMediaAudioMPEG,
  createNDEFRecordMediaImageJPEG,
  createNDEFRecordMediaImagePNG,
  createNDEFRecordMediaTextHTML,
  createNDEFRecordMediaTextPlain,
  createNDEFRecordMediaVideoMP4,
} from '../records/media'
import { createNDEFRecordWellKnownURI } from '../records/wellKnown'

describe('validateAndStripTLV', () => {
  it('should validate and strip TLV from a simple short-length message', () => {
    // Create a simple TLV: [0x03, 0x05, 0x01, 0x02, 0x03, 0x04, 0x05, 0xFE]
    // Type: 0x03, Length: 0x05 (5 bytes), Value: [0x01, 0x02, 0x03, 0x04, 0x05], Terminator: 0xFE
    const input = new Uint8Array([0x03, 0x05, 0x01, 0x02, 0x03, 0x04, 0x05, 0xFE])
    const result = validateAndStripTLV(input)

    expect(result).toBeInstanceOf(Uint8Array)
    expect(result).toEqual(new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05]))
  })

  it('should validate and strip TLV from a message with zero-length payload', () => {
    // Minimum valid TLV: [0x03, 0x00, 0xFE]
    const input = new Uint8Array([0x03, 0x00, 0xFE])
    const result = validateAndStripTLV(input)

    expect(result).toBeInstanceOf(Uint8Array)
    expect(result).toEqual(new Uint8Array([]))
    expect(result.length).toBe(0)
  })

  it('should validate and strip TLV from a long-length message', () => {
    // Create a TLV with long length format: [0x03, 0xFF, 0x01, 0x00, ...256 bytes..., 0xFE]
    const payloadSize = 256
    const payload = new Uint8Array(payloadSize).fill(0xAA) // Fill with 0xAA for testing
    const input = new Uint8Array([
      0x03, // Type
      0xFF, // Long length indicator
      (payloadSize >> 8) & 0xFF, // High byte of length
      payloadSize & 0xFF, // Low byte of length
      ...payload, // Payload
      0xFE, // Terminator
    ])

    const result = validateAndStripTLV(input)

    expect(result).toBeInstanceOf(Uint8Array)
    expect(result).toEqual(payload)
    expect(result.length).toBe(payloadSize)
  })

  it('should validate and strip TLV from a real NDEF message created with URI record', async () => {
    // Create a real NDEF message and test TLV parsing
    const message = new NDEFMessage().add(createNDEFRecordWellKnownURI({
      payload: 'https://example.com',
    }))

    const messageBytes = await message.toBytes()
    const result = validateAndStripTLV(messageBytes)

    expect(result).toBeInstanceOf(Uint8Array)
    // The result should be the NDEF records without TLV wrapper
    expect(result.length).toBeGreaterThan(0)
    // First byte should be the NDEF record header
    expect(result[0]).toBeDefined()
  })

  it('should validate and strip TLV from a real NDEF message created with JSON record', async () => {
    // Create a real NDEF message with JSON payload
    const message = new NDEFMessage().add(createNDEFRecordMediaApplicationJson({
      payload: { test: 'data', number: 42 },
    }))

    const messageBytes = await message.toBytes()
    const result = validateAndStripTLV(messageBytes)

    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBeGreaterThan(0)
  })

  it('should throw error for insufficient data', () => {
    const input = new Uint8Array([0x03, 0x05]) // Missing payload and terminator

    expect(() => validateAndStripTLV(input)).toThrow('TLV structure is malformed: not enough data')
  })

  it('should throw error for empty input', () => {
    const input = new Uint8Array([])

    expect(() => validateAndStripTLV(input)).toThrow('TLV structure is malformed: not enough data')
  })

  it('should throw error for single byte input', () => {
    const input = new Uint8Array([0x03])

    expect(() => validateAndStripTLV(input)).toThrow('TLV structure is malformed: not enough data')
  })

  it('should throw error when first byte is not 0x03', () => {
    const input = new Uint8Array([0x04, 0x05, 0x01, 0x02, 0x03, 0x04, 0x05, 0xFE])

    expect(() => validateAndStripTLV(input)).toThrow('TLV structure is malformed: first byte is not 0x03')
  })

  it('should throw error when last byte is not 0xFE', () => {
    const input = new Uint8Array([0x03, 0x05, 0x01, 0x02, 0x03, 0x04, 0x05, 0xFF])

    expect(() => validateAndStripTLV(input)).toThrow('TLV structure is malformed: last byte is not 0xFE')
  })

  it('should throw error when length doesn\'t match actual data (short length)', () => {
    // Length says 10 bytes but only 5 bytes provided
    const input = new Uint8Array([0x03, 0x0A, 0x01, 0x02, 0x03, 0x04, 0x05, 0xFE])

    expect(() => validateAndStripTLV(input)).toThrow('TLV structure is malformed: expected total length 13, got 8')
  })

  it('should throw error when length doesn\'t match actual data (long length)', () => {
    // Length says 5 bytes but more bytes provided
    const input = new Uint8Array([0x03, 0xFF, 0x00, 0x05, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0xFE])

    expect(() => validateAndStripTLV(input)).toThrow('TLV structure is malformed: expected total length 10, got 12')
  })

  it('should throw error for malformed long length format (missing length bytes)', () => {
    const input = new Uint8Array([0x03, 0xFF, 0x01, 0xFE]) // Missing second length byte

    expect(() => validateAndStripTLV(input)).toThrow('TLV structure is malformed: long length format requires at least 5 bytes')
  })

  it('should handle maximum short length (254 bytes)', () => {
    const payloadSize = 254
    const payload = new Uint8Array(payloadSize)
    for (let i = 0; i < payloadSize; i++) {
      payload[i] = i % 256
    }

    const input = new Uint8Array([0x03, payloadSize, ...payload, 0xFE])
    const result = validateAndStripTLV(input)

    expect(result).toEqual(payload)
    expect(result.length).toBe(payloadSize)
  })

  it('should handle large long length message', () => {
    const payloadSize = 1000
    const payload = new Uint8Array(payloadSize).fill(0x42)

    const input = new Uint8Array([
      0x03, // Type
      0xFF, // Long length indicator
      (payloadSize >> 8) & 0xFF, // High byte
      payloadSize & 0xFF, // Low byte
      ...payload, // Payload
      0xFE, // Terminator
    ])

    const result = validateAndStripTLV(input)

    expect(result).toEqual(payload)
    expect(result.length).toBe(payloadSize)
  })

  it('should work correctly after stripping leading/trailing zeros', () => {
    // Create input with leading and trailing zeros
    const coreData = new Uint8Array([0x03, 0x03, 0xAA, 0xBB, 0xCC, 0xFE])
    const inputWithZeros = new Uint8Array([0x00, 0x00, ...coreData, 0x00, 0x00])

    // First strip zeros, then validate TLV
    const strippedData = stripLeadingTrailingZeros(inputWithZeros)
    const result = validateAndStripTLV(strippedData)

    expect(result).toEqual(new Uint8Array([0xAA, 0xBB, 0xCC]))
  })

  it('should work with complex real NDEF message with multiple records', async () => {
    // Create a message with multiple records
    const message = new NDEFMessage()
      .add(createNDEFRecordWellKnownURI({ payload: 'https://example.com' }))
      .add(createNDEFRecordMediaApplicationJson({ payload: { key: 'value' } }))

    const messageBytes = await message.toBytes()
    const result = validateAndStripTLV(messageBytes)

    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBeGreaterThan(0)

    // Should start with NDEF record header (should have MB flag set)
    const firstByte = result[0]!
    const mbFlag = (firstByte & 0x80) !== 0 // Check MB (Message Begin) flag
    expect(mbFlag).toBe(true)
  })
})

describe('parseNDEFMessage', () => {
  it('should parse a simple URI record', async () => {
    // Create a message with a URI record
    const originalMessage = new NDEFMessage().add(createNDEFRecordWellKnownURI({
      payload: 'https://example.com',
    }))

    const messageBytes = await originalMessage.toBytes()
    const parsedMessage = parseNDEFMessage(messageBytes)

    expect(parsedMessage.records).toHaveLength(1)
    expect(parsedMessage.records[0]!.tnf).toBe('well-known')
    expect(parsedMessage.records[0]!.type).toBe('U')
    expect(parsedMessage.records[0]!.payload()).toBe('https://example.com')
    expect(parsedMessage.records[0]!.isIdentified).toBe(true)
  })

  it('should parse a JSON media record', async () => {
    const testData = { test: 'data', number: 42, nested: { key: 'value' } }
    const originalMessage = new NDEFMessage().add(createNDEFRecordMediaApplicationJson({
      payload: testData,
    }))

    const messageBytes = await originalMessage.toBytes()
    const parsedMessage = parseNDEFMessage(messageBytes)

    expect(parsedMessage.records).toHaveLength(1)
    expect(parsedMessage.records[0]!.tnf).toBe('media')
    expect(parsedMessage.records[0]!.type).toBe('application/json')
    expect(parsedMessage.records[0]!.payload()).toEqual(testData)
    expect(parsedMessage.records[0]!.isIdentified).toBe(true)
  })

  it('should parse a text/plain media record', async () => {
    const testText = 'Hello, World! This is a test message.'
    const originalMessage = new NDEFMessage().add(createNDEFRecordMediaTextPlain({
      payload: testText,
    }))

    const messageBytes = await originalMessage.toBytes()
    const parsedMessage = parseNDEFMessage(messageBytes)

    expect(parsedMessage.records).toHaveLength(1)
    expect(parsedMessage.records[0]!.tnf).toBe('media')
    expect(parsedMessage.records[0]!.type).toBe('text/plain')
    expect(parsedMessage.records[0]!.payload()).toBe(testText)
    expect(parsedMessage.records[0]!.isIdentified).toBe(true)
  })

  it('should parse a text/html media record', async () => {
    const testHtml = '<html><body><h1>Test</h1><p>Hello World</p></body></html>'
    const originalMessage = new NDEFMessage().add(createNDEFRecordMediaTextHTML({
      payload: testHtml,
    }))

    const messageBytes = await originalMessage.toBytes()
    const parsedMessage = parseNDEFMessage(messageBytes)

    expect(parsedMessage.records).toHaveLength(1)
    expect(parsedMessage.records[0]!.tnf).toBe('media')
    expect(parsedMessage.records[0]!.type).toBe('text/html')
    expect(parsedMessage.records[0]!.payload()).toBe(testHtml)
    expect(parsedMessage.records[0]!.isIdentified).toBe(true)
  })

  it('should parse binary media records (PNG image)', async () => {
    // Create a fake PNG header for testing
    const pngHeader = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
    const originalMessage = new NDEFMessage().add(createNDEFRecordMediaImagePNG({
      payload: pngHeader,
    }))

    const messageBytes = await originalMessage.toBytes()
    const parsedMessage = parseNDEFMessage(messageBytes)

    expect(parsedMessage.records).toHaveLength(1)
    expect(parsedMessage.records[0]!.tnf).toBe('media')
    expect(parsedMessage.records[0]!.type).toBe('image/png')
    expect(parsedMessage.records[0]!.payload()).toEqual(pngHeader)
    expect(parsedMessage.records[0]!.isIdentified).toBe(true)
  })

  it('should parse binary media records (JPEG image)', async () => {
    // Create a fake JPEG header for testing
    const jpegHeader = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46])
    const originalMessage = new NDEFMessage().add(createNDEFRecordMediaImageJPEG({
      payload: jpegHeader,
    }))

    const messageBytes = await originalMessage.toBytes()
    const parsedMessage = parseNDEFMessage(messageBytes)

    expect(parsedMessage.records).toHaveLength(1)
    expect(parsedMessage.records[0]!.tnf).toBe('media')
    expect(parsedMessage.records[0]!.type).toBe('image/jpeg')
    expect(parsedMessage.records[0]!.payload()).toEqual(jpegHeader)
    expect(parsedMessage.records[0]!.isIdentified).toBe(true)
  })

  it('should parse binary media records (MP4 video)', async () => {
    // Create a fake MP4 header for testing
    const mp4Header = new Uint8Array([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6F, 0x6D])
    const originalMessage = new NDEFMessage().add(createNDEFRecordMediaVideoMP4({
      payload: mp4Header,
    }))

    const messageBytes = await originalMessage.toBytes()
    const parsedMessage = parseNDEFMessage(messageBytes)

    expect(parsedMessage.records).toHaveLength(1)
    expect(parsedMessage.records[0]!.tnf).toBe('media')
    expect(parsedMessage.records[0]!.type).toBe('video/mp4')
    expect(parsedMessage.records[0]!.payload()).toEqual(mp4Header)
    expect(parsedMessage.records[0]!.isIdentified).toBe(true)
  })

  it('should parse binary media records (MPEG audio)', async () => {
    // Create a fake MPEG header for testing
    const mpegHeader = new Uint8Array([0xFF, 0xFB, 0x90, 0x00, 0x00, 0x00, 0x00, 0x00])
    const originalMessage = new NDEFMessage().add(createNDEFRecordMediaAudioMPEG({
      payload: mpegHeader,
    }))

    const messageBytes = await originalMessage.toBytes()
    const parsedMessage = parseNDEFMessage(messageBytes)

    expect(parsedMessage.records).toHaveLength(1)
    expect(parsedMessage.records[0]!.tnf).toBe('media')
    expect(parsedMessage.records[0]!.type).toBe('audio/mpeg')
    expect(parsedMessage.records[0]!.payload()).toEqual(mpegHeader)
    expect(parsedMessage.records[0]!.isIdentified).toBe(true)
  })

  it('should parse multiple records in a message', async () => {
    const originalMessage = new NDEFMessage()
      .add(createNDEFRecordWellKnownURI({ payload: 'https://example.com' }))
      .add(createNDEFRecordMediaApplicationJson({ payload: { key: 'value' } }))
      .add(createNDEFRecordMediaTextPlain({ payload: 'Hello World' }))

    const messageBytes = await originalMessage.toBytes()
    const parsedMessage = parseNDEFMessage(messageBytes)

    expect(parsedMessage.records).toHaveLength(3)

    // Check first record (URI)
    expect(parsedMessage.records[0]!.tnf).toBe('well-known')
    expect(parsedMessage.records[0]!.type).toBe('U')
    expect(parsedMessage.records[0]!.payload()).toBe('https://example.com')

    // Check second record (JSON)
    expect(parsedMessage.records[1]!.tnf).toBe('media')
    expect(parsedMessage.records[1]!.type).toBe('application/json')
    expect(parsedMessage.records[1]!.payload()).toEqual({ key: 'value' })

    // Check third record (text/plain)
    expect(parsedMessage.records[2]!.tnf).toBe('media')
    expect(parsedMessage.records[2]!.type).toBe('text/plain')
    expect(parsedMessage.records[2]!.payload()).toBe('Hello World')
  })

  it('should handle records with IDs', async () => {
    const originalMessage = new NDEFMessage().add(createNDEFRecordWellKnownURI({
      payload: 'https://example.com',
      id: 'test-id',
    }))

    const messageBytes = await originalMessage.toBytes()
    const parsedMessage = parseNDEFMessage(messageBytes)

    expect(parsedMessage.records).toHaveLength(1)
    expect(parsedMessage.records[0]!.id).toBe('test-id')
  })

  it('should handle unknown media types as unidentified records', async () => {
    // Create a manual NDEF message with an unknown media type
    const unknownTypeBytes = new TextEncoder().encode('application/unknown')
    const payloadBytes = new TextEncoder().encode('unknown data')

    // Manually construct the NDEF record bytes
    const recordBytes = new Uint8Array([
      0xD2, // Header: MB=1, ME=1, CF=0, SR=1, IL=0, TNF=010 (media)
      unknownTypeBytes.length, // Type length
      payloadBytes.length, // Payload length
      ...unknownTypeBytes, // Type
      ...payloadBytes, // Payload
    ])

    // Wrap in TLV
    const messageBytes = new Uint8Array([
      0x03, // TLV type
      recordBytes.length, // TLV length
      ...recordBytes, // TLV value
      0xFE, // TLV terminator
    ])

    const parsedMessage = parseNDEFMessage(messageBytes)

    expect(parsedMessage.records).toHaveLength(1)
    expect(parsedMessage.records[0]!.tnf).toBe('media')
    expect(parsedMessage.records[0]!.type).toBe('application/unknown')
    expect(parsedMessage.records[0]!.isIdentified).toBe(false)
    expect(parsedMessage.records[0]!.payload()).toEqual(payloadBytes)
  })

  it('should handle malformed JSON gracefully with safePayload', async () => {
    // Create a manual NDEF message with malformed JSON
    const jsonTypeBytes = new TextEncoder().encode('application/json')
    const malformedJsonBytes = new TextEncoder().encode('{"invalid": json}')

    // Manually construct the NDEF record bytes
    const recordBytes = new Uint8Array([
      0xD2, // Header: MB=1, ME=1, CF=0, SR=1, IL=0, TNF=010 (media)
      jsonTypeBytes.length, // Type length
      malformedJsonBytes.length, // Payload length
      ...jsonTypeBytes, // Type
      ...malformedJsonBytes, // Payload
    ])

    // Wrap in TLV
    const messageBytes = new Uint8Array([
      0x03, // TLV type
      recordBytes.length, // TLV length
      ...recordBytes, // TLV value
      0xFE, // TLV terminator
    ])

    const parsedMessage = parseNDEFMessage(messageBytes)

    expect(parsedMessage.records).toHaveLength(1)
    expect(parsedMessage.records[0]!.type).toBe('application/json')

    // Should throw when trying to get payload
    expect(() => parsedMessage.records[0]!.payload()).toThrow()

    // Should return error with safePayload
    const safeResult = await parsedMessage.records[0]!.safePayload()
    expect(safeResult.success).toBe(false)
    expect(safeResult.error).toBeDefined()
  })

  it('should handle empty message', () => {
    const emptyTLV = new Uint8Array([0x03, 0x00, 0xFE])
    const parsedMessage = parseNDEFMessage(emptyTLV)

    expect(parsedMessage.records).toHaveLength(0)
  })

  it('should handle different URI prefixes correctly', async () => {
    const testUris = [
      'http://example.com',
      'https://example.com',
      'mailto:test@example.com',
      'tel:+1234567890',
      'ftp://ftp.example.com',
    ]

    const msg = new NDEFMessage()

    for (const uri of testUris) {
      msg.add(createNDEFRecordWellKnownURI({
        payload: uri,
      }))
    }

    // assure that msg has the length of 5
    expect(msg.records).toHaveLength(testUris.length)

    const messageBytes = await msg.toBytes()
    const parsedMessage = parseNDEFMessage(messageBytes)
    expect(parsedMessage.records).toHaveLength(testUris.length)

    for (let i = 0; i < testUris.length; i++) {
      expect(parsedMessage.records[i]!.tnf).toBe('well-known')
      expect(parsedMessage.records[i]!.type).toBe('U')
      expect(parsedMessage.records[i]!.payload()).toBe(testUris[i])
      expect(parsedMessage.records[i]!.isIdentified).toBe(true)
    }
  })
})

describe('safeParseNDEFMessage', () => {
  it('should return success for valid message', async () => {
    const originalMessage = new NDEFMessage().add(createNDEFRecordWellKnownURI({
      payload: 'https://example.com',
    }))

    const messageBytes = await originalMessage.toBytes()
    const result = safeParseNDEFMessage(messageBytes)

    expect(result.success).toBe(true)
    expect(result.message).toBeDefined()
    expect(result.error).toBeUndefined()
    expect(result.message!.records).toHaveLength(1)
  })

  it('should return error for invalid message', () => {
    const invalidBytes = new Uint8Array([0x04, 0x05, 0x01, 0x02, 0x03])
    const result = safeParseNDEFMessage(invalidBytes)

    expect(result.success).toBe(false)
    expect(result.message).toBeUndefined()
    expect(result.error).toBeDefined()
    expect(result.error).toContain('TLV structure is malformed')
  })

  it('should return error for truncated message', () => {
    const truncatedBytes = new Uint8Array([0x03, 0x10, 0x01, 0x02]) // Says 16 bytes but only has 2
    const result = safeParseNDEFMessage(truncatedBytes)

    expect(result.success).toBe(false)
    expect(result.message).toBeUndefined()
    expect(result.error).toBeDefined()
  })
})

describe('parseNDEFMessage JSDoc Examples', () => {
  it('should work with basic URI parsing example', async () => {
    // @example Basic URI parsing
    // Create some test bytes first
    const originalMessage = new NDEFMessage()
      .add(createNDEFRecordWellKnownURI({ payload: 'https://example.com' }))
      .add(createNDEFRecordMediaTextPlain({ payload: 'Some text' }))

    const nfcBytes = await originalMessage.toBytes()
    const message = parseNDEFMessage(nfcBytes)

    let foundURI = false
    for (const record of message.records) {
      if (record.tnf === 'well-known' && record.type === 'U') {
        foundURI = true
        expect(await record.payload()).toBe('https://example.com') // Automatically reconstructed full URI
      }
    }
    expect(foundURI).toBe(true)
  })

  it('should work with handling multiple record types example', async () => {
    // @example Handling multiple record types
    const originalMessage = new NDEFMessage()
      .add(createNDEFRecordWellKnownURI({ payload: 'https://example.com' }))
      .add(createNDEFRecordMediaApplicationJson({ payload: { test: 'data' } }))
      .add(createNDEFRecordMediaTextPlain({ payload: 'Plain text' }))

    const complexNdefBytes = await originalMessage.toBytes()
    const message = parseNDEFMessage(complexNdefBytes)

    const loggedMessages: string[] = []
    const loggedData: unknown[] = []

    message.records.forEach(async (record, index) => {
      loggedMessages.push(`Record ${index}: ${record.tnf}/${record.type}`)

      switch (record.tnf) {
        case 'well-known':
          if (record.type === 'U') {
            loggedData.push(await record.payload())
          }
          break

        case 'media':
          if (record.type === 'application/json') {
            loggedData.push(await record.payload())
          }
          else if (record.type === 'text/plain') {
            loggedData.push(await record.payload())
          }
          break

        default:
          // Handle unidentified records
          break
      }
    })

    expect(loggedMessages).toContain('Record 0: well-known/U')
    expect(loggedMessages).toContain('Record 1: media/application/json')
    expect(loggedMessages).toContain('Record 2: media/text/plain')

    // Test the data separately since async operations in forEach are tricky
    expect(await message.records[0]?.payload()).toBe('https://example.com')
    expect(await message.records[1]?.payload()).toEqual({ test: 'data' })
    expect(await message.records[2]?.payload()).toBe('Plain text')
  })

  it('should work with error handling example', () => {
    // @example Error handling
    const suspiciousBytes = new Uint8Array([0x04, 0x05, 0x01, 0x02]) // Invalid TLV

    let caughtError = false
    let errorMessage = ''

    try {
      parseNDEFMessage(suspiciousBytes)
    }
    catch (error) {
      caughtError = true
      errorMessage = error instanceof Error ? error.message : String(error)
    }

    expect(caughtError).toBe(true)
    expect(errorMessage).toContain('TLV structure is malformed')
  })
})

describe('safeParseNDEFMessage JSDoc Examples', () => {
  it('should work with basic safe parsing example', async () => {
    // @example Basic safe parsing
    const originalMessage = new NDEFMessage()
      .add(createNDEFRecordWellKnownURI({ payload: 'https://example.com' }))
      .add(createNDEFRecordMediaTextPlain({ payload: 'Test message' }))

    const nfcBytes = await originalMessage.toBytes()
    const result = safeParseNDEFMessage(nfcBytes)

    if (result.success) {
      // TypeScript knows result.message is defined and result.error is undefined
      expect(result.message).toBeDefined()
      expect(result.error).toBeUndefined()
      expect(result.message.records.length).toBe(2)

      for (const record of result.message.records) {
        expect(record.tnf).toBeDefined()
        expect(record.type).toBeDefined()
        expect(record.isIdentified).toBe(true)
      }
    }
    else {
      // This shouldn't happen with valid data
      expect(result.success).toBe(true)
    }
  })

  it('should work with safe parsing error handling example', () => {
    // @example Basic safe parsing with error
    const invalidBytes = new Uint8Array([0x04, 0x05, 0x01, 0x02]) // Invalid TLV
    const result = safeParseNDEFMessage(invalidBytes)

    if (result.success) {
      // This shouldn't happen with invalid data
      expect(result.success).toBe(false)
    }
    else {
      // TypeScript knows result.error is defined and result.message is undefined
      expect(result.error).toBeDefined()
      expect(result.message).toBeUndefined()
      expect(result.error).toContain('TLV structure is malformed')
    }
  })

  it('should work with functional error handling example', async () => {
    // @example Functional error handling
    const processNdefData = (bytes: Uint8Array) => {
      const result = safeParseNDEFMessage(bytes)
      if (result.success) {
        return result.message.records.map(record => ({
          type: `${record.tnf}/${record.type}`,
          identified: record.isIdentified,
          hasId: !!record.id,
        }))
      }
      else {
        throw new Error(`NDEF parsing failed: ${result.error}`)
      }
    }

    // Test with valid data
    const validMessage = new NDEFMessage()
      .add(createNDEFRecordWellKnownURI({ payload: 'https://example.com', id: 'uri-record' }))
      .add(createNDEFRecordMediaTextPlain({ payload: 'Test' }))

    const validBytes = await validMessage.toBytes()
    const processedData = processNdefData(validBytes)

    expect(processedData).toHaveLength(2)
    expect(processedData[0]).toEqual({
      type: 'well-known/U',
      identified: true,
      hasId: true,
    })
    expect(processedData[1]).toEqual({
      type: 'media/text/plain',
      identified: true,
      hasId: false,
    })

    // Test with invalid data
    const invalidBytes = new Uint8Array([0x04, 0x05, 0x01, 0x02])
    expect(() => processNdefData(invalidBytes)).toThrow('NDEF parsing failed:')
  })
})
