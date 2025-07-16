import type { BaseNDEFRecord, UnidentifiedNDEFRecord } from '../types/records'
import type { TNF } from '../types/TNF'

export interface PrefixMapping {
  URIIdentifierPrefix: number
  URISuffix: string
}

/**
 * Converts a well-known URI to a prefix and suffix.
 *
 * @param URI - The URI to convert.
 * @returns An object containing the prefix and suffix of the URI.
 * @throws {TypeError} If the provided URI is not valid.
 * @see https://gist.github.com/aryounce/78ea6da97059287c156cb6155cbb42f2
 *
 * Decimal | Hex  | Protocol
 * --------|------|-----------------------------------
 * 0       | 0x00 | N/A. No prepending is done, and the URI field contains the unabridged URI.
 * 1       | 0x01 | http://www.
 * 2       | 0x02 | https://www.
 * 3       | 0x03 | http://
 * 4       | 0x04 | https://
 * 5       | 0x05 | tel:
 * 6       | 0x06 | mailto:
 * 7       | 0x07 | ftp://anonymous:anonymous@
 * 8       | 0x08 | ftp://ftp.
 * 9       | 0x09 | ftps://
 * 10      | 0x0A | sftp://
 * 11      | 0x0B | smb://
 * 12      | 0x0C | nfs://
 * 13      | 0x0D | ftp://
 * 14      | 0x0E | dav://
 * 15      | 0x0F | news:
 * 16      | 0x10 | telnet://
 * 17      | 0x11 | imap:
 * 18      | 0x12 | rtsp://
 * 19      | 0x13 | urn:
 * 20      | 0x14 | pop:
 * 21      | 0x15 | sip:
 * 22      | 0x16 | sips:
 * 23      | 0x17 | tftp:
 * 24      | 0x18 | btspp://
 * 25      | 0x19 | btl2cap://
 * 26      | 0x1A | btgoep://
 * 27      | 0x1B | tcpobex://
 * 28      | 0x1C | irdaobex://
 * 29      | 0x1D | file://
 * 30      | 0x1E | urn:epc:id:
 * 31      | 0x1F | urn:epc:tag:
 * 32      | 0x20 | urn:epc:pat:
 * 33      | 0x21 | urn:epc:raw:
 * 34      | 0x22 | urn:epc:
 * 35      | 0x23 | urn:nfc:
 * 36…255 | 0x24..0xFF | RFU
 */
export function getWellKnownURIPrefixMapping(URI: string): PrefixMapping {
  // check if URI is a valid URI
  if (!URL.canParse(URI)) {
    throw new TypeError('Provided URI is not a valid URI')
  }

  // check if URI starts with a well-known prefix
  // https://gist.github.com/aryounce/78ea6da97059287c156cb6155cbb42f2
  switch (true) {
    case URI.startsWith('http://www.'):
      return { URIIdentifierPrefix: 0x01, URISuffix: URI.replace('http://www.', '') }
    case URI.startsWith('https://www.'):
      return { URIIdentifierPrefix: 0x02, URISuffix: URI.replace('https://www.', '') }
    case URI.startsWith('http://'):
      return { URIIdentifierPrefix: 0x03, URISuffix: URI.replace('http://', '') }
    case URI.startsWith('https://'):
      return { URIIdentifierPrefix: 0x04, URISuffix: URI.replace('https://', '') }
    case URI.startsWith('tel:'):
      return { URIIdentifierPrefix: 0x05, URISuffix: URI.replace('tel:', '') }
    case URI.startsWith('mailto:'):
      return { URIIdentifierPrefix: 0x06, URISuffix: URI.replace('mailto:', '') }
    case URI.startsWith('ftp://anonymous:anonymous@'):
      return { URIIdentifierPrefix: 0x07, URISuffix: URI.replace('ftp://anonymous:anonymous@', '') }
    case URI.startsWith('ftp://ftp.'):
      return { URIIdentifierPrefix: 0x08, URISuffix: URI.replace('ftp://ftp.', '') }
    case URI.startsWith('ftps://'):
      return { URIIdentifierPrefix: 0x09, URISuffix: URI.replace('ftps://', '') }
    case URI.startsWith('sftp://'):
      return { URIIdentifierPrefix: 0x0A, URISuffix: URI.replace('sftp://', '') }
    case URI.startsWith('smb://'):
      return { URIIdentifierPrefix: 0x0B, URISuffix: URI.replace('smb://', '') }
    case URI.startsWith('nfs://'):
      return { URIIdentifierPrefix: 0x0C, URISuffix: URI.replace('nfs://', '') }
    case URI.startsWith('ftp://'):
      return { URIIdentifierPrefix: 0x0D, URISuffix: URI.replace('ftp://', '') }
    case URI.startsWith('dav://'):
      return { URIIdentifierPrefix: 0x0E, URISuffix: URI.replace('dav://', '') }
    case URI.startsWith('news:'):
      return { URIIdentifierPrefix: 0x0F, URISuffix: URI.replace('news:', '') }
    case URI.startsWith('telnet://'):
      return { URIIdentifierPrefix: 0x10, URISuffix: URI.replace('telnet://', '') }
    case URI.startsWith('imap:'):
      return { URIIdentifierPrefix: 0x11, URISuffix: URI.replace('imap:', '') }
    case URI.startsWith('rtsp://'):
      return { URIIdentifierPrefix: 0x12, URISuffix: URI.replace('rtsp://', '') }
    case URI.startsWith('urn:'):
      return { URIIdentifierPrefix: 0x13, URISuffix: URI.replace('urn:', '') }
    case URI.startsWith('pop:'):
      return { URIIdentifierPrefix: 0x14, URISuffix: URI.replace('pop:', '') }
    case URI.startsWith('sip:'):
      return { URIIdentifierPrefix: 0x15, URISuffix: URI.replace('sip:', '') }
    case URI.startsWith('sips:'):
      return { URIIdentifierPrefix: 0x16, URISuffix: URI.replace('sips:', '') }
    case URI.startsWith('tftp:'):
      return { URIIdentifierPrefix: 0x17, URISuffix: URI.replace('tftp:', '') }
    case URI.startsWith('btspp://'):
      return { URIIdentifierPrefix: 0x18, URISuffix: URI.replace('btspp://', '') }
    case URI.startsWith('btl2cap://'):
      return { URIIdentifierPrefix: 0x19, URISuffix: URI.replace('btl2cap://', '') }
    case URI.startsWith('btgoep://'):
      return { URIIdentifierPrefix: 0x1A, URISuffix: URI.replace('btgoep://', '') }
    case URI.startsWith('tcpobex://'):
      return { URIIdentifierPrefix: 0x1B, URISuffix: URI.replace('tcpobex://', '') }
    case URI.startsWith('irdaobex://'):
      return { URIIdentifierPrefix: 0x1C, URISuffix: URI.replace('irdaobex://', '') }
    case URI.startsWith('file://'):
      return { URIIdentifierPrefix: 0x1D, URISuffix: URI.replace('file://', '') }
    case URI.startsWith('urn:epc:id:'):
      return { URIIdentifierPrefix: 0x1E, URISuffix: URI.replace('urn:epc:id:', '') }
    case URI.startsWith('urn:epc:tag:'):
      return { URIIdentifierPrefix: 0x1F, URISuffix: URI.replace('urn:epc:tag:', '') }
    case URI.startsWith('urn:epc:pat:'):
      return { URIIdentifierPrefix: 0x20, URISuffix: URI.replace('urn:epc:pat:', '') }
    case URI.startsWith('urn:epc:raw:'):
      return { URIIdentifierPrefix: 0x21, URISuffix: URI.replace('urn:epc:raw:', '') }
    case URI.startsWith('urn:epc:'):
      return { URIIdentifierPrefix: 0x22, URISuffix: URI.replace('urn:epc:', '') }
    case URI.startsWith('urn:nfc:'):
      return { URIIdentifierPrefix: 0x23, URISuffix: URI.replace('urn:nfc:', '') }
    default:
      // if no prefix is found, return the URI as is with 0x00 prefix
      return { URIIdentifierPrefix: 0x00, URISuffix: URI }
  }
}

