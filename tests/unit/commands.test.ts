const mockGetChainHead = jest.fn();
const mockGetNetworkVersion = jest.fn();
const mockGetNetworkName = jest.fn();
const mockGetBaseFee = jest.fn();
const mockGetBalance = jest.fn();
const mockGetMinerInfo = jest.fn();
const mockGetMinerPower = jest.fn();
const mockGetActorInfo = jest.fn();
const mockLookupAddress = jest.fn();
const mockResolveIpfs = jest.fn();
const mockFetchIpfs = jest.fn();

jest.mock('../../src/api/client', () => ({
  FilecoinClient: jest.fn().mockImplementation(() => ({
    getChainHead: mockGetChainHead,
    getNetworkVersion: mockGetNetworkVersion,
    getNetworkName: mockGetNetworkName,
    getBaseFee: mockGetBaseFee,
    getBalance: mockGetBalance,
    getMinerInfo: mockGetMinerInfo,
    getMinerPower: mockGetMinerPower,
    getActorInfo: mockGetActorInfo,
    lookupAddress: mockLookupAddress,
    resolveIpfs: mockResolveIpfs,
    fetchIpfs: mockFetchIpfs,
  })),
  FilecoinRpcError: class extends Error { constructor(public code: number, msg: string) { super(msg); } },
}));

jest.mock('../../src/config/store', () => ({
  getRpcUrl: () => 'https://mock.rpc',
  getIpfsGateway: () => 'https://mock.ipfs',
}));

import { makeChainCommand } from '../../src/commands/chain';
import { makeBalanceCommand } from '../../src/commands/balance';
import { makeMinerCommand } from '../../src/commands/miner';
import { makeActorCommand } from '../../src/commands/actor';
import { makeIpfsCommand } from '../../src/commands/ipfs';
import { makeAddressCommand } from '../../src/commands/address';

