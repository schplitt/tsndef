import type { BaseNDEFRecord } from '.'
import type { BinaryLike } from '../utils'

type SupportedMediaTypes = 'image/png'
  | 'image/jpeg'
  | 'video/mp4'
  | 'audio/mpeg'
  | 'application/json'
  | 'text/plain'
  | 'text/html'

export interface NDEFRecordMediaBase<TMediaType extends SupportedMediaTypes, TPayload> extends BaseNDEFRecord<'media', TPayload, TMediaType, true> {
}

export interface NDEFRecordMediaApplicationJson<TData extends object = object> extends NDEFRecordMediaBase<'application/json', TData> {
}

export interface NDEFRecordMediaTextPlain<TData extends string = string> extends NDEFRecordMediaBase<'text/plain', TData> {
}

export interface NDEFRecordMediaTextHTML<TData extends string = string> extends NDEFRecordMediaBase<'text/html', TData> {
}

export interface NDEFRecordMediaVideoMP4<TData extends BinaryLike = Uint8Array> extends NDEFRecordMediaBase<'video/mp4', TData> {
}

export interface NDEFRecordMediaImagePNG<TData extends BinaryLike = Uint8Array> extends NDEFRecordMediaBase<'image/png', TData> {
}

export interface NDEFRecordMediaImageJPEG<TData extends BinaryLike = Uint8Array> extends NDEFRecordMediaBase<'image/jpeg', TData> {
}

export interface NDEFRecordMediaAudioMPEG<TData extends BinaryLike = Uint8Array> extends NDEFRecordMediaBase<'audio/mpeg', TData> {
}

export type NDEFRecordMedia
  = NDEFRecordMediaApplicationJson
    | NDEFRecordMediaTextPlain
    | NDEFRecordMediaTextHTML
    | NDEFRecordMediaVideoMP4
    | NDEFRecordMediaImagePNG
    | NDEFRecordMediaImageJPEG
    | NDEFRecordMediaAudioMPEG
