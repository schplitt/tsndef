import type { HeaderBytesInfo } from '../bytes'
import { describe, expect, it } from 'vitest'
import { constructBytesFromRecordInfo, constructHeaderByte } from '../bytes'
import { createNDEFRecordWellKnownURI } from '../records/wellKnown'

function formatAsBinaryString(byte: number | undefined): string {
  if (typeof byte === 'undefined') {
    throw new TypeError('Byte value is undefined')
  }
  return `0b${byte.toString(2).padStart(8, '0')}`
}

describe('constructHeaderByte', () => {
  it('should construct header bytes correctly when all flags are set', () => {
    const info: HeaderBytesInfo = {
      isBeginning: true,
      isEnd: true,
      isChunked: false,
      isShortRecord: true,
      isIdPresent: true,
      tnfCode: 0x01,
    }
    const headerByte = constructHeaderByte(info)
    expect(formatAsBinaryString(headerByte[0])).toBe(formatAsBinaryString(0b1101_1001)) // TNF + flags
  })

  it('should construct header bytes correctly when isBeginning is true', () => {
    const info: HeaderBytesInfo = {
      isBeginning: true,
      isEnd: false,
      isChunked: false,
      isShortRecord: true,
      isIdPresent: true,
      tnfCode: 0x01,
    }
    const headerByte = constructHeaderByte(info)
    expect(formatAsBinaryString(headerByte[0])).toBe(formatAsBinaryString(0b1001_1001)) // TNF + flags
  })

  it('should construct header bytes correctly when isEnd is true', () => {
    const info: HeaderBytesInfo = {
      isBeginning: false,
      isEnd: true,
      isChunked: false,
      isShortRecord: false,
      isIdPresent: true,
      tnfCode: 0x04,
    }
    const headerByte = constructHeaderByte(info)
    expect(formatAsBinaryString(headerByte[0])).toBe(formatAsBinaryString(0b0100_1100)) // TNF + flags
  })

  it('should construct header bytes correctly when neither isBeginning nor isEnd is set', () => {
    const info: HeaderBytesInfo = {
      isBeginning: false,
      isEnd: false,
      isIdPresent: false,
      tnfCode: 0x07,
      isChunked: false,
      isShortRecord: true,
    }
    const headerByte = constructHeaderByte(info)
    expect(formatAsBinaryString(headerByte[0])).toBe(formatAsBinaryString(0b0001_0111)) // TNF + flags
  })

  it('should construct header bytes correctly when isIdPresent is false', () => {
    const info: HeaderBytesInfo = {
      isBeginning: true,
      isEnd: false,
      isChunked: false,
      isShortRecord: false,
      isIdPresent: false,
      tnfCode: 0x02,
    }
    const headerByte = constructHeaderByte(info)
    expect(formatAsBinaryString(headerByte[0])).toBe(formatAsBinaryString(0b1000_0010)) // TNF + flags
  })
})

describe('constructBytesFromRecordInfo', () => {
  it('should construct bytes from record info', async () => {
    const record = createNDEFRecordWellKnownURI({
      payload: 'http://www.nfc.com',
    })

    const bytes = await constructBytesFromRecordInfo({
      record,
      isBeginning: true,
      isEnd: true,
    })

    expect(bytes).toBeInstanceOf(Uint8Array)
    // taken from spec example
    expect(bytes).toEqual(new Uint8Array([
      0xD1, // SR = 1, TNF = 0x01 (NFC Forum Well KnownType), ME=1, MB=1
      0x01, // Length of the Record Type (1 byte)
      0x08, // Length of the payload (8 bytes)
      0x55, // The URI record type (“U”)
      0x01, // URI identifier (“http://www.”)
      0x6E, //
      0x66, //
      0x63, // The string “nfc.com” in UTF-8.
      0x2E, //
      0x63, //
      0x6F, //
      0x6D, //
    ]))
  })
})
