import type { BaseNDEFRecord } from './types/records'
import type { TNFCode } from './types/TNF'
import { TNFLookup } from './TNF'

export interface RecordInfo {
  record: BaseNDEFRecord
  isBeginning: boolean
  isEnd: boolean
}

export async function constructBytes(infos: RecordInfo[]): Promise<Uint8Array> {
  // if there are no records, return an empty array
  if (infos.length === 0) {
    return new Uint8Array([])
  }

  const result: number[] = []

  // check if there were multiple or no records with beginning and end flags
  let hasBeginning = false
  let hasEnd = false
  let hasMultipleBeginning = false
  let hasMultipleEnd = false

  for (const info of infos) {
    if (info.isBeginning) {
      if (hasBeginning) {
        hasMultipleBeginning = true
      }
      hasBeginning = true
    }
    if (info.isEnd) {
      if (hasEnd) {
        hasMultipleEnd = true
      }
      hasEnd = true
    }

    const recordBytes = await constructBytesFromRecordInfo(info)
    result.push(...recordBytes)
  }

  // if there are multiple beginning or end flags, throw an error
  if (hasMultipleBeginning) {
    throw new Error('Multiple records with message begin flag found. Only one record can have the message begin flag.')
  }
  if (hasMultipleEnd) {
    throw new Error('Multiple records with message end flag found. Only one record can have the message end flag.')
  }
  // if there is no record with message begin flag, throw an error
  if (!hasBeginning) {
    throw new Error('No record with message begin flag found. At least one record must have the message begin flag.')
  }
  // if there is no record with message end flag, throw an error
  if (!hasEnd) {
    throw new Error('No record with message end flag found. At least one record must have the message end flag.')
  }

  // now we need to wrap the bytes in the message wrapper (TLV)
  // @see https://learn.adafruit.com/adafruit-pn532-rfid-nfc/ndef

  const messageLength = result.length
  const NDEFMessagePrefix = 0x03

  let NDEFMessageLength: Uint8Array
  if (result.length > 0xFE) {
    // when it is greater than 0xfe, we need to use a 3-byte prefix
    // first is 0xFF to indicate that the length is 3 bytes
    // now push the length of the message in the 2nd and 3rd byte
    const lengthBytes = new Uint8Array(3)
    lengthBytes[0] = 0xFF // first byte is 0x
    lengthBytes[1] = (messageLength >> 8) & 0xFF // second byte is the high byte of the length
    lengthBytes[2] = messageLength & 0xFF // third byte is
  }
  else {
    // when it is 0xfe or less, we can use a single byte
    NDEFMessageLength = new Uint8Array([messageLength])
  }

  const suffixByte = 0xFE // suffix is always 0xFE

  // now we can construct the final message
  const NDEFMessage = new Uint8Array(
    [
      NDEFMessagePrefix, // first byte is the prefix
      ...NDEFMessageLength!, // second byte is the length of the message
      ...result, // the actual record bytes
      suffixByte, // last byte is the suffix
    ],
  )

  return NDEFMessage
}

/**
 *
 * @param info
 * @see https://freemindtronic.com/wp-content/uploads/2022/02/NFC-Data-Exchange-Format-NDEF.pdf
 */
export async function constructBytesFromRecordInfo(info: RecordInfo): Promise<Uint8Array> {
  const rawPayload = await info.record.rawPayload()
  const rawType = await info.record.rawType()
  const rawId = info.record.rawId ? await info.record.rawId() : undefined

  // if payload length is greater than 2^32 - 1, throw an error
  // if type length is greater than 255, throw an error
  // if id length is greater than 255, throw an error
  if (rawPayload.length > (2 ** 32 - 1)
  ) {
    throw new TypeError('Payload length exceeds maximum allowed length of 2^32 - 1 bytes.')
  }

  if (rawType.length > 255) {
    throw new TypeError('Type length exceeds maximum allowed length of 255 bytes.')
  }

  if (rawId && rawId.length > 255) {
    throw new TypeError('ID length exceeds maximum allowed length of 255 bytes.')
  }

  const isShortRecord = rawPayload.length < 256

  const isIdPresent = !!rawId

  // Construct header bytes
  const headerBytes = constructHeaderByte({
    isBeginning: info.isBeginning,
    isEnd: info.isEnd,
    isChunked: false, // not implemented yet, always false
    isShortRecord,
    isIdPresent,
    tnfCode: TNFLookup(info.record.tnf),
  })

  const typeLengthBytes = new Uint8Array([
    rawType.length,
  ])

  // if it is a short record, the payload length is 1 byte
  // if it is a long record, the payload length is 4 bytes
  const payloadLengthBytes = isShortRecord
    ? new Uint8Array([rawPayload.length])
    : new Uint8Array([
      (rawPayload.length >> 24) & 0xFF, // first byte
      (rawPayload.length >> 16) & 0xFF, // second byte
      (rawPayload.length >> 8) & 0xFF, // third byte
      rawPayload.length & 0xFF, // fourth byte
    ])

  // if id is not present the idLengthBytes is empty
  const idLengthBytes = !isIdPresent
    ? new Uint8Array([])
  // as per spec, can only be 1 byte
    : new Uint8Array([rawId!.length])

  const typeBytes = rawType

  const idBytes = isIdPresent ? rawId! : new Uint8Array([])

  const payloadBytes = rawPayload

  // Combine all parts into a single byte array
  const result = new Uint8Array(
    headerBytes.length
    + typeLengthBytes.length
    + payloadLengthBytes.length
    + idLengthBytes.length
    + typeBytes.length
    + idBytes.length
    + payloadBytes.length,
  )

  let offset = 0
  result.set(headerBytes, offset)
  offset += headerBytes.length
  result.set(typeLengthBytes, offset)
  offset += typeLengthBytes.length
  result.set(payloadLengthBytes, offset)
  offset += payloadLengthBytes.length
  result.set(idLengthBytes, offset)
  offset += idLengthBytes.length
  result.set(typeBytes, offset)
  offset += typeBytes.length
  result.set(idBytes, offset)
  offset += idBytes.length
  result.set(payloadBytes, offset)

  return result
}

export interface HeaderBytesInfo {
  tnfCode: TNFCode
  isBeginning: boolean
  isEnd: boolean
  isIdPresent: boolean
  isShortRecord: boolean
  isChunked: false
}

export function constructHeaderByte(info: HeaderBytesInfo): Uint8Array {
  let headerByte = 0b0000_0000 // 8 bits, all set to 0

  // Set the flags

  if (info.isBeginning) {
    // Set the first bit for message begin
    headerByte |= (1 << 7)
  }

  if (info.isEnd) {
    // Set the second bit for message end
    headerByte |= (1 << 6)
  }

  // Set the 3rd bit to 1 if chunked records are supported
  if (info.isChunked) {
    // never called as isChunked is always false per the type definition
    // ! not implemented yet
    headerByte |= (1 << 5)
  }

  // set the 4th bit to 1 if the record is short
  if (info.isShortRecord) {
    headerByte |= (1 << 4)
  }

  // set 5th bit to 1 if id is present
  if (info.isIdPresent) {
    headerByte |= (1 << 3)
  }

  // set 6th, 7th, and 8th bits to the tnf bits
  headerByte |= (info.tnfCode & 0b0000_0111) << 0

  return new Uint8Array([headerByte])
}
