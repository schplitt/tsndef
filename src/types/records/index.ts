import type { TNF } from '../TNF'
import type { NDEFRecordMedia } from './media'
import type { NDEFRecordWellKnown } from './well-known'

export interface NDEFRecordHeader<TTNF extends TNF = TNF> {
  /**
   * The Type Name Format (TNF) of the record.
   * Indicates the structure of the TYPE field value.
   */
  tnf: TTNF
  /**
   * Indicates if the record is the first record in a message.
   * If true, this record is the first one in the message.
   */
  messageBeginFlag: boolean
  /**
   * Indicates if the record is the last record in a message.
   * If true, this record is the last one in the message.
   */
  messageEndFlag: boolean
  /**
   * Indicates if the record is a chunked record.
   * Chunked records are used to split large payloads into smaller parts.
   * For now we will not implement chunked records and it will always be false.
   * TODO: implement
   */
  chunkFlag: false
  /**
   * Indicates if the record is a short record.
   * Short records have a payload length of 0-255 bytes.
   * Is set automatically by the library when the payload is less than 256 bytes.
   */
  shortRecordFlag: boolean
  /**
   * Indicates if the record has an ID field.
   * If true, the ID field is present and its length is specified in the ID Length field.
   */
  idLengthFlag: boolean
}

export type SafePayload<TPayload> = {
  success: true
  payload: TPayload
  error: undefined
} | {
  success: false
  payload: undefined
  error: string
}

export interface BaseNDEFRecord<TTNF extends TNF = TNF, TPayload = unknown, TType extends string = string, TIsIdentified extends boolean = boolean> {
  readonly tnf: TTNF
  /**
   * Get the payload of the record.
   *
   * Some record implementations try to parse the payload into a specific format, e.g. media records with type "application/json" will parse the payload as JSON.
   *
   * As a result the function may throw an error if the payload cannot be parsed.
   * @throws If the payload cannot be parsed.
   * @returns The payload of the record.
   */
  readonly payload: () => TPayload | Promise<TPayload>
  /**
   * Get the safe payload of the record.
   *
   * This is useful to avoid throwing errors when trying to read the payload of a record.
   * @returns SafePayload object that contains the payload if the record was successfully parsed, or an error if the parsing failed.
   */
  readonly safePayload: () => SafePayload<TPayload> | Promise<SafePayload<TPayload>>

  /**
   * Type of the record.
   * Can be used to identify the record type.
   * For example, "U" for well-known URI records, "application/json" for media application/json records, etc.
   * For "Identified" records, this is the type of the record as it is known to the library.
   */
  readonly type: TType
  readonly id: string | undefined

  /**
   * Used to be able to identify the record as a known type if tsndef is able to identify the record.
   * When it is "Identified", the record is a known type and tsndef further tries to parse the payload.
   * E.g. "Identified" well-known URI records return a string payload, while "Unidentified" records return a Uint8Array payload.
   */
  readonly isIdentified: TIsIdentified

  readonly rawPayload: () => Uint8Array | Promise<Uint8Array>
  readonly rawType: () => Uint8Array | Promise<Uint8Array>
  readonly rawId: () => Uint8Array | Promise<Uint8Array> | undefined

}

export interface BaseNDEFRecordOptions<TPayload> {
  payload: TPayload
  id?: string
}

export interface UnidentifiedNDEFRecord extends BaseNDEFRecord<TNF, Uint8Array, string, false> {}

export type NDEFRecord
  = UnidentifiedNDEFRecord
    | NDEFRecordMedia
    | NDEFRecordWellKnown
