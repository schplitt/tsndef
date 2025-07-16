import type { RecordInfo } from './bytes'
import type { BaseNDEFRecord } from './types/records'
import { constructBytes } from './bytes'

/**
 * A type-safe container for NDEF (NFC Data Exchange Format) records with compile-time type tracking.
 *
 * NDEFMessage maintains a collection of NDEF records while preserving TypeScript type information
 * about the specific records it contains. This enables compile-time type checking and intelligent
 * autocompletion when working with known record types.
 *
 * The class supports immutable-style operations that return new instances with updated type
 * information, allowing for fluent API usage while maintaining type safety.
 *
 * @template TNDEFRecords - Tuple type representing the exact sequence of records in this message
 *
 * @example Basic message creation and manipulation
 * ```typescript
 * // Create an empty message
 * const message = new NDEFMessage();
 *
 * // Add records with type-safe chaining
 * const typedMessage = message
 *   .add(createNDEFRecordWellKnownURI({ payload: "https://example.com" }))
 *   .add(createNDEFRecordMediaApplicationJson({ payload: { hello: "world" } }));
 *
 * // TypeScript knows the exact types of records
 * const uriRecord = typedMessage.records[0]; // Type: NDEFRecordWellKnownURI
 * const jsonRecord = typedMessage.records[1]; // Type: NDEFRecordMediaApplicationJson
 * ```
 *
 * @example Creating from existing records
 * ```typescript
 * const records = [
 *   createNDEFRecordWellKnownURI({ payload: "mailto:test@example.com" }),
 *   createNDEFRecordMediaTextPlain({ payload: "Contact information" })
 * ];
 *
 * const message = new NDEFMessage(records);
 * console.log(`Message contains ${message.length} records`);
 * ```
 *
 * @example Binary serialization for NFC transmission
 * ```typescript
 * const message = new NDEFMessage()
 *   .add(createNDEFRecordWellKnownURI({ payload: "https://example.com/product/123" }))
 *   .add(createNDEFRecordMediaApplicationJson({
 *     payload: { productId: 123, name: "Example Product" }
 *   }));
 *
 * // Convert to bytes for NFC tag writing or transmission
 * const bytes = await message.toBytes();
 *
 * // Write to NFC tag (platform-specific implementation)
 * await writeToNfcTag(bytes);
 * ```
 *
 * @example Dynamic record management
 * ```typescript
 * let message = new NDEFMessage()
 *   .add(createNDEFRecordWellKnownURI({ payload: "https://example.com" }))
 *   .add(createNDEFRecordMediaTextPlain({ payload: "Description" }));
 *
 * // Remove records while maintaining type safety
 * message = message.removeHead(); // Removes first record (URI)
 * message = message.removeTail(); // Removes last record (text)
 *
 * // Add new records
 * message = message.addHead(createNDEFRecordMediaApplicationJson({
 *   payload: { timestamp: Date.now() }
 * }));
 * ```
 */
export class NDEFMessage<const TNDEFRecords extends BaseNDEFRecord[] = []> {
  /**
   * The array of NDEF records contained in this message.
   *
   * This property maintains the exact tuple type information of the records,
   * allowing TypeScript to provide precise type checking and autocompletion
   * for individual record access.
   *
   * @example Accessing records with type safety
   * ```typescript
   * const message = new NDEFMessage()
   *   .add(createNDEFRecordWellKnownURI({ payload: "https://example.com" }));
   *
   * // TypeScript knows this is a URI record
   * const firstRecord = message.records[0];
   * const url: string = firstRecord.payload(); // Type-safe access
   * ```
   */
  readonly records: TNDEFRecords

  /**
   * The number of records in this message.
   *
   * This getter provides a convenient way to check message size and leverages
   * TypeScript's tuple length inference for compile-time length checking when possible.
   *
   * @example
   * ```typescript
   * const message = new NDEFMessage()
   *   .add(createNDEFRecordWellKnownURI({ payload: "https://example.com" }))
   *   .add(createNDEFRecordMediaTextPlain({ payload: "Hello" }));
   *
   * console.log(`Message has ${message.length} records`); // Output: "Message has 2 records"
   *
   * // Use for validation
   * if (message.length === 0) {
   *   throw new Error("Cannot write empty NDEF message");
   * }
   * ```
   */
  get length(): this['records']['length'] {
    return this.records.length
  }

