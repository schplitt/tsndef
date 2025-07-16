import type { BaseNDEFRecordOptions } from '../types/records'
import type { NDEFRecordWellKnownURI } from '../types/records/well-known'
import { getWellKnownURIPrefixMapping, prepareIdForRecord, prepareTypeForRecord } from '../utils/record'

export interface NDEFRecordURIOptions<TPayload extends string> extends BaseNDEFRecordOptions<TPayload> {
}

/**
 * Create a Well-Known URI NDEF Record.
 * Supported URI prefixes are automatically recognized and correctly prepared for encoding.
 * Supports URIs with the following prefixes:
 * - N/A. No prepending is done, and the URI field contains the unabridged URI.
 * - http://www.
 * - https://www.
 * - http://
 * - https://
 * - tel:
 * - mailto:
 * - ftp://anonymous:anonymous@
 * - ftp://ftp.
 * - ftps://
 * - sftp://
 * - smb://
 * - nfs://
 * - ftp://
 * - dav://
 * - news:
 * - telnet://
 * - imap:
 * - rtsp://
 * - urn:
 * - pop:
 * - sip:
 * - sips:
 * - tftp:
 * - btspp://
 * - btl2cap://
 * - btgoep://
 * - tcpobex://
 * - irdaobex://
 * - file://
 * - urn:epc:id:
 * - urn:epc:tag:
 * - urn:epc:pat:
 * - urn:epc:raw:
 * - urn:epc:
 * - urn:nfc:
 *
 * @param NDEFInfo
 * @returns NDEFRecordWellKnownURI with the provided payload
 */
export function createNDEFRecordWellKnownURI<const TPayload extends string>(NDEFInfo: NDEFRecordURIOptions<TPayload>): NDEFRecordWellKnownURI<TPayload> {
  const { URIIdentifierPrefix, URISuffix } = getWellKnownURIPrefixMapping(NDEFInfo.payload)

  return {
    tnf: 'well-known',
    payload: () => NDEFInfo.payload,
    safePayload: () => ({
      success: true,
      payload: NDEFInfo.payload,
      error: undefined,
    }),
    rawPayload: () => {
      return new Uint8Array([
        URIIdentifierPrefix,
        ...new TextEncoder().encode(URISuffix),
      ])
    },
    ...prepareIdForRecord(NDEFInfo.id),
    ...prepareTypeForRecord('U'),
    isIdentified: true,
  }
}
