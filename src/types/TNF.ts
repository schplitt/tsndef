/**
 * TNF (Type Name Format) field values that indicate the structure of the TYPE field value.
 *
 * @see {@link https://freemindtronic.com/wp-content/uploads/2022/02/NFC-Data-Exchange-Format-NDEF.pdf NFC Data Exchange Format (NDEF) Specification}
 */
export type TNF = keyof TNFLookupMapping

export type TNFCode = TNFLookupMapping[keyof TNFLookupMapping]

export interface TNFLookupMapping {
  'empty': 0x00
  'well-known': 0x01
  'media': 0x02
  'absolute-uri': 0x03
  'forum-external': 0x04
  'unknown': 0x05
  'unchanged': 0x06
  'reserved': 0x07
}

export interface ReverseTNFLookupMapping {
  0x00: 'empty'
  0x01: 'well-known'
  0x02: 'media'
  0x03: 'absolute-uri'
  0x04: 'forum-external'
  0x05: 'unknown'
  0x06: 'unchanged'
  0x07: 'reserved'
}
