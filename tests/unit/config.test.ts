import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { loadConfig, saveConfig, getRpcUrl, getIpfsGateway, getConfigDir, getConfigFile } from '../../src/config/store';

describe('getConfigDir/getConfigFile', () => {
  test('returns paths', () => {
    expect(getConfigDir()).toContain('.filecoin-cli');
    expect(getConfigFile()).toContain('config.json');
  });
});

describe('config store', () => {
  let tmpDir: string; let configFile: string;
  beforeEach(() => { tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fil-test-')); configFile = path.join(tmpDir, 'config.json'); });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }); });

  test('loadConfig returns {} if no file', () => { expect(loadConfig(configFile)).toEqual({}); });
  test('loadConfig reads file', () => {
    fs.writeFileSync(configFile, JSON.stringify({ rpcUrl: 'https://test' }));
    expect(loadConfig(configFile).rpcUrl).toBe('https://test');
  });
  test('loadConfig handles corruption', () => {
    fs.writeFileSync(configFile, 'bad');
    expect(loadConfig(configFile)).toEqual({});
  });
  test('saveConfig creates dirs', () => {
    const nested = path.join(tmpDir, 'sub', 'config.json');
    saveConfig({ rpcUrl: 'x' }, nested);
    expect(loadConfig(nested).rpcUrl).toBe('x');
  });
  test('saveConfig merges', () => {
    saveConfig({ rpcUrl: 'a' }, configFile);
    saveConfig({ ipfsGateway: 'b' }, configFile);
    const c = loadConfig(configFile);
    expect(c.rpcUrl).toBe('a');
    expect(c.ipfsGateway).toBe('b');
  });

  describe('getRpcUrl', () => {
    test('env var wins', () => {
      const orig = process.env.FILECOIN_RPC_URL;
      try { process.env.FILECOIN_RPC_URL = 'https://env'; expect(getRpcUrl(configFile)).toBe('https://env'); }
      finally { if (orig) process.env.FILECOIN_RPC_URL = orig; else delete process.env.FILECOIN_RPC_URL; }
    });
    test('config wins over default', () => {
      fs.writeFileSync(configFile, JSON.stringify({ rpcUrl: 'https://cfg' }));
      const orig = process.env.FILECOIN_RPC_URL;
      try { delete process.env.FILECOIN_RPC_URL; expect(getRpcUrl(configFile)).toBe('https://cfg'); }
      finally { if (orig) process.env.FILECOIN_RPC_URL = orig; else delete process.env.FILECOIN_RPC_URL; }
    });
    test('defaults to glif', () => {
      const orig = process.env.FILECOIN_RPC_URL;
      try { delete process.env.FILECOIN_RPC_URL; expect(getRpcUrl(configFile)).toBe('https://api.node.glif.io'); }
      finally { if (orig) process.env.FILECOIN_RPC_URL = orig; else delete process.env.FILECOIN_RPC_URL; }
    });
  });

  describe('getIpfsGateway', () => {
    test('env var wins', () => {
      const orig = process.env.IPFS_GATEWAY;
      try { process.env.IPFS_GATEWAY = 'https://gw'; expect(getIpfsGateway(configFile)).toBe('https://gw'); }
      finally { if (orig) process.env.IPFS_GATEWAY = orig; else delete process.env.IPFS_GATEWAY; }
    });
    test('defaults to ipfs.io', () => {
      const orig = process.env.IPFS_GATEWAY;
      try { delete process.env.IPFS_GATEWAY; expect(getIpfsGateway(configFile)).toBe('https://ipfs.io'); }
      finally { if (orig) process.env.IPFS_GATEWAY = orig; else delete process.env.IPFS_GATEWAY; }
    });
  });
});