  /**
   * Creates a new NDEF message with the specified records.
   *
   * @param records - Optional array of NDEF records to initialize the message with.
   *                 If not provided, creates an empty message.
   *
   * @example Creating an empty message
   * ```typescript
   * const emptyMessage = new NDEFMessage();
   * console.log(emptyMessage.length); // 0
   * ```
   *
   * @example Creating with initial records
   * ```typescript
   * const records = [
   *   createNDEFRecordWellKnownURI({ payload: "https://example.com" }),
   *   createNDEFRecordMediaTextPlain({ payload: "Visit our website" })
   * ];
   *
   * const message = new NDEFMessage(records);
   * console.log(message.length); // 2
   * ```
   */
  constructor(
    records?: TNDEFRecords,
  ) {
    this.records = records ?? [] as unknown as TNDEFRecords
  }

  /**
   * Adds a record to the end of the message and returns a new message with updated type information.
   *
   * This method is an alias for {@link addTail} and provides the most common way to build
   * NDEF messages in a fluent style. The returned message maintains precise type information
   * about all contained records.
   *
   * @param record - The NDEF record to add to the message
   * @returns A new NDEFMessage with the record appended and updated type information
   *
   * @example Fluent message building
   * ```typescript
   * const message = new NDEFMessage()
   *   .add(createNDEFRecordWellKnownURI({ payload: "https://example.com" }))
   *   .add(createNDEFRecordMediaApplicationJson({ payload: { id: 123 } }))
   *   .add(createNDEFRecordMediaTextPlain({ payload: "Additional info" }));
   *
   * // TypeScript tracks all record types in order
   * const uriRecord = message.records[0];   // NDEFRecordWellKnownURI
   * const jsonRecord = message.records[1];  // NDEFRecordMediaApplicationJson
   * const textRecord = message.records[2];  // NDEFRecordMediaTextPlain
   * ```
   */
  add<const TNewRecord extends BaseNDEFRecord>(record: TNewRecord): NDEFMessage<[...TNDEFRecords, TNewRecord]> {
    return this.addTail(record)
  };

  /**
   * Adds a record to the beginning of the message and returns a new message with updated type information.
   *
   * This method modifies the current message instance by prepending the record and returns
   * the same instance cast to the new type. Use this when you need to add priority records
   * or headers to an existing message.
   *
   * @param header - The NDEF record to add at the beginning of the message
   * @returns The same message instance with the record prepended and updated type information
   *
   * @example Adding a header record
   * ```typescript
   * let message = new NDEFMessage()
   *   .add(createNDEFRecordMediaApplicationJson({ payload: { data: "main content" } }));
   *
   * // Add a URI header that provides context
   * message = message.addHead(
   *   createNDEFRecordWellKnownURI({ payload: "https://example.com/context" })
   * );
   *
   * // Now URI is first, JSON is second
   * const contextUri = message.records[0].payload(); // "https://example.com/context"
   * const mainData = message.records[1].payload();   // { data: "main content" }
   * ```
   */
  addHead<const TNewHeader extends BaseNDEFRecord>(header: TNewHeader): NDEFMessage<[TNewHeader, ...TNDEFRecords]> {
    this.records.unshift(header)
    return this as unknown as NDEFMessage<[TNewHeader, ...TNDEFRecords]>
  };

  /**
   * Adds a record to the end of the message and returns a new message with updated type information.
   *
   * This method modifies the current message instance by appending the record and returns
   * the same instance cast to the new type. This is the most efficient way to add records
   * when building messages incrementally.
   *
   * @param tail - The NDEF record to add at the end of the message
   * @returns The same message instance with the record appended and updated type information
   *
   * @example Building a message incrementally
   * ```typescript
   * let message = new NDEFMessage();
   *
   * // Add records one by one
   * message = message.addTail(
   *   createNDEFRecordWellKnownURI({ payload: "https://example.com" })
   * );
   * message = message.addTail(
   *   createNDEFRecordMediaTextPlain({ payload: "Description" })
   * );
   * message = message.addTail(
   *   createNDEFRecordMediaApplicationJson({ payload: { id: 123 } })
   * );
   *
   * console.log(`Built message with ${message.length} records`);
   * ```
   */
  addTail<const TNewTail extends BaseNDEFRecord>(tail: TNewTail): NDEFMessage<[...TNDEFRecords, TNewTail]> {
    this.records.push(tail)
    return this as unknown as NDEFMessage<[...TNDEFRecords, TNewTail]>
  };

