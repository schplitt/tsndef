import type { BinaryLike } from '../types/utils'

export async function binaryLikeToUint8Array(data: BinaryLike): Promise<Uint8Array> {
  if (data instanceof Uint8Array) {
    return data
  }
  else if (data instanceof Blob) {
    return new Uint8Array(await data.arrayBuffer())
  }
  else if (data instanceof ArrayBuffer) {
    return new Uint8Array(data)
  }
  throw new TypeError('Unsupported binary-like type')
}