describe('commands', () => {
  const originalLog = console.log;
  const originalStderrWrite = process.stderr.write;
  let stdoutOutput: string[] = [];
  let stderrOutput: string[] = [];

  beforeEach(() => {
    stdoutOutput = []; stderrOutput = [];
    console.log = (...args: unknown[]) => { stdoutOutput.push(args.map(String).join(' ')); };
    process.stderr.write = ((chunk: string | Uint8Array) => { stderrOutput.push(String(chunk)); return true; }) as typeof process.stderr.write;
    process.exitCode = undefined;

    mockGetChainHead.mockResolvedValue({ height: 5000, blocks: [{ miner: 'f01234', timestamp: 1700000000 }] });
    mockGetNetworkVersion.mockResolvedValue(27);
    mockGetNetworkName.mockResolvedValue('mainnet');
    mockGetBaseFee.mockResolvedValue('100');
    mockGetBalance.mockResolvedValue('5000000000000000000');
    mockGetMinerInfo.mockResolvedValue({ owner: 'f01', worker: 'f02', sectorSize: 34359738368, peerID: 'peer1' });
    mockGetMinerPower.mockResolvedValue({ minerPower: '1000', totalPower: '99999', hasMinPower: true });
    mockGetActorInfo.mockResolvedValue({ code: 'bafk', head: 'bafy', nonce: 5, balance: '1000000000000000000' });
    mockLookupAddress.mockResolvedValue('f01234');
    mockResolveIpfs.mockResolvedValue({ url: 'https://ipfs.io/ipfs/Qm', contentType: 'text/plain', size: 1024 });
    mockFetchIpfs.mockResolvedValue('hello world');
  });

  afterEach(() => { console.log = originalLog; process.stderr.write = originalStderrWrite; process.exitCode = undefined; jest.clearAllMocks(); });

  describe('chain', () => {
    test('JSON output', async () => { const cmd = makeChainCommand(); await cmd.parseAsync([], { from: 'user' }); const o = JSON.parse(stdoutOutput.join('')); expect(o.height).toBe(5000); expect(o.network).toBe('mainnet'); });
    test('pretty output', async () => { const cmd = makeChainCommand(); await cmd.parseAsync(['--pretty'], { from: 'user' }); expect(stdoutOutput.join('\n')).toContain('Filecoin Chain'); });
    test('pretty without blocks', async () => { mockGetChainHead.mockResolvedValue({ height: 1, blocks: [] }); const cmd = makeChainCommand(); await cmd.parseAsync(['--pretty'], { from: 'user' }); expect(stdoutOutput.join('\n')).toContain('Height'); });
    test('error', async () => { mockGetChainHead.mockRejectedValue(new Error('fail')); const cmd = makeChainCommand(); await cmd.parseAsync([], { from: 'user' }); expect(JSON.parse(stderrOutput[0]).code).toBe('RPC_ERROR'); });
    test('non-Error', async () => { mockGetChainHead.mockRejectedValue(null); const cmd = makeChainCommand(); await cmd.parseAsync([], { from: 'user' }); expect(JSON.parse(stderrOutput[0]).code).toBe('UNKNOWN'); });
  });

  describe('balance', () => {
    test('JSON output', async () => { const cmd = makeBalanceCommand(); await cmd.parseAsync(['--address', 'f01234'], { from: 'user' }); const o = JSON.parse(stdoutOutput.join('')); expect(o.address).toBe('f01234'); });
    test('pretty output', async () => { const cmd = makeBalanceCommand(); await cmd.parseAsync(['--address', 'f01234', '--pretty'], { from: 'user' }); expect(stdoutOutput.join('\n')).toContain('Balance'); });
    test('error', async () => { mockGetBalance.mockRejectedValue(new Error('fail')); const cmd = makeBalanceCommand(); await cmd.parseAsync(['--address', 'f01234'], { from: 'user' }); expect(JSON.parse(stderrOutput[0]).code).toBe('RPC_ERROR'); });
    test('non-Error', async () => { mockGetBalance.mockRejectedValue(42); const cmd = makeBalanceCommand(); await cmd.parseAsync(['--address', 'f01234'], { from: 'user' }); expect(JSON.parse(stderrOutput[0]).code).toBe('UNKNOWN'); });
  });

  describe('miner', () => {
    test('JSON output', async () => { const cmd = makeMinerCommand(); await cmd.parseAsync(['--address', 'f01234'], { from: 'user' }); const o = JSON.parse(stdoutOutput.join('')); expect(o.owner).toBe('f01'); });
    test('pretty output', async () => { const cmd = makeMinerCommand(); await cmd.parseAsync(['--address', 'f01234', '--pretty'], { from: 'user' }); expect(stdoutOutput.join('\n')).toContain('Miner'); });
    test('pretty with empty peerID', async () => { mockGetMinerInfo.mockResolvedValue({ owner: 'f01', worker: 'f02', sectorSize: 1024, peerID: '' }); const cmd = makeMinerCommand(); await cmd.parseAsync(['--address', 'f01234', '--pretty'], { from: 'user' }); expect(stdoutOutput.join('\n')).toContain('(none)'); });
    test('error', async () => { mockGetMinerInfo.mockRejectedValue(new Error('fail')); const cmd = makeMinerCommand(); await cmd.parseAsync(['--address', 'f01234'], { from: 'user' }); expect(JSON.parse(stderrOutput[0]).code).toBe('RPC_ERROR'); });
    test('non-Error', async () => { mockGetMinerInfo.mockRejectedValue(false); const cmd = makeMinerCommand(); await cmd.parseAsync(['--address', 'f01234'], { from: 'user' }); expect(JSON.parse(stderrOutput[0]).code).toBe('UNKNOWN'); });
  });

  describe('actor', () => {
    test('JSON output', async () => { const cmd = makeActorCommand(); await cmd.parseAsync(['--address', 'f01234'], { from: 'user' }); const o = JSON.parse(stdoutOutput.join('')); expect(o.nonce).toBe(5); });
    test('pretty output', async () => { const cmd = makeActorCommand(); await cmd.parseAsync(['--address', 'f01234', '--pretty'], { from: 'user' }); expect(stdoutOutput.join('\n')).toContain('Actor'); });
    test('error', async () => { mockGetActorInfo.mockRejectedValue(new Error('fail')); const cmd = makeActorCommand(); await cmd.parseAsync(['--address', 'f01234'], { from: 'user' }); expect(JSON.parse(stderrOutput[0]).code).toBe('RPC_ERROR'); });
    test('non-Error', async () => { mockGetActorInfo.mockRejectedValue(0); const cmd = makeActorCommand(); await cmd.parseAsync(['--address', 'f01234'], { from: 'user' }); expect(JSON.parse(stderrOutput[0]).code).toBe('UNKNOWN'); });
  });

  describe('address', () => {
    test('JSON output', async () => { const cmd = makeAddressCommand(); await cmd.parseAsync(['--addr', 'f3xxx'], { from: 'user' }); const o = JSON.parse(stdoutOutput.join('')); expect(o.resolved).toBe('f01234'); });
    test('pretty output', async () => { const cmd = makeAddressCommand(); await cmd.parseAsync(['--addr', 'f3xxx', '--pretty'], { from: 'user' }); expect(stdoutOutput.join('\n')).toContain('Address Lookup'); });
    test('error', async () => { mockLookupAddress.mockRejectedValue(new Error('fail')); const cmd = makeAddressCommand(); await cmd.parseAsync(['--addr', 'f3xxx'], { from: 'user' }); expect(JSON.parse(stderrOutput[0]).code).toBe('RPC_ERROR'); });
    test('non-Error', async () => { mockLookupAddress.mockRejectedValue(null); const cmd = makeAddressCommand(); await cmd.parseAsync(['--addr', 'f3xxx'], { from: 'user' }); expect(JSON.parse(stderrOutput[0]).code).toBe('UNKNOWN'); });
  });

  describe('ipfs resolve', () => {
    test('JSON output', async () => { const cmd = makeIpfsCommand(); await cmd.parseAsync(['resolve', '--cid', 'QmTest'], { from: 'user' }); const o = JSON.parse(stdoutOutput.join('')); expect(o.cid).toBe('QmTest'); expect(o.sizeHuman).toContain('KB'); });
    test('pretty output', async () => { const cmd = makeIpfsCommand(); await cmd.parseAsync(['resolve', '--cid', 'QmTest', '--pretty'], { from: 'user' }); expect(stdoutOutput.join('\n')).toContain('IPFS'); });
    test('handles null size', async () => { mockResolveIpfs.mockResolvedValue({ url: 'x', contentType: null, size: null }); const cmd = makeIpfsCommand(); await cmd.parseAsync(['resolve', '--cid', 'QmTest'], { from: 'user' }); const o = JSON.parse(stdoutOutput.join('')); expect(o.sizeHuman).toBeNull(); });
    test('pretty with null size', async () => { mockResolveIpfs.mockResolvedValue({ url: 'x', contentType: null, size: null }); const cmd = makeIpfsCommand(); await cmd.parseAsync(['resolve', '--cid', 'QmTest', '--pretty'], { from: 'user' }); expect(stdoutOutput.join('\n')).toContain('(unknown)'); });
    test('error', async () => { mockResolveIpfs.mockRejectedValue(new Error('fail')); const cmd = makeIpfsCommand(); await cmd.parseAsync(['resolve', '--cid', 'QmTest'], { from: 'user' }); expect(JSON.parse(stderrOutput[0]).code).toBe('IPFS_ERROR'); });
    test('non-Error', async () => { mockResolveIpfs.mockRejectedValue(undefined); const cmd = makeIpfsCommand(); await cmd.parseAsync(['resolve', '--cid', 'QmTest'], { from: 'user' }); expect(JSON.parse(stderrOutput[0]).code).toBe('UNKNOWN'); });
  });

  describe('ipfs cat', () => {
    test('JSON output with text', async () => { const cmd = makeIpfsCommand(); await cmd.parseAsync(['cat', '--cid', 'QmTest'], { from: 'user' }); const o = JSON.parse(stdoutOutput.join('')); expect(o.content).toBe('hello world'); expect(o.length).toBe(11); });
    test('JSON output with JSON content', async () => { mockFetchIpfs.mockResolvedValue('{"name":"test"}'); const cmd = makeIpfsCommand(); await cmd.parseAsync(['cat', '--cid', 'QmTest'], { from: 'user' }); const o = JSON.parse(stdoutOutput.join('')); expect(o.content.name).toBe('test'); });
    test('pretty with text', async () => { const cmd = makeIpfsCommand(); await cmd.parseAsync(['cat', '--cid', 'QmTest', '--pretty'], { from: 'user' }); expect(stdoutOutput.join('\n')).toContain('hello world'); });
    test('pretty with JSON', async () => { mockFetchIpfs.mockResolvedValue('{"name":"test"}'); const cmd = makeIpfsCommand(); await cmd.parseAsync(['cat', '--cid', 'QmTest', '--pretty'], { from: 'user' }); expect(stdoutOutput.join('\n')).toContain('test'); });
    test('pretty with long content truncates', async () => { mockFetchIpfs.mockResolvedValue('x'.repeat(3000)); const cmd = makeIpfsCommand(); await cmd.parseAsync(['cat', '--cid', 'QmTest', '--pretty'], { from: 'user' }); expect(stdoutOutput.join('\n')).toContain('3000 bytes total'); });
    test('error', async () => { mockFetchIpfs.mockRejectedValue(new Error('fail')); const cmd = makeIpfsCommand(); await cmd.parseAsync(['cat', '--cid', 'QmTest'], { from: 'user' }); expect(JSON.parse(stderrOutput[0]).code).toBe('IPFS_ERROR'); });
    test('non-Error', async () => { mockFetchIpfs.mockRejectedValue(false); const cmd = makeIpfsCommand(); await cmd.parseAsync(['cat', '--cid', 'QmTest'], { from: 'user' }); expect(JSON.parse(stderrOutput[0]).code).toBe('UNKNOWN'); });
  });
});
