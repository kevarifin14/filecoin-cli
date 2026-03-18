import { jsonError, header, row, formatBytes, formatFil } from '../../src/utils/format';

describe('jsonError', () => {
  const originalWrite = process.stderr.write;
  let stderrOutput: string[] = [];

  beforeEach(() => { stderrOutput = []; process.stderr.write = ((chunk: string | Uint8Array) => { stderrOutput.push(String(chunk)); return true; }) as typeof process.stderr.write; process.exitCode = undefined; });
  afterEach(() => { process.stderr.write = originalWrite; process.exitCode = undefined; });

  test('writes structured JSON error to stderr', () => {
    jsonError('fail', 'RPC_ERROR', 1);
    expect(JSON.parse(stderrOutput[0])).toEqual({ error: 'fail', code: 'RPC_ERROR', exitCode: 1 });
  });

  test('sets exit code', () => {
    jsonError('fail', 'X', 2);
    expect(process.exitCode).toBe(2);
  });
});

describe('header', () => {
  const orig = console.log;
  let out: string[] = [];
  beforeEach(() => { out = []; console.log = (...a: unknown[]) => { out.push(a.map(String).join(' ')); }; });
  afterEach(() => { console.log = orig; });
  test('prints 3 lines', () => { header('Test'); expect(out.length).toBe(3); });
});

describe('row', () => {
  const orig = console.log;
  let out: string[] = [];
  beforeEach(() => { out = []; console.log = (...a: unknown[]) => { out.push(a.map(String).join(' ')); }; });
  afterEach(() => { console.log = orig; });
  test('prints label-value', () => { row('L', 'V'); expect(out[0]).toContain('V'); });
});

describe('formatBytes', () => {
  test('formats 0', () => { expect(formatBytes(0)).toBe('0 B'); });
  test('formats bytes', () => { expect(formatBytes(500)).toBe('500.00 B'); });
  test('formats KB', () => { expect(formatBytes(1024)).toBe('1.00 KB'); });
  test('formats MB', () => { expect(formatBytes(1024 * 1024)).toBe('1.00 MB'); });
  test('formats GB', () => { expect(formatBytes(1024 ** 3)).toBe('1.00 GB'); });
  test('formats TB', () => { expect(formatBytes(1024 ** 4)).toBe('1.00 TB'); });
});

describe('formatFil', () => {
  test('formats zero', () => { expect(formatFil('0')).toBe('0 FIL'); });
  test('formats empty', () => { expect(formatFil('')).toBe('0 FIL'); });
  test('formats small attoFIL', () => {
    expect(formatFil('1000000000000000000')).toBe('1 FIL');
  });
  test('formats fractional FIL', () => {
    expect(formatFil('1500000000000000000')).toBe('1.5 FIL');
  });
  test('formats sub-1 FIL', () => {
    const result = formatFil('500000000000000000');
    expect(result).toContain('FIL');
    expect(result).toContain('0.');
  });
  test('formats large amount', () => {
    expect(formatFil('100000000000000000000')).toBe('100 FIL');
  });
});
