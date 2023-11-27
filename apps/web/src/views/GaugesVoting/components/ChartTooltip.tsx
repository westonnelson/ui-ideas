import { Percent } from '@pancakeswap/swap-sdk-core'
import { Flex, Text, useMatchBreakpoints } from '@pancakeswap/uikit'
import { GAUGE_TYPE_NAMES, GaugeType } from 'config/constants/types'
import { useMemo } from 'react'
import styled from 'styled-components'
import { Address } from 'viem'
import { feeTierPercent } from 'views/V3Info/utils'
import { useGaugeConfig } from '../hooks/useGaugePair'
import { GaugeVoting } from '../hooks/useGaugesVoting'
import { TripleLogo } from './TripleLogo'

const Indicator = styled.div`
  background: linear-gradient(0deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.2) 100%), #8051d6;
  border-radius: 30px 0px 0px 30px;
  border: 2px solid #8051d6;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.625em;
`

const Content = styled(Flex).attrs({ alignItems: 'center' })`
  border-radius: 0px 30px 30px 0px;
  border: 2px solid #8051d6;
  padding: 0.625em;
  background: ${({ theme }) => theme.colors.backgroundAlt};
  gap: 0.25em;
  overflow: hidden;
`

const Tooltip = styled.div.withConfig({ shouldForwardProp: (prop) => prop !== 'string' })<{ color?: string }>`
  display: inline-flex;

  ${Indicator} {
    transition: all 0.25s ease-in-out;
    border-color: ${({ color }) => color || '#8051d6'};
    background: linear-gradient(0deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.2) 100%),
      ${({ color }) => color || '#8051d6'};
  }

  ${Content} {
    transition: border-color 0.25s ease-in-out;
    border-color: ${({ color }) => color || '#8051d6'};
  }
`

export const ChartTooltip: React.FC<{
  color: string
  visible: boolean
  gauge?: GaugeVoting
  total?: number
  allGauges?: GaugeVoting[]
}> = ({ color, allGauges, gauge, visible, total }) => {
  const { isDesktop } = useMatchBreakpoints()
  const sortedGauges = useMemo(() => {
    return allGauges?.filter((x) => x.weight > 0).sort((a, b) => (a.weight < b.weight ? 1 : -1))
  }, [allGauges])
  const sort = useMemo(() => {
    if (!gauge?.weight) return '0'
    const index = (sortedGauges?.findIndex((g) => g.hash === gauge.hash) ?? 0) + 1
    if (index < 10) return `0${index}`
    return index
  }, [gauge?.hash, gauge?.weight, sortedGauges])
  const percent = useMemo(() => {
    return new Percent(gauge?.weight ?? 0, total || 1).toFixed(2)
  }, [total, gauge?.weight])

  const pool = useGaugeConfig(gauge?.pairAddress as Address, Number(gauge?.chainId || undefined))

  if (!visible) return null

  return (
    <Tooltip color={color}>
      <Indicator>
        <Text color="white" fontSize={12} lineHeight="1.4">
          # {sort}{' '}
        </Text>
        <Text color="white" fontSize={18} lineHeight="1.4" bold>
          {percent}%
        </Text>
      </Indicator>
      <Content flexShrink={isDesktop ? 0 : 1}>
        <TripleLogo gaugeConfig={pool} chainId={Number(gauge?.chainId)} size={36} />
        <Flex flexDirection="column">
          <Text fontSize={18} bold lineHeight={1.2} color="text">
            {pool?.pairName}
          </Text>
          <Flex alignItems="center">
            {[GaugeType.V3, GaugeType.V2].includes(pool?.type) ? (
              <>
                <Text fontSize={12} lineHeight={1.2} color="textSubtle">
                  {feeTierPercent(pool.feeTier)}
                </Text>
                <Text color="textSubtle" mx="0.375em" style={{ opacity: 0.2 }}>
                  |
                </Text>
              </>
            ) : null}
            <Text fontSize={12} color="textSubtle" lineHeight={1.2}>
              {pool ? GAUGE_TYPE_NAMES[pool.type] : ''}
            </Text>
          </Flex>
        </Flex>
      </Content>
    </Tooltip>
  )
}
