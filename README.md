# 📱 tsndef

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![License][license-src]][license-href]

A modern, type-safe TypeScript library for creating and parsing NDEF (NFC Data Exchange Format) messages with full compile-time type checking and intelligent autocompletion.

## ✨ Features

- **🔒 Type-Safe**: Full TypeScript support with compile-time type checking
- **🚀 Modern**: Built with modern TypeScript features and ES modules
- **📦 Lightweight**: No dependencies and tree-shakable
- **🔧 Comprehensive**: Support for most common NDEF record types
- **🎯 Intelligent**: Smart type inference and autocompletion
- **🛡️ Robust**: Comprehensive error handling and validation
- **⚡ Fast**: Optimized parsing and serialization
- **🧪 Well-Tested**: Extensive test coverage

## 🏆 Advantages

### Type Safety First
Unlike other NDEF libraries, tsndef provides **compile-time type checking** for all NDEF operations. Know exactly what record types you're working with before runtime.

### Modern Architecture
- Built with **modern TypeScript** (ES2022+)
- **Tree-shakable** - only bundle what you use
- **Zero dependencies** for core functionality
- **Immutable-style** API for better developer experience

### Intelligent Type Inference
The library tracks record types at compile time, providing intelligent autocompletion and preventing runtime errors:

```typescript
const message = new NDEFMessage()
  .add(createNDEFRecordWellKnownURI({ payload: 'https://example.com' }))
  .add(createNDEFRecordMediaApplicationJson({ payload: { hello: 'world' } }))

// TypeScript automatically knows the exact types
const uriRecord = message.records[0] // Type: NDEFRecordWellKnownURI
const jsonRecord = message.records[1] // Type: NDEFRecordMediaApplicationJson
```

## 📦 Installation

```bash
# npm
npm install tsndef

# yarn
yarn add tsndef

# pnpm
pnpm add tsndef
```

## 🚀 Usage

### Creating NDEF Messages

#### Basic URI Record
```typescript
import { createNDEFRecordWellKnownURI, NDEFMessage } from 'tsndef'

// Create a simple URI record
const message = new NDEFMessage()
  .add(createNDEFRecordWellKnownURI({
    payload: 'https://example.com'
  }))

// Convert to bytes for NFC writing
const bytes = await message.toBytes()
```

#### JSON Data Record
```typescript
import { createNDEFRecordMediaApplicationJson, NDEFMessage } from 'tsndef'

const jsonMessage = new NDEFMessage()
  .add(createNDEFRecordMediaApplicationJson({
    payload: {
      productId: 12345,
      name: 'Awesome Product',
      price: 29.99,
      inStock: true
    }
  }))
```

#### Text Records
```typescript
import { createNDEFRecordMediaTextPlain, NDEFMessage } from 'tsndef'

const textMessage = new NDEFMessage()
  .add(createNDEFRecordMediaTextPlain({
    payload: 'Hello, NFC World! 🌍'
  }))
```

#### Complex Multi-Record Message
```typescript
import {
  createNDEFRecordMediaApplicationJson,
  createNDEFRecordMediaTextPlain,
  createNDEFRecordWellKnownURI,
  NDEFMessage
} from 'tsndef'

const complexMessage = new NDEFMessage()
  .add(createNDEFRecordWellKnownURI({
    payload: 'https://myapp.com/product/123'
  }))
  .add(createNDEFRecordMediaApplicationJson({
    payload: {
      action: 'view_product',
      productId: 123,
      timestamp: Date.now()
    }
  }))
  .add(createNDEFRecordMediaTextPlain({
    payload: 'Scan this tag to view product details'
  }))

// Convert to bytes for NFC tag writing
const nfcBytes = await complexMessage.toBytes()
```

### Reading NDEF Messages

#### Basic Parsing
```typescript
import { parseNDEFMessage } from 'tsndef'

// Parse bytes received from NFC tag
const nfcBytes = new Uint8Array([/* raw bytes from NFC tag */])
const message = parseNDEFMessage(nfcBytes)

console.log(`Found ${message.length} records`)
```

#### Safe Parsing (No Exceptions)
```typescript
import { safeParseNDEFMessage } from 'tsndef'

const result = safeParseNDEFMessage(nfcBytes)

if (result.success) {
  console.log('Parsed successfully:', result.message)
}
else {
  console.error('Parsing failed:', result.error)
}
```

