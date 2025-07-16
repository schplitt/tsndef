/* eslint-disable test/prefer-lowercase-title */
import { describe, expect, it } from 'vitest'
import { NDEFMessage } from '../message'
import { parseNDEFMessage } from '../parse/index'
import { createNDEFRecordMediaApplicationJson, createNDEFRecordMediaTextPlain } from '../records/media'
import { createNDEFRecordWellKnownURI } from '../records/wellKnown'

describe('Message.toBytes', () => {
  it('should correctly construct a message with a URI record', async () => {
    const message = new NDEFMessage().add(createNDEFRecordWellKnownURI({
      payload: 'https://github.com/schplitt/tsndef',
    }))
    const bytes = await message.toBytes()
    expect(bytes).toBeInstanceOf(Uint8Array)
    expect(bytes).toEqual(new Uint8Array([3, 31, 209, 1, 27, 85, 4, 103, 105, 116, 104, 117, 98, 46, 99, 111, 109, 47, 115, 99, 104, 112, 108, 105, 116, 116, 47, 116, 115, 110, 100, 101, 102, 254]))
  })

  it('should correctly construct a message with a json message', async () => {
    const message = new NDEFMessage().add(createNDEFRecordMediaApplicationJson({
      payload: {
        hello: 'world',
      },
    }))
    const bytes = await message.toBytes()
    expect(bytes).toBeInstanceOf(Uint8Array)
    expect(bytes).toEqual(new Uint8Array([3, 36, 210, 16, 17, 97, 112, 112, 108, 105, 99, 97, 116, 105, 111, 110, 47, 106, 115, 111, 110, 123, 34, 104, 101, 108, 108, 111, 34, 58, 34, 119, 111, 114, 108, 100, 34, 125, 254]))
  })
})

describe('NDEFMessage JSDoc Examples', () => {
  it('should work with basic message creation and manipulation example', async () => {
    // @example Basic message creation and manipulation
    // Create an empty message
    const message = new NDEFMessage()

    // Add records with type-safe chaining
    const typedMessage = message
      .add(createNDEFRecordWellKnownURI({ payload: 'https://example.com' }))
      .add(createNDEFRecordMediaApplicationJson({ payload: { hello: 'world' } }))

    // TypeScript knows the exact types of records
    const uriRecord = typedMessage.records[0] // Type: NDEFRecordWellKnownURI
    const jsonRecord = typedMessage.records[1] // Type: NDEFRecordMediaApplicationJson

    expect(uriRecord.tnf).toBe('well-known')
    expect(uriRecord.type).toBe('U')
    expect(await uriRecord.payload()).toBe('https://example.com')

    expect(jsonRecord.tnf).toBe('media')
    expect(jsonRecord.type).toBe('application/json')
    expect(await jsonRecord.payload()).toEqual({ hello: 'world' })
  })

  it('should work with creating from existing records example', async () => {
    // @example Creating from existing records
    const records = [
      createNDEFRecordWellKnownURI({ payload: 'mailto:test@example.com' }),
      createNDEFRecordMediaTextPlain({ payload: 'Contact information' }),
    ]

    const message = new NDEFMessage(records)
    expect(message.length).toBe(2)

    expect(await message.records[0]?.payload()).toBe('mailto:test@example.com')
    expect(await message.records[1]?.payload()).toBe('Contact information')
  })

  it('should work with binary serialization for NFC transmission example', async () => {
    // @example Binary serialization for NFC transmission
    const message = new NDEFMessage()
      .add(createNDEFRecordWellKnownURI({ payload: 'https://example.com/product/123' }))
      .add(createNDEFRecordMediaApplicationJson({
        payload: { productId: 123, name: 'Example Product' },
      }))

    // Convert to bytes for NFC tag writing or transmission
    const bytes = await message.toBytes()

    expect(bytes).toBeInstanceOf(Uint8Array)
    expect(bytes.length).toBeGreaterThan(0)

    // Verify we can parse it back
    const parsedMessage = parseNDEFMessage(bytes)
    expect(parsedMessage.records).toHaveLength(2)
    expect(await parsedMessage.records[0]?.payload()).toBe('https://example.com/product/123')
    expect(await parsedMessage.records[1]?.payload()).toEqual({ productId: 123, name: 'Example Product' })
  })

  it('should work with dynamic record management example', async () => {
    // @example Dynamic record management
    const message = new NDEFMessage()
      .add(createNDEFRecordWellKnownURI({ payload: 'https://example.com' }))
      .add(createNDEFRecordMediaTextPlain({ payload: 'Description' }))

    expect(message.length).toBe(2)

    // Remove records while maintaining type safety
    const messageAfterRemoveHead = message.removeHead() // Removes first record (URI)
    expect(messageAfterRemoveHead.length).toBe(1)
    expect(await messageAfterRemoveHead.records[0]?.payload()).toBe('Description')

    const messageAfterRemoveTail = message.removeTail() // Removes last record (text)
    expect(messageAfterRemoveTail.length).toBe(0)

    // Add new records
    const emptyMessage = new NDEFMessage()
    const messageWithNewRecord = emptyMessage.addHead(createNDEFRecordMediaApplicationJson({
      payload: { timestamp: Date.now() },
    }))
    expect(messageWithNewRecord.length).toBe(1)
    expect(messageWithNewRecord.records[0]?.tnf).toBe('media')
    expect(messageWithNewRecord.records[0]?.type).toBe('application/json')
    const payload = await messageWithNewRecord.records[0]?.payload()
    expect(typeof payload?.timestamp).toBe('number')
  })
})
