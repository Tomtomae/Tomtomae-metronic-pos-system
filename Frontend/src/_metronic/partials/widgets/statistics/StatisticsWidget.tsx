import React, { useEffect, useRef, useState, useCallback } from 'react'
import axios from 'axios'
import ApexCharts, { ApexOptions } from 'apexcharts'
import { KTIcon } from '../../../helpers'
import { getCSS } from '../../../assets/ts/_utils'
import { useThemeMode } from '../../layout/theme-mode/ThemeModeProvider'
import clsx from 'clsx'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
type CurrencyType = 'LAK' | 'THB' | 'USD'
export type StatDataType = 'quotation' | 'invoice' | 'income'

interface IChartSeries {
  name: string
  data: number[]
}

interface ITotalByCurrency {
  LAK: number
  THB: number
  USD: number
}

interface IApiResponseData {
  status?: string
  currency?: string
  amount?: number | string
  grandTotal?: number | string
  paymentDate?: string | Date
  issueDate?: string | Date
  createdAt?: string | Date
}


const DATA_CONFIG: Record<StatDataType, { endpoint: string }> = {
  quotation: { endpoint: '/quotations' },
  invoice:   { endpoint: '/invoice' },
  income:    { endpoint: '/payment/all' },   // ✅ ປ່ຽນ /payment/all → /payment (Backend filter by role)
}

interface Props {
  className:   string
  svgIcon:     string
  color:       string
  description: string
  dataType:    StatDataType
}

const apiUrl = import.meta.env.VITE_APP_API_URL
const REFRESH_INTERVAL_MS = 5000

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const normalizeCurrency = (cur: string | undefined): CurrencyType | null => {
  const c = (cur || '').toUpperCase().trim()
  if (c === 'LAK' || c === 'THB' || c === 'USD') return c as CurrencyType
  return null
}

const emptyTotals = (): ITotalByCurrency => ({ LAK: 0, THB: 0, USD: 0 })

const parseAmount = (val: string | number | undefined | null): number => {
  if (val == null) return 0
  if (typeof val === 'number') return val
  return Number(String(val).replace(/,/g, '')) || 0
}