  /**
   * Removes the last record from the message and returns the message with updated type information.
   *
   * This method is an alias for {@link removeTail} and provides a simple way to remove
   * the most recently added record from a message.
   *
   * @returns The same message instance with the last record removed and updated type information
   *
   * @example Simple record removal
   * ```typescript
   * let message = new NDEFMessage()
   *   .add(createNDEFRecordWellKnownURI({ payload: "https://example.com" }))
   *   .add(createNDEFRecordMediaTextPlain({ payload: "Temporary text" }));
   *
   * console.log(message.length); // 2
   *
   * // Remove the text record
   * message = message.remove();
   * console.log(message.length); // 1
   *
   * // Only URI record remains
   * const remainingRecord = message.records[0]; // NDEFRecordWellKnownURI
   * ```
   */
  remove() {
    return this.removeTail()
  }

  /**
   * Removes the first record from the message and returns the message with updated type information.
   *
   * This method modifies the current message instance by removing the first record and
   * returns the same instance cast to the new type. Useful for processing messages
   * where you want to consume records from the beginning.
   *
   * @returns The same message instance with the first record removed and updated type information
   *
   * @example Processing records sequentially
   * ```typescript
   * let message = new NDEFMessage()
   *   .add(createNDEFRecordWellKnownURI({ payload: "https://example.com" }))
   *   .add(createNDEFRecordMediaTextPlain({ payload: "Description" }))
   *   .add(createNDEFRecordMediaApplicationJson({ payload: { id: 123 } }));
   *
   * // Process and remove the first record
   * while (message.length > 0) {
   *   const firstRecord = message.records[0];
   *   console.log(`Processing: ${firstRecord.tnf}/${firstRecord.type}`);
   *
   *   message = message.removeHead();
   * }
   * ```
   *
   * @example Handling empty messages
   * ```typescript
   * let emptyMessage = new NDEFMessage();
   * emptyMessage = emptyMessage.removeHead(); // Safe - returns empty message
   * console.log(emptyMessage.length); // Still 0
   * ```
   */
  removeHead(): NDEFMessage<TNDEFRecords extends [unknown, ...infer TRest] ? TRest : []> {
    if (this.records.length === 0) {
      return this as unknown as NDEFMessage as unknown as NDEFMessage<TNDEFRecords extends [unknown, ...infer TRest] ? TRest : []>
    }
    // remove the first record and return a new NDEFMessage with the rest

    this.records.shift()

    return this as unknown as NDEFMessage<TNDEFRecords extends [unknown, ...infer TRest] ? TRest : []>
  };

  /**
   * Removes the last record from the message and returns the message with updated type information.
   *
   * This method modifies the current message instance by removing the last record and
   * returns the same instance cast to the new type. Useful for removing records that
   * were added conditionally or in error.
   *
   * @returns The same message instance with the last record removed and updated type information
   *
   * @example Conditional record building
   * ```typescript
   * let message = new NDEFMessage()
   *   .add(createNDEFRecordWellKnownURI({ payload: "https://example.com" }))
   *   .add(createNDEFRecordMediaTextPlain({ payload: "Description" }));
   *
   * // Conditionally add debug info
   * if (includeDebugInfo) {
   *   message = message.add(createNDEFRecordMediaApplicationJson({
   *     payload: { debug: true, timestamp: Date.now() }
   *   }));
   * }
   *
   * // Later, remove debug info if not needed
   * if (!shouldKeepDebugInfo) {
   *   message = message.removeTail();
   * }
   * ```
   *
   * @example Safe removal from empty messages
   * ```typescript
   * let emptyMessage = new NDEFMessage();
   * emptyMessage = emptyMessage.removeTail(); // Safe - returns empty message
   * console.log(emptyMessage.length); // Still 0
   * ```
   */
  removeTail(): NDEFMessage<TNDEFRecords extends [...infer TRest, unknown] ? TRest : []> {
    if (this.records.length === 0) {
      return this as unknown as NDEFMessage as unknown as NDEFMessage<TNDEFRecords extends [...infer TRest, unknown] ? TRest : []>
    }
    // remove the last record and return a new NDEFMessage with the rest
    this.records.pop()
    return this as unknown as NDEFMessage<TNDEFRecords extends [...infer TRest, unknown] ? TRest : []>
  };