export function prepareIdForRecord(id?: string): Pick<BaseNDEFRecord, 'id' | 'rawId'> {
  // if id is not present, return an empty object
  if (typeof id !== 'string') {
    return {
      id,
      rawId: () => undefined,
    }
  }

  // if id is present, return it as a function that returns the id
  return {
    id,
    rawId: () => new TextEncoder().encode(id),
  }
}

export function prepareTypeForRecord<const TType extends string>(type: TType) {
  // if type is present, return it as a function that returns the type
  return {
    type,
    rawType: () => new TextEncoder().encode(type),
  } as {
    type: TType
    rawType: () => Uint8Array
  }
}

/**
 * Reconstruct full URI from prefix code and suffix (for parsing)
 * @throws {TypeError} If the provided prefix code is not valid.
 */
export function reconstructURIFromPrefix(prefixCode: number, suffix: string): string {
  const prefixMappings: Record<number, string> = {
    0x00: '',
    0x01: 'http://www.',
    0x02: 'https://www.',
    0x03: 'http://',
    0x04: 'https://',
    0x05: 'tel:',
    0x06: 'mailto:',
    0x07: 'ftp://anonymous:anonymous@',
    0x08: 'ftp://ftp.',
    0x09: 'ftps://',
    0x0A: 'sftp://',
    0x0B: 'smb://',
    0x0C: 'nfs://',
    0x0D: 'ftp://',
    0x0E: 'dav://',
    0x0F: 'news:',
    0x10: 'telnet://',
    0x11: 'imap:',
    0x12: 'rtsp://',
    0x13: 'urn:',
    0x14: 'pop:',
    0x15: 'sip:',
    0x16: 'sips:',
    0x17: 'tftp:',
    0x18: 'btspp://',
    0x19: 'btl2cap://',
    0x1A: 'btgoep://',
    0x1B: 'tcpobex://',
    0x1C: 'irdaobex://',
    0x1D: 'file://',
    0x1E: 'urn:epc:id:',
    0x1F: 'urn:epc:tag:',
    0x20: 'urn:epc:pat:',
    0x21: 'urn:epc:raw:',
    0x22: 'urn:epc:',
    0x23: 'urn:nfc:',
  }

  if (!(prefixCode in prefixMappings)) {
    throw new TypeError(`Invalid prefix code: ${prefixCode}`)
  }

  const prefix = prefixMappings[prefixCode]!
  return prefix + suffix
}

/**
 * Create an unidentified NDEF record for unknown types (for parsing)
 */
export function createUnidentifiedRecord(tnf: TNF, type: string, rawPayload: Uint8Array, id?: string): UnidentifiedNDEFRecord {
  return {
    tnf,
    payload: () => rawPayload,
    safePayload: () => ({
      success: true,
      payload: rawPayload,
      error: undefined,
    }),
    rawPayload: () => rawPayload,
    type,
    rawType: () => new TextEncoder().encode(type),
    id,
    rawId: id ? () => new TextEncoder().encode(id) : () => undefined,
    isIdentified: false,
  }
}
