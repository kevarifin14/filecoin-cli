import { Command } from 'commander';
import { FilecoinClient } from '../api/client';
import { getRpcUrl, getIpfsGateway } from '../config/store';
import { header, row, formatFil, jsonError } from '../utils/format';

export function makeBalanceCommand(): Command {
  const cmd = new Command('balance')
    .description('Get FIL balance for an address')
    .requiredOption('--address <addr>', 'Filecoin address (f0, f1, f2, f3, or f4)')
    .option('--pretty', 'Human-readable colored output')
    .action(async (opts) => {
      try {
        const client = new FilecoinClient(getRpcUrl(), getIpfsGateway());
        const balance = await client.getBalance(opts.address);

        const data = { address: opts.address, balanceAttoFil: balance, balanceFil: formatFil(balance) };

        if (opts.pretty) {
          header(`Balance: ${opts.address}`);
          row('Balance', formatFil(balance));
          row('Balance (attoFIL)', balance);
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
