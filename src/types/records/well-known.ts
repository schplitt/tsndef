import type { BaseNDEFRecord } from '.'

type SupportedWellKnownTypes = 'U'

interface NDEFRecordWellKnownBase<TWellKnown extends SupportedWellKnownTypes, TPayload> extends BaseNDEFRecord<'well-known', TPayload, TWellKnown, true> {
  /**
   * The well-known record type identifier used for differentiating record types.
   *
   * | Type | Description | Purpose |
   * |------|-------------|---------|
   * | "U"  | URI Record  | For URIs/URLs, phone numbers, email addresses, etc. |
   *
   * @example
   * ```typescript
   * // Check the type to handle different record types
   * if (record.type === "U") {
   *   // Handle URI record
   *   console.log("URI:", record.payload());
   * }
   * ```
   */
  type: TWellKnown
}

export interface NDEFRecordWellKnownURI<TPayload extends string = string> extends NDEFRecordWellKnownBase<'U', TPayload> {
}

export type NDEFRecordWellKnown
    = NDEFRecordWellKnownURI
