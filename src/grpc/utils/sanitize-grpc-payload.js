/**
 * gRPC Payload Sanitizer
 *
 * Removes unset optional fields before sending data over gRPC while
 * preserving valid protobuf values.
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
        if (key.startsWith('$')) {
          continue;
        }
        const sanitized = visit(value, keyPath.concat(key));
        if (sanitized !== undefined) {
          result[key] = sanitized;
        }
      }

      return Object.keys(result).length > 0 ? result : undefined;
    }

    if (typeof input === 'string') {
      return input.length === 0 ? undefined : input;
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
