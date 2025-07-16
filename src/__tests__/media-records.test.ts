import { describe, expect, it } from 'vitest'
import {
  createNDEFRecordMediaApplicationJson,
  createNDEFRecordMediaAudioMPEG,
  createNDEFRecordMediaImageJPEG,
  createNDEFRecordMediaImagePNG,
  createNDEFRecordMediaTextHTML,
  createNDEFRecordMediaTextPlain,
  createNDEFRecordMediaVideoMP4,
} from '../records/media'

// Type definitions for examples
interface UserProfile {
  id: number
  name: string
  preferences: {
    theme: 'light' | 'dark'
    notifications: boolean
  }
  tags: string[]
}

interface ApiResponse {
  status: 'success' | 'error'
  data: unknown
  metadata: {
    requestId: string
    timestamp: number
  }
}

describe('media Records JSDoc Examples', () => {
  describe('createNDEFRecordMediaApplicationJson', () => {
    it('should work with basic JSON data example', async () => {
      // @example Basic JSON data
      const record = createNDEFRecordMediaApplicationJson({
        payload: {
          message: 'Hello, NFC!',
          timestamp: Date.now(),
          version: '1.0',
        },
      })

      // Access the original object (type-safe)
      const data = await record.payload()
      expect(data.message).toBe('Hello, NFC!')
      expect(typeof data.timestamp).toBe('number')
      expect(data.version).toBe('1.0')

      expect(record.tnf).toBe('media')
      expect(record.type).toBe('application/json')
      expect(record.isIdentified).toBe(true)
    })

    it('should work with complex nested objects example', async () => {
      // @example Complex nested objects
      const userRecord = createNDEFRecordMediaApplicationJson<UserProfile>({
        payload: {
          id: 12345,
          name: 'Alice Johnson',
          preferences: {
            theme: 'dark',
            notifications: true,
          },
          tags: ['developer', 'nfc-enthusiast'],
        },
        id: 'user-profile',
      })

      // TypeScript provides full type safety
      const user = await userRecord.payload()
      const theme: 'light' | 'dark' = user.preferences.theme // Type-safe access
      expect(theme).toBe('dark')
      expect(user.id).toBe(12345)
      expect(user.name).toBe('Alice Johnson')
      expect(user.preferences.notifications).toBe(true)
      expect(user.tags).toEqual(['developer', 'nfc-enthusiast'])
      expect(userRecord.id).toBe('user-profile')
    })

    it('should work with API response sharing example', async () => {
      // @example API response sharing
      const apiRecord = createNDEFRecordMediaApplicationJson<ApiResponse>({
        payload: {
          status: 'success',
          data: { result: 'Data retrieved successfully' },
          metadata: {
            requestId: 'req_abc123',
            timestamp: Date.now(),
          },
        },
      })

      const response = await apiRecord.payload()
      expect(response.status).toBe('success')
      expect(response.data).toEqual({ result: 'Data retrieved successfully' })
      expect(response.metadata.requestId).toBe('req_abc123')
      expect(typeof response.metadata.timestamp).toBe('number')
    })
  })

  describe('createNDEFRecordMediaTextPlain', () => {
    it('should work with simple text message example', async () => {
      // @example Simple text message
      const record = createNDEFRecordMediaTextPlain({
        payload: 'Hello, NFC World! This is a plain text message.',
      })

      expect(record.tnf).toBe('media')
      expect(record.type).toBe('text/plain')
      expect(await record.payload()).toBe('Hello, NFC World! This is a plain text message.')
      expect(record.isIdentified).toBe(true)
    })

    it('should work with multilingual content example', async () => {
      // @example Multilingual content
      const englishRecord = createNDEFRecordMediaTextPlain({
        payload: 'Welcome to our conference!',
        id: 'welcome-en',
      })

      const spanishRecord = createNDEFRecordMediaTextPlain({
        payload: '¡Bienvenidos a nuestra conferencia!',
        id: 'welcome-es',
      })

      const frenchRecord = createNDEFRecordMediaTextPlain({
        payload: 'Bienvenue à notre conférence!',
        id: 'welcome-fr',
      })

      expect(await englishRecord.payload()).toBe('Welcome to our conference!')
      expect(await spanishRecord.payload()).toBe('¡Bienvenidos a nuestra conferencia!')
      expect(await frenchRecord.payload()).toBe('Bienvenue à notre conférence!')

      expect(englishRecord.id).toBe('welcome-en')
      expect(spanishRecord.id).toBe('welcome-es')
      expect(frenchRecord.id).toBe('welcome-fr')
    })

    it('should work with instructions or help text example', async () => {
      // @example Instructions or help text
      const helpRecord = createNDEFRecordMediaTextPlain({
        payload: `NFC Setup Instructions:
1. Enable NFC in your device settings
2. Hold your device near the NFC tag
3. Follow the on-screen prompts
4. Tap 'Allow' when prompted for permissions

For support, contact: support@example.com`,
      })

      const helpText = await helpRecord.payload()
      expect(helpText).toContain('NFC Setup Instructions:')
      expect(helpText).toContain('Enable NFC in your device settings')
      expect(helpText).toContain('support@example.com')
    })

    it('should work with dynamic content example', async () => {
      // @example Dynamic content
      const currentDate = new Date().toLocaleDateString()
      const statusRecord = createNDEFRecordMediaTextPlain({
        payload: `System Status Report
Date: ${currentDate}
Status: Operational
Uptime: 99.9%
Last Update: ${new Date().toISOString()}`,
      })

      const statusText = await statusRecord.payload()
      expect(statusText).toContain('System Status Report')
      expect(statusText).toContain(currentDate)
      expect(statusText).toContain('Status: Operational')
      expect(statusText).toContain('Uptime: 99.9%')
    })
  })

  describe('binary Media Records', () => {
    it('should work with PNG image record', async () => {
      // Create a fake PNG header for testing
      const pngHeader = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
      const pngRecord = createNDEFRecordMediaImagePNG({
        payload: pngHeader,
        id: 'logo-png',
      })

      expect(pngRecord.tnf).toBe('media')
      expect(pngRecord.type).toBe('image/png')
      expect(await pngRecord.payload()).toEqual(pngHeader)
      expect(pngRecord.isIdentified).toBe(true)
      expect(pngRecord.id).toBe('logo-png')
    })

    it('should work with JPEG image record', async () => {
      // Create a fake JPEG header for testing
      const jpegHeader = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46])
      const jpegRecord = createNDEFRecordMediaImageJPEG({
        payload: jpegHeader,
        id: 'photo-jpeg',
      })

      expect(jpegRecord.tnf).toBe('media')
      expect(jpegRecord.type).toBe('image/jpeg')
      expect(await jpegRecord.payload()).toEqual(jpegHeader)
      expect(jpegRecord.isIdentified).toBe(true)
      expect(jpegRecord.id).toBe('photo-jpeg')
    })

    it('should work with MP4 video record', async () => {
      // Create a fake MP4 header for testing
      const mp4Header = new Uint8Array([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6F, 0x6D])
      const mp4Record = createNDEFRecordMediaVideoMP4({
        payload: mp4Header,
        id: 'demo-video',
      })

      expect(mp4Record.tnf).toBe('media')
      expect(mp4Record.type).toBe('video/mp4')
      expect(await mp4Record.payload()).toEqual(mp4Header)
      expect(mp4Record.isIdentified).toBe(true)
      expect(mp4Record.id).toBe('demo-video')
    })

    it('should work with MPEG audio record', async () => {
      // Create a fake MPEG header for testing
      const mpegHeader = new Uint8Array([0xFF, 0xFB, 0x90, 0x00, 0x00, 0x00, 0x00, 0x00])
      const mpegRecord = createNDEFRecordMediaAudioMPEG({
        payload: mpegHeader,
        id: 'background-music',
      })

      expect(mpegRecord.tnf).toBe('media')
      expect(mpegRecord.type).toBe('audio/mpeg')
      expect(await mpegRecord.payload()).toEqual(mpegHeader)
      expect(mpegRecord.isIdentified).toBe(true)
      expect(mpegRecord.id).toBe('background-music')
    })

    it('should work with HTML record', async () => {
      const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <title>NFC Card</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .card { border: 1px solid #ccc; padding: 20px; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="card">
        <h1>Welcome!</h1>
        <p>This content was loaded from an NFC tag.</p>
    </div>
</body>
</html>`

      const htmlRecord = createNDEFRecordMediaTextHTML({
        payload: htmlContent,
        id: 'welcome-page',
      })

      expect(htmlRecord.tnf).toBe('media')
      expect(htmlRecord.type).toBe('text/html')
      expect(await htmlRecord.payload()).toBe(htmlContent)
      expect(htmlRecord.isIdentified).toBe(true)
      expect(htmlRecord.id).toBe('welcome-page')
    })
  })

  describe('record Type Verification', () => {
    it('should verify all record creation functions work as documented', async () => {
      // Test JSON record
      const jsonRecord = createNDEFRecordMediaApplicationJson({ payload: { test: 'data' } })
      expect(jsonRecord.tnf).toBe('media')
      expect(jsonRecord.type).toBe('application/json')
      expect(await jsonRecord.payload()).toEqual({ test: 'data' })

      // Test text/plain record
      const textRecord = createNDEFRecordMediaTextPlain({ payload: 'Hello World' })
      expect(textRecord.tnf).toBe('media')
      expect(textRecord.type).toBe('text/plain')
      expect(await textRecord.payload()).toBe('Hello World')

      // Test text/html record
      const htmlRecord = createNDEFRecordMediaTextHTML({ payload: '<h1>Hello</h1>' })
      expect(htmlRecord.tnf).toBe('media')
      expect(htmlRecord.type).toBe('text/html')
      expect(await htmlRecord.payload()).toBe('<h1>Hello</h1>')

      // Test binary records
      const pngData = new Uint8Array([0x89, 0x50, 0x4E, 0x47])
      const pngRecord = createNDEFRecordMediaImagePNG({ payload: pngData })
      expect(pngRecord.tnf).toBe('media')
      expect(pngRecord.type).toBe('image/png')
      expect(await pngRecord.payload()).toEqual(pngData)

      const jpegData = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0])
      const jpegRecord = createNDEFRecordMediaImageJPEG({ payload: jpegData })
      expect(jpegRecord.tnf).toBe('media')
      expect(jpegRecord.type).toBe('image/jpeg')
      expect(await jpegRecord.payload()).toEqual(jpegData)

      const mp4Data = new Uint8Array([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70])
      const mp4Record = createNDEFRecordMediaVideoMP4({ payload: mp4Data })
      expect(mp4Record.tnf).toBe('media')
      expect(mp4Record.type).toBe('video/mp4')
      expect(await mp4Record.payload()).toEqual(mp4Data)

      const mpegData = new Uint8Array([0xFF, 0xFB, 0x90, 0x00])
      const mpegRecord = createNDEFRecordMediaAudioMPEG({ payload: mpegData })
      expect(mpegRecord.tnf).toBe('media')
      expect(mpegRecord.type).toBe('audio/mpeg')
      expect(await mpegRecord.payload()).toEqual(mpegData)
    })
  })
})
