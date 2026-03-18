import { Command } from 'commander';
import { FilecoinClient } from '../api/client';
import { getRpcUrl, getIpfsGateway } from '../config/store';
import { header, row, formatBytes, jsonError } from '../utils/format';

export function makeIpfsCommand(): Command {
  const cmd = new Command('ipfs')
    .description('IPFS content operations');

  cmd
    .command('resolve')
    .description('Resolve a CID via IPFS gateway')
    .requiredOption('--cid <cid>', 'IPFS content ID')
    .option('--pretty', 'Human-readable colored output')
    .action(async (opts) => {
      try {
        const client = new FilecoinClient(getRpcUrl(), getIpfsGateway());
        const info = await client.resolveIpfs(opts.cid);

        const data = {
          cid: opts.cid,
          url: info.url,
          contentType: info.contentType,
          size: info.size,
          sizeHuman: info.size ? formatBytes(info.size) : null,
        };

        if (opts.pretty) {
          header(`IPFS: ${opts.cid}`);
          row('Gateway URL', info.url);
          row('Content-Type', info.contentType || '(unknown)');
          row('Size', info.size ? formatBytes(info.size) : '(unknown)');
          return;
        }

        console.log(JSON.stringify(data));
      } catch (err) {
        if (err instanceof Error) {
          jsonError(err.message, 'IPFS_ERROR', 1);
        } else {
          jsonError('Unknown error', 'UNKNOWN', 1);
        }
      }
    });

  cmd
    .command('cat')
    .description('Fetch and display IPFS content')
    .requiredOption('--cid <cid>', 'IPFS content ID')
    .option('--pretty', 'Human-readable colored output')
    .action(async (opts) => {
      try {
        const client = new FilecoinClient(getRpcUrl(), getIpfsGateway());
        const content = await client.fetchIpfs(opts.cid);

        // Try to parse as JSON for structured output
        let parsed: any = null;
        try { parsed = JSON.parse(content); } catch { /* not JSON */ }

        if (opts.pretty) {
          header(`IPFS Content: ${opts.cid}`);
          if (parsed) {
            console.log(JSON.stringify(parsed, null, 2));
          } else {
            console.log(content.slice(0, 2000));
            if (content.length > 2000) console.log(`\n... (${content.length} bytes total)`);
          }
          return;
        }

        if (parsed) {
          console.log(JSON.stringify({ cid: opts.cid, content: parsed }));
        } else {
          console.log(JSON.stringify({ cid: opts.cid, content, length: content.length }));
        }
      } catch (err) {
        if (err instanceof Error) {
          jsonError(err.message, 'IPFS_ERROR', 1);
        } else {
          jsonError('Unknown error', 'UNKNOWN', 1);
        }
      }
    });

  return cmd;
}
