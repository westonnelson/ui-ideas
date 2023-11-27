import { useTranslation } from '@pancakeswap/localization'
import { Percent } from '@pancakeswap/sdk'
import {
  AddCircleIcon,
  Button,
  CheckmarkCircleFillIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CrossIcon,
  ErrorIcon,
  Flex,
  FlexGap,
  Tag,
  Text,
} from '@pancakeswap/uikit'
import formatLocalisedCompactNumber, { getBalanceNumber } from '@pancakeswap/utils/formatBalance'
import BN from 'bignumber.js'
import { GAUGE_TYPE_NAMES, GaugeType } from 'config/constants/types'
import { useHover } from 'hooks/useHover'
import { useCallback, useMemo, useState } from 'react'
import styled from 'styled-components'
import { Address } from 'viem'
import { Tooltips } from 'views/CakeStaking/components/Tooltips'
import { useGaugeConfig } from 'views/GaugesVoting/hooks/useGaugePair'
import { GaugeVoting } from 'views/GaugesVoting/hooks/useGaugesVoting'
import { feeTierPercent } from 'views/V3Info/utils'
import { GaugeTokenImage } from '../../GaugeTokenImage'
import { NetworkBadge } from '../../NetworkBadge'
import { TRow } from '../styled'
import { RowData } from './types'

const SelectButton = styled(Button)`
  &:disabled {
    background-color: transparent;
  }
`

export const TableRow: React.FC<{
  data: RowData
  selectable?: boolean
  locked?: boolean
  selected?: boolean
  onSelect?: (hash: GaugeVoting['hash']) => void
  totalGaugesWeight?: number
}> = ({ data, locked, totalGaugesWeight, selected, selectable, onSelect }) => {
  const { t } = useTranslation()
  const pool = useGaugeConfig(data?.pairAddress as Address, Number(data?.chainId || undefined))

  const maxCapPercent = useMemo(() => {
    return new Percent(data?.maxVoteCap, 10000)
  }, [data?.maxVoteCap])

  const currentWeightPercent = useMemo(() => {
    return new Percent(data?.weight, totalGaugesWeight || 1)
  }, [data?.weight, totalGaugesWeight])

  const hitMaxCap = useMemo(() => {
    return maxCapPercent.greaterThan(0) && currentWeightPercent.greaterThan(maxCapPercent)
  }, [maxCapPercent, currentWeightPercent])

  const currentWeight = useMemo(() => {
    return getBalanceNumber(new BN(data?.weight || 0))
  }, [data?.weight])

  const [ref, isHover] = useHover<HTMLButtonElement>()

  return (
    <TRow>
      <FlexGap alignItems="center" gap="13px">
        {selectable ? (
          <span ref={ref}>
            <SelectButton
              variant="text"
              height={24}
              disabled={locked}
              p={0}
              mr="8px"
              onClick={() => onSelect?.(data.hash)}
            >
              {selected ? (
                isHover ? (
                  <CrossIcon color="#ED4B9E" />
                ) : (
                  <CheckmarkCircleFillIcon color="disabled" />
                )
              ) : (
                <AddCircleIcon color="primary" />
              )}
            </SelectButton>
          </span>
        ) : null}
        <GaugeTokenImage gauge={pool} />
        <Text fontWeight={600} fontSize={16}>
          {pool?.pairName}
        </Text>
        <FlexGap gap="5px" alignItems="center">
          <NetworkBadge chainId={Number(data?.chainId)} />
          {[GaugeType.V3, GaugeType.V2].includes(pool?.type) ? (
            <Tag outline variant="secondary">
              {feeTierPercent(pool.feeTier)}
            </Tag>
          ) : null}

          <Tag variant="secondary">{pool ? GAUGE_TYPE_NAMES[pool.type] : ''}</Tag>
        </FlexGap>
      </FlexGap>
      <Flex alignItems="center" pl="32px">
        <Tooltips
          disabled={!hitMaxCap}
          content={t(
            'This gauge has hit its voting cap. It can continue to receive votes, however, the vote numbers and allocation % will not increase until other gauges gain more votes.',
          )}
        >
          <Flex flexWrap="nowrap">
            <Text color={hitMaxCap ? 'failure' : ''} bold>
              {formatLocalisedCompactNumber(currentWeight, true)}
            </Text>
            <Text color={hitMaxCap ? 'failure' : ''} ml="2px">
              ({hitMaxCap ? maxCapPercent.toSignificant(2) : currentWeightPercent.toSignificant(2)}%)
            </Text>
            {hitMaxCap ? <ErrorIcon color="failure" style={{ marginBottom: '-2px' }} /> : null}
          </Flex>
        </Tooltips>
      </Flex>
      <Flex alignItems="center" pr="25px">
        <Text bold fontSize={16} color={data?.boostMultiplier > 100n ? '#1BC59C' : undefined}>
          {Number(data?.boostMultiplier) / 100}x
        </Text>
      </Flex>

      <Text bold={hitMaxCap}>
        {hitMaxCap ? 'MAX ' : ''}
        {maxCapPercent.toSignificant(2)}%
      </Text>
    </TRow>
  )
}

export const ExpandRow: React.FC<{
  onCollapse?: () => void
  text?: string
  expandedText?: string
}> = ({ onCollapse, text, expandedText }) => {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const handleCollapse = useCallback(() => {
    setExpanded((prev) => !prev)
    onCollapse?.()
  }, [onCollapse])
  const textToDisplay = expanded ? expandedText || t('Expanded') : text || t('Expand')

  return (
    <Flex alignItems="center" justifyContent="center" py="8px">
      <Button
        onClick={handleCollapse}
        variant="text"
        endIcon={expanded ? <ChevronUpIcon color="primary" /> : <ChevronDownIcon color="primary" />}
      >
        {textToDisplay}
      </Button>
    </Flex>
  )
}