  /**
   * Converts the NDEF message to its binary representation for NFC transmission or storage.
   *
   * This method serializes the entire message according to the NDEF specification,
   * including proper TLV (Type-Length-Value) wrapping, record header generation,
   * and payload encoding. The process is asynchronous because record payloads
   * may require encoding operations (e.g., JSON serialization, binary data processing).
   *
   * The resulting byte array can be written to NFC tags, transmitted via NFC peer-to-peer
   * communication, or stored for later use.
   *
   * @returns Promise resolving to a Uint8Array containing the complete NDEF message
   *
   * @throws {Error} If message construction fails due to:
   *   - Invalid record structure or missing required fields
   *   - Payload encoding errors (e.g., malformed JSON, invalid binary data)
   *   - Message size exceeding platform limitations
   *   - Missing required message begin/end flags when multiple records are present
   *
   * @example Basic message serialization
   * ```typescript
   * const message = new NDEFMessage()
   *   .add(createNDEFRecordWellKnownURI({ payload: "https://example.com" }))
   *   .add(createNDEFRecordMediaApplicationJson({ payload: { hello: "world" } }));
   *
   * try {
   *   const bytes = await message.toBytes();
   *   console.log(`Message serialized to ${bytes.length} bytes`);
   *
   *   // Write to NFC tag (platform-specific)
   *   await writeToNfcTag(bytes);
   * } catch (error) {
   *   console.error('Serialization failed:', error.message);
   * }
   * ```
   *
   * @example Handling large binary payloads
   * ```typescript
   * const imageData = new Uint8Array(1024 * 1024); // 1MB image
   * const message = new NDEFMessage()
   *   .add(createNDEFRecordMediaImagePNG({ payload: imageData }));
   *
   * try {
   *   const bytes = await message.toBytes();
   *
   *   // Check if the result fits NFC tag capacity
   *   if (bytes.length > NFC_TAG_CAPACITY) {
   *     throw new Error(`Message too large: ${bytes.length} bytes > ${NFC_TAG_CAPACITY} bytes`);
   *   }
   *
   *   await writeToNfcTag(bytes);
   * } catch (error) {
   *   console.error('Failed to write large message:', error.message);
   * }
   * ```
   *
   * @example Round-trip verification
   * ```typescript
   * const originalMessage = new NDEFMessage()
   *   .add(createNDEFRecordWellKnownURI({ payload: "https://example.com" }));
   *
   * // Serialize and parse back
   * const bytes = await originalMessage.toBytes();
   * const parsedMessage = parseNDEFMessage(bytes);
   *
   * // Verify round-trip integrity
   * console.log('Original records:', originalMessage.records.length);
   * console.log('Parsed records:', parsedMessage.records.length);
   * console.log('URI matches:',
   *   originalMessage.records[0].payload() === parsedMessage.records[0].payload()
   * );
   * ```
   *
   * @see {@link parseNDEFMessage} for parsing the resulting bytes back into a message
   * @see {@link https://nfc-forum.org/our-work/specification-releases/specifications/nfc-forum-technical-specifications/} NDEF specification for binary format details
   */
  async toBytes(): Promise<Uint8Array> {
    const infos: RecordInfo[] = this.records.map((record, index) => ({
      record,
      isBeginning: index === 0,
      isEnd: index === this.records.length - 1,
    }))

    return await constructBytes(infos)
  }
}
