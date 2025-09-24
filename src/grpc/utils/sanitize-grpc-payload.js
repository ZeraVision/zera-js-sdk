/**
 * gRPC Payload Sanitizer
 *
 * Removes unset optional fields before sending data over gRPC while
 * preserving valid protobuf values and essential metadata fields.
 * 
 * Preserves:
 * - Protobuf metadata fields (starting with $, like $typeName)
 * - Non-empty strings, arrays, and objects
 * - Valid boolean values (except for specific optional false keys)
 * 
 * Removes:
 * - Empty strings (length === 0)
 * - Empty arrays
 * - Empty objects
 * - Null/undefined values
 * - Optional false boolean values for specific keys
 */

const OPTIONAL_FALSE_KEYS = new Set(['safeSend']);

function sanitizeGrpcPayload(value) {
  const visit = (input, keyPath = []) => {
    if (input === undefined || input === null) {
      return undefined;
    }

    if (input instanceof Uint8Array) {
      return input.length === 0 ? undefined : input;
    }

    if (Array.isArray(input)) {
      const pruned = input
        .map((item, index) => visit(item, keyPath.concat(index)))
        .filter((item) => item !== undefined);
      return pruned.length > 0 ? pruned : undefined;
    }

    if (typeof input === 'object') {
      const result = {};

      for (const [key, value] of Object.entries(input)) {
        // Preserve all protobuf metadata fields (starting with $)
        // These are essential for protobuf object identity and should never be stripped
        if (key.startsWith('$')) {
          result[key] = value;
          continue;
        }
        const sanitized = visit(value, keyPath.concat(key));
        // Always include the field - let protobuf handle undefined values
        result[key] = sanitized;
      }

      return Object.keys(result).length > 0 ? result : undefined;
    }

    if (typeof input === 'string') {
      // For protobuf string fields, preserve empty strings for required fields
      // Only convert to undefined for truly optional fields
      return input;
    }

    if (typeof input === 'bigint') {
      return input.toString();
    }

    if (typeof input === 'boolean') {
      const currentKey = keyPath[keyPath.length - 1];
      if (!input && OPTIONAL_FALSE_KEYS.has(currentKey)) {
        return undefined;
      }
      return input;
    }

    return input;
  };

  return visit(value) ?? {};
}

export { sanitizeGrpcPayload };
export default sanitizeGrpcPayload;
