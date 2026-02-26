import * as std from "std";

export const ErrorCode = {
  INVALID_DATA: 'INVALID_DATA',
  INVALID_FORMAT: 'INVALID_FORMAT',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  PARSE_ERROR: 'PARSE_ERROR',
  INVALID_CHART_TYPE: 'INVALID_CHART_TYPE',
  MISSING_COLUMNS: 'MISSING_COLUMNS'
};

export function throwError(code, message) {
  const error = { error: message, code };
  std.err.puts(JSON.stringify(error) + '\n');
  std.exit(1);
}