function getBaseChartOptions(height: number): ApexOptions {
  return {
    chart: {
      type: 'area',
      height,
      sparkline: { enabled: true },
      toolbar: { show: false },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        dynamicAnimation: { enabled: true, speed: 350 },
      },
    },
    stroke: { curve: 'smooth', width: 3 },
    fill: { type: 'solid', opacity: 0.1 },
    colors: ['#00C853', '#FFD600', '#2979FF'],
    xaxis: {
      categories: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
      labels: { show: false },
    },
    yaxis: {
      min: 0,
      labels: { show: false },
    },
    tooltip: {
      y: {
        formatter: (val: number, { seriesIndex, w }) => {
          const seriesName = w.globals.seriesNames[seriesIndex]
          const symbols: Record<string, string> = { LAK: '₭', THB: '฿', USD: '$' }
          return `${symbols[seriesName] || ''} ${val.toLocaleString()}`
        },
      },
    },
  }
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
const StatisticsWidget1: React.FC<Props> = ({
  className,
  svgIcon,
  color,
  description,
  dataType,
}) => {
  const chartRef      = useRef<HTMLDivElement | null>(null)
  const chartInstance = useRef<ApexCharts | null>(null)
  const { mode }      = useThemeMode()

  const [count,       setCount]       = useState<number>(0)
  const [totals,      setTotals]      = useState<ITotalByCurrency>(emptyTotals())
  const [chartSeries, setChartSeries] = useState<IChartSeries[]>([])
  const [loading,     setLoading]     = useState<boolean>(true)

  // ── Fetch (Role filter handled by Backend) ──────────────────
  const fetchDashboardData = useCallback(async () => {
    try {
      const { endpoint } = DATA_CONFIG[dataType]
      const { data } = await axios.get<IApiResponseData[]>(`${apiUrl}${endpoint}`)

      if (!data) return

      const t = emptyTotals()
      const cLAK = new Array(12).fill(0)
      const cTHB = new Array(12).fill(0)
      const cUSD = new Array(12).fill(0)

      let validCount = 0

      data.forEach((item) => {
        let curRaw: string | undefined
        let valRaw: string | number | undefined
        let dateRaw: string | Date | undefined

        if (dataType === 'income') {
          if (item.status && String(item.status).toLowerCase() !== 'completed') return
          curRaw  = item.currency
          valRaw  = item.amount
          dateRaw = item.paymentDate || item.createdAt

        } else if (dataType === 'invoice') {
          if (item.status && String(item.status).toLowerCase() === 'cancelled') return
          curRaw  = item.currency
          valRaw  = item.grandTotal
          dateRaw = item.issueDate || item.createdAt

        } else if (dataType === 'quotation') {
          curRaw  = item.currency
          valRaw  = item.grandTotal
          dateRaw = item.issueDate || item.createdAt
        }

        validCount++
        const cur = normalizeCurrency(curRaw)
        if (!cur) return

        const val = parseAmount(valRaw)
        t[cur] += val

        const d = new Date(dateRaw as string | Date)
        if (!isNaN(d.getTime())) {
          const monthIndex = d.getMonth()
          if (cur === 'LAK') cLAK[monthIndex] += val
          if (cur === 'THB') cTHB[monthIndex] += val
          if (cur === 'USD') cUSD[monthIndex] += val
        }
      })

      setCount(validCount)
      setTotals(t)
      setChartSeries([
        { name: 'LAK', data: cLAK },
        { name: 'THB', data: cTHB },
        { name: 'USD', data: cUSD },
      ])
    } catch (err) {
      console.error(`[${dataType}] Widget Error:`, err)
    }
  }, [dataType])

  // ── Real-time Polling ───────────────────────────────────────
  useEffect(() => {
    setLoading(true)
    fetchDashboardData().finally(() => setLoading(false))

    const intervalId = setInterval(() => {
      fetchDashboardData()
    }, REFRESH_INTERVAL_MS)

    return () => clearInterval(intervalId)
  }, [fetchDashboardData])

  // ── Chart render / update ───────────────────────────────────
  useEffect(() => {
    if (!chartRef.current) return

    if (!chartInstance.current) {
      const height  = parseInt(getCSS(chartRef.current, 'height') || '150')
      const options = getBaseChartOptions(height)
      options.series = chartSeries.length ? chartSeries : []

      const chart = new ApexCharts(chartRef.current, options)
      chart.render()
      chartInstance.current = chart
    } else {
      if (chartSeries.length > 0) {
        chartInstance.current.updateSeries(chartSeries)
      }
    }

    // Destroy only when component unmounts (mode change just updates)
    return () => {
      if (mode) return // keep alive on theme change
      chartInstance.current?.destroy()
      chartInstance.current = null
    }
  }, [chartSeries, mode])

  // ── Render totals block ─────────────────────────────────────
  const renderChange = () => {
    if (loading) {
      return <span className='fs-6 text-muted'>ກຳລັງໂຫຼດ...</span>
    }

    return (
      <div className='d-flex flex-column align-items-end'>
        {(Object.keys(totals) as CurrencyType[]).map((key) => (
          <div key={key} className='d-flex align-items-center mb-1'>
            <span className='fs-7 text-muted me-2'>{key}:</span>
            <span className='fs-5 fw-bold text-gray-900'>
              {totals[key].toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    )
  }

  const cardLabel = `${description} (${loading ? '...' : count})`

  return (
    <div className={`card ${className}`}>
      <div className='card-body p-0'>
        <div className='d-flex flex-stack card-p flex-grow-1 align-items-center'>
          <span className={clsx('symbol symbol-50px me-2')}>
            <span className={clsx('symbol-label', `bg-light-${color}`)}>
              <KTIcon iconName={svgIcon} className={`fs-2x text-${color}`} />
            </span>
          </span>
          <div className='d-flex flex-column text-end'>
            <div className='text-gray-900 fw-bold fs-3 lh-1'>{renderChange()}</div>
            <span className='text-muted fw-semibold mt-1 fs-7'>{cardLabel}</span>
          </div>
        </div>
        <div
          ref={chartRef}
          className='statistics-widget-4-chart card-rounded-bottom'
          style={{ height: '150px' }}
        />
      </div>
    </div>
  )
}

export { StatisticsWidget1 }