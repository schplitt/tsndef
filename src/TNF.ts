import type { ReverseTNFLookupMapping, TNF, TNFCode, TNFLookupMapping } from './types/TNF'

const tnfLookup: TNFLookupMapping = {
  'empty': 0x00,
  'well-known': 0x01,
  'media': 0x02,
  'absolute-uri': 0x03,
  'forum-external': 0x04,
  'unknown': 0x05,
  'unchanged': 0x06,
  'reserved': 0x07,
}

/**
 * Looks up the TNF code for a given TNF type.
 * @param tnf The TNF type to look up.
 * @returns The corresponding TNF code.
 * @throws {TypeError} If the TNF type is not recognized.
 */
export function TNFLookup<TTNF extends TNF>(tnf: TTNF): TNFLookupMapping[TTNF] {
  if (tnf in tnfLookup) {
    return tnfLookup[tnf]
  }
  throw new TypeError(`Unknown TNF: ${tnf}`)
}

// now i also need the reverse lookup
const reverseTnfLookup: ReverseTNFLookupMapping = {
  0x00: 'empty',
  0x01: 'well-known',
  0x02: 'media',
  0x03: 'absolute-uri',
  0x04: 'forum-external',
  0x05: 'unknown',
  0x06: 'unchanged',
  0x07: 'reserved',
}

/**
 * Looks up the TNF type for a given TNF code.
 * @param tnfCode The TNF code to look up.
 * @returns The corresponding TNF type.
 * @throws {TypeError} If the TNF code is not recognized.
 */
export function TNFCodeLookup<TTNF extends TNFCode>(tnfCode: TTNF): ReverseTNFLookupMapping[TTNF] {
  if (tnfCode in reverseTnfLookup) {
    return reverseTnfLookup[tnfCode]
  }
  throw new TypeError(`Unknown TNF code: ${tnfCode}`)
}