#### Type-Safe Record Processing
```typescript
const message = parseNDEFMessage(nfcBytes)

for (const record of message.records) {
  switch (record.tnf) {
    case 'well-known':
      if (record.type === 'U') {
        console.log('Found URI:', await record.payload()) // Full URI string
      }
      break

    case 'media':
      if (record.type === 'application/json') {
        const data = await record.payload() // Parsed JSON object
        console.log('JSON data:', data)
      }
      else if (record.type === 'text/plain') {
        console.log('Text content:', await record.payload())
      }
      break

    default:
      console.log('Unknown record type:', record.type)
      console.log('Raw payload:', await record.rawPayload())
  }
}
```

### Supported Record Types

#### Well-Known Records
- **URI Records**: `createNDEFRecordWellKnownURI()`
  - Supports all standard URI prefixes (http, https, tel, mailto, etc.)
  - Automatic prefix optimization for smaller tag sizes

#### Media Records
- **JSON**: `createNDEFRecordMediaApplicationJson()`
- **Plain Text**: `createNDEFRecordMediaTextPlain()`
- **HTML**: `createNDEFRecordMediaTextHTML()`
- **Images**: `createNDEFRecordMediaImagePNG()`, `createNDEFRecordMediaImageJPEG()`
- **Video**: `createNDEFRecordMediaVideoMP4()`
- **Audio**: `createNDEFRecordMediaAudioMPEG()`

## ⚠️ Important: Type Inference and Immutability

### Type Inference Limitations

When working with tsndef, it's important to understand how TypeScript's type inference works with our immutable-style API. **Adding or removing records after initial variable assignment may interfere with correct type inference**.

#### ❌ Problematic Pattern
```typescript
// Initial assignment with inferred type
const message = new NDEFMessage()
  .add(createNDEFRecordWellKnownURI({ payload: 'https://example.com' }))

// TypeScript infers: NDEFMessage<[NDEFRecordWellKnownURI<https://example.com>]>

// Later modifications lose precise type information
message.remove()
// TypeScript now still sees: NDEFMessage<[NDEFRecordWellKnownURI<https://example.com>]> - lost precise typing!

// Type information is no longer accurate
const firstPayload = await message.records[0].payload() // Valid access to typescript, but results in runtime error as the record was removed
```

#### ✅ Recommended Patterns

**Option 1: Build the complete message in one chain**
```typescript
const message = new NDEFMessage()
  .add(createNDEFRecordWellKnownURI({ payload: 'https://example.com' }))
  .add(createNDEFRecordMediaApplicationJson({ payload: { id: 123 } }))
  .add(createNDEFRecordMediaTextPlain({ payload: 'Description' }))

// TypeScript maintains precise type: NDEFMessage<[NDEFRecordWellKnownURI, NDEFRecordMediaApplicationJson, NDEFRecordMediaTextPlain]>
const uriRecord = message.records[0] // Type: NDEFRecordWellKnownURI ✓
const jsonRecord = message.records[1] // Type: NDEFRecordMediaApplicationJson ✓
```

**Option 2: Reassign after modifications**
```typescript
// Create new instances to maintain type safety
let message = new NDEFMessage()
  .add(createNDEFRecordWellKnownURI({ payload: 'https://example.com' }))

message = message
  .add(createNDEFRecordMediaApplicationJson({ payload: { id: 123 } }))
```

### Why This Matters

Maintaining precise type information allows you to:
- Get accurate autocompletion when accessing record properties
- Catch type errors at compile time
- Leverage TypeScript's powerful type system for safer NFC operations
- Ensure your code is more maintainable and less prone to runtime errors

## 🧪 Testing

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run linting
pnpm lint

# Fix linting issues
pnpm lint:fix
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see the [LICENSE](./LICENSE) file for details.

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/tsndef?style=flat&colorA=18181B&colorB=F0DB4F
[npm-version-href]: https://npmjs.com/package/tsndef
[npm-downloads-src]: https://img.shields.io/npm/dm/tsndef?style=flat&colorA=18181B&colorB=F0DB4F
[npm-downloads-href]: https://npmjs.com/package/tsndef
[bundle-src]: https://img.shields.io/bundlephobia/minzip/tsndef?style=flat&colorA=18181B&colorB=F0DB4F
[bundle-href]: https://bundlephobia.com/result?p=tsndef
[license-src]: https://img.shields.io/github/license/schplitt/tsndef.svg?style=flat&colorA=18181B&colorB=F0DB4F
[license-href]: https://github.com/schplitt/tsndef/blob/main/LICENSE
