import { Percent } from '@pancakeswap/sdk'
import formatLocalisedCompactNumber, { getBalanceNumber } from '@pancakeswap/utils/formatBalance'
import BN from 'bignumber.js'
import { useVeCakeBalance } from 'hooks/useTokenBalance'
import { useEffect, useMemo } from 'react'
import { Hex } from 'viem'
import { useCurrentBlockTimestamp } from 'views/CakeStaking/hooks/useCurrentBlockTimestamp'
import { useEpochVotePower } from 'views/GaugesVoting/hooks/useEpochVotePower'
import { useUserVote } from 'views/GaugesVoting/hooks/useUserVote'
import { RowProps } from '../types'

export const useRowVoteState = ({ data, vote, onChange }: RowProps) => {
  const userVote = useUserVote(data)
  const voteLocked = userVote?.voteLocked
  const { balance: veCakeBalance } = useVeCakeBalance()
  const currentTimestamp = useCurrentBlockTimestamp()
  const epochVotePower = useEpochVotePower()
  const willUnlock = useMemo(
    () => epochVotePower === 0n && Boolean(userVote?.slope && userVote?.slope > 0),
    [userVote?.slope, epochVotePower],
  )
  // const nextEpochStart = useNextEpochStart()
  const currentVoteWeightAmount = useMemo(() => {
    const { nativeSlope = 0n, nativeEnd = 0n, proxySlope = 0n, proxyEnd = 0n } = userVote || {}
    let nativeWeight = 0n
    let proxyWeight = 0n
    if (nativeSlope > 0n) {
      nativeWeight = nativeSlope * (nativeEnd - BigInt(currentTimestamp))
      nativeWeight = nativeWeight > 0n ? nativeWeight : 0n
    }
    if (proxySlope > 0n) {
      proxyWeight = proxySlope * (proxyEnd - BigInt(currentTimestamp))
      proxyWeight = proxyWeight > 0n ? proxyWeight : 0n
    }

    const amountInt = nativeWeight + proxyWeight
    return amountInt
  }, [currentTimestamp, userVote])

  const currentVoteWeight = useMemo(() => {
    const amount = getBalanceNumber(new BN(currentVoteWeightAmount.toString()))
    if (amount === 0) return 0
    if (amount < 1) return amount.toPrecision(2)
    return amount < 1000 ? amount.toFixed(2) : formatLocalisedCompactNumber(amount, true)
  }, [currentVoteWeightAmount])

  const currentVotePercent = useMemo(() => {
    return userVote?.power && Number(currentVoteWeightAmount) > 0
      ? String(Number(new Percent(userVote?.power, 10000).toFixed(2)))
      : undefined
  }, [currentVoteWeightAmount, userVote?.power])

  const voteValue = useMemo(() => {
    if (voteLocked) return currentVotePercent ?? ''
    return willUnlock ? '0' : vote?.power ?? ''
  }, [voteLocked, currentVotePercent, willUnlock, vote?.power])

  const previewVoteWeight = useMemo(() => {
    const p = Number(voteValue || 0) * 100
    // const powerBN = new BN(epochVotePower.toString())
    const amount = getBalanceNumber(veCakeBalance.times(p).div(10000))

    if (amount === 0) return 0
    if (amount < 1) return amount.toPrecision(2)
    return amount < 1000 ? amount.toFixed(2) : formatLocalisedCompactNumber(amount, true)
  }, [veCakeBalance, voteValue])

  // init vote value if still default
  useEffect(() => {
    if (userVote?.hash && (!vote?.hash || vote?.hash === '0x')) {
      onChange({
        hash: userVote.hash as Hex,
        power: voteValue,
        locked: voteLocked,
      })
    }
  }, [onChange, userVote?.hash, vote, voteLocked, voteValue])

  return {
    currentVoteWeight,
    currentVotePercent,
    previewVoteWeight,
    voteValue,
    voteLocked,
    willUnlock,
  }
}
