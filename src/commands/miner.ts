import { Command } from 'commander';
import { FilecoinClient } from '../api/client';
import { getRpcUrl, getIpfsGateway } from '../config/store';
import { header, row, formatBytes, jsonError } from '../utils/format';

export function makeMinerCommand(): Command {
  const cmd = new Command('miner')
    .description('Get storage provider (miner) info')
    .requiredOption('--address <addr>', 'Miner address (e.g. f01234)')
    .option('--pretty', 'Human-readable colored output')
    .action(async (opts) => {
      try {
        const client = new FilecoinClient(getRpcUrl(), getIpfsGateway());

        const [info, power] = await Promise.all([
          client.getMinerInfo(opts.address),
          client.getMinerPower(opts.address),
        ]);

        const data = {
          address: opts.address,
          owner: info.owner,
          worker: info.worker,
          sectorSize: info.sectorSize,
          sectorSizeHuman: formatBytes(info.sectorSize),
          peerID: info.peerID,
          minerPower: power.minerPower,
          totalPower: power.totalPower,
          hasMinPower: power.hasMinPower,
        };

        if (opts.pretty) {
          header(`Miner: ${opts.address}`);
          row('Owner', info.owner);
          row('Worker', info.worker);
          row('Sector Size', formatBytes(info.sectorSize));
          row('Peer ID', info.peerID || '(none)');
          console.log();
          row('Miner Power', power.minerPower);
          row('Total Power', power.totalPower);
          row('Has Min Power', String(power.hasMinPower));
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
