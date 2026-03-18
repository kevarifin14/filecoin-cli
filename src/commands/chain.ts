import { Command } from 'commander';
import { FilecoinClient } from '../api/client';
import { getRpcUrl, getIpfsGateway } from '../config/store';
import { header, row, jsonError } from '../utils/format';

export function makeChainCommand(): Command {
  const cmd = new Command('chain')
    .description('Get Filecoin chain info (head, network version, base fee)')
    .option('--pretty', 'Human-readable colored output')
    .action(async (opts) => {
      try {
        const client = new FilecoinClient(getRpcUrl(), getIpfsGateway());

        const [head, networkVersion, networkName, baseFee] = await Promise.all([
          client.getChainHead(),
          client.getNetworkVersion(),
          client.getNetworkName(),
          client.getBaseFee(),
        ]);

        const data = {
          network: networkName,
          networkVersion,
          height: head.height,
          baseFee,
          blockCount: head.blocks.length,
          latestMiner: head.blocks[0]?.miner || null,
          latestTimestamp: head.blocks[0]?.timestamp
            ? new Date(head.blocks[0].timestamp * 1000).toISOString()
            : null,
        };

        if (opts.pretty) {
          header('Filecoin Chain');
          row('Network', networkName);
          row('Network Version', networkVersion.toString());
          row('Height', head.height.toString());
          row('Base Fee', baseFee);
          row('Blocks in Tipset', head.blocks.length.toString());
          if (data.latestMiner) row('Latest Miner', data.latestMiner);
          if (data.latestTimestamp) row('Latest Timestamp', data.latestTimestamp);
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
