import { Command } from 'commander';
import { FilecoinClient } from '../api/client';
import { getRpcUrl, getIpfsGateway } from '../config/store';
import { header, row, formatFil, jsonError } from '../utils/format';

export function makeActorCommand(): Command {
  const cmd = new Command('actor')
    .description('Get actor info for an address')
    .requiredOption('--address <addr>', 'Filecoin address')
    .option('--pretty', 'Human-readable colored output')
    .action(async (opts) => {
      try {
        const client = new FilecoinClient(getRpcUrl(), getIpfsGateway());
        const actor = await client.getActorInfo(opts.address);

        const data = {
          address: opts.address,
          code: actor.code,
          head: actor.head,
          nonce: actor.nonce,
          balance: actor.balance,
          balanceFil: formatFil(actor.balance),
        };

        if (opts.pretty) {
          header(`Actor: ${opts.address}`);
          row('Code CID', actor.code);
          row('Head CID', actor.head);
          row('Nonce', actor.nonce.toString());
          row('Balance', formatFil(actor.balance));
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
