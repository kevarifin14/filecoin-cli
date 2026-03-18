import { Command } from 'commander';
import { FilecoinClient } from '../api/client';
import { getRpcUrl, getIpfsGateway } from '../config/store';
import { header, row, jsonError } from '../utils/format';

export function makeAddressCommand(): Command {
  const cmd = new Command('address')
    .description('Resolve a Filecoin address to its ID address')
    .requiredOption('--addr <address>', 'Filecoin address to resolve')
    .option('--pretty', 'Human-readable colored output')
    .action(async (opts) => {
      try {
        const client = new FilecoinClient(getRpcUrl(), getIpfsGateway());
        const resolved = await client.lookupAddress(opts.addr);

        const data = { input: opts.addr, resolved };

        if (opts.pretty) {
          header('Address Lookup');
          row('Input', opts.addr);
          row('Resolved ID', resolved);
          return;
        }

        console.log(JSON.stringify(data));
      } catch (err) {
        if (err instanceof Error) {
          jsonError(err.message, 'RPC_ERROR', 1);
        } else {
          jsonError('Unknown error', 'UNKNOWN', 1);
        }
      }
    });

  return cmd;
}
