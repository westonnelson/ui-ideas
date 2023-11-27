import { useQuery } from '@tanstack/react-query'
import { gaugesVotingABI } from 'config/abi/gaugesVoting'
import { useActiveChainId } from 'hooks/useActiveChainId'
import { useGaugesVotingContract } from 'hooks/useContract'
import { Address, ContractFunctionConfig, ContractFunctionResult, MulticallContracts } from 'viem'
import { useGaugesVotingCount } from 'views/CakeStaking/hooks/useGaugesVotingCount'
import { usePublicClient } from 'wagmi'
import { getGaugeHash } from '../utils'

export type GaugeInfo = {
  hash: string
  pairAddress: Address
  masterChef: Address
  pid: bigint
  chainId: bigint
  boostMultiplier: bigint
  maxVoteCap: bigint
}

export const useGauges = () => {
  const gaugesVotingContract = useGaugesVotingContract()
  const gaugesCount = useGaugesVotingCount()
  const { chainId } = useActiveChainId()
  const publicClient = usePublicClient({ chainId })
  const { data } = useQuery(
    ['gauges', Number(gaugesCount), gaugesVotingContract.address, gaugesVotingContract.chain?.id],
    async (): Promise<GaugeInfo[]> => {
      if (!gaugesCount) return []
      const contracts: MulticallContracts<ContractFunctionConfig<typeof gaugesVotingABI, 'gauges'>[]> = []
      for (let index = 0; index < gaugesCount; index++) {
        contracts.push({
          ...gaugesVotingContract,
          functionName: 'gauges',
          args: [BigInt(index)],
        } as const)
      }

      const response = (await publicClient.multicall({
        contracts,
        allowFailure: false,
      })) as ContractFunctionResult<typeof gaugesVotingABI, 'gauges'>[]

      const result = response.reduce((prev, curr) => {
        const [pid, masterChef, _chainId, pairAddress, boostMultiplier, maxVoteCap] = curr
        return [
          ...prev,
          {
            pid,
            masterChef,
            chainId: _chainId,
            pairAddress,
            boostMultiplier,
            maxVoteCap,
            hash: getGaugeHash(pairAddress, Number(_chainId)),
          },
        ]
      }, [] as GaugeInfo[])

      return result
    },
    {
      enabled: !!gaugesVotingContract,
      keepPreviousData: true,
    },
  )

  return data
}
