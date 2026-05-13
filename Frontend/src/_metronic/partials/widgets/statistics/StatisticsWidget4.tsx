import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import ApexCharts, { ApexOptions } from 'apexcharts'
import { KTIcon } from '../../../helpers'
import { getCSS, getCSSVariableValue } from '../../../assets/ts/_utils'
import { useThemeMode } from '../../layout/theme-mode/ThemeModeProvider'
import clsx from 'clsx'

interface ICustomerData {
  _id: string
  createdAt: string
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  className:   string
  svgIcon:     string
  color:       string
  description: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const apiUrl = import.meta.env.VITE_APP_API_URL

// ─── Chart options ────────────────────────────────────────────────────────────

function getChartOptions(
  height:    number,
  baseColor: string,
  chartData: number[]
): ApexOptions {
  const maxVal = Math.max(...(chartData.length > 0 ? chartData : [0]), 0)

  return {
    series: [
      { name: 'Customers', data: chartData }
    ],
    chart: {
      type:      'area',
      height,
      sparkline: { enabled: true },
      toolbar:   { show: false },
    },
    stroke: { curve: 'smooth', width: 3 },
    fill:   { type: 'solid', opacity: 0.1 },
    colors: [baseColor], // ใช้สีเดียวตาม Props 
    xaxis: {
      categories: [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ],
      labels: { show: false },
    },
    yaxis: {
      min:    0,
      max:    Math.ceil(maxVal * 1.2) || 10,
      labels: { show: false },
    },
    tooltip: {
      y: {
        formatter: (val: number) => {
          return `${val.toLocaleString()} ຄົນ` // แสดงเป็นจำนวนคน
        },
      },
    },
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

const StatisticsWidget4: React.FC<Props> = ({
  className,
  svgIcon,
  color,
  description,
}) => {
  const chartRef      = useRef<HTMLDivElement | null>(null)
  const chartInstance = useRef<ApexCharts | null>(null)
  const { mode }      = useThemeMode()

  const [count,     setCount]     = useState<number>(0)
  const [chartData, setChartData] = useState<number[]>(new Array(12).fill(0))
  const [loading,   setLoading]   = useState<boolean>(true)

  // ── fetch data ─────────────────────────────────────────────────────────────

  useEffect(() => {
    setLoading(true)

    axios
      .get(`${apiUrl}/Customer`)
      .then(({ data }) => {
        if (!data) return
        
        const customers = data as ICustomerData[]
        setCount(customers.length)

        // สร้าง Array เก็บข้อมูล 12 เดือน (กราฟเส้นเดียว)
        const monthly = new Array(12).fill(0)
        
        customers.forEach((c) => {
          const d = new Date(c.createdAt)
          if (!isNaN(d.getTime())) {
            monthly[d.getMonth()]++
          }
        })

        setChartData(monthly)
      })
      .catch((err) => {
        console.error(`[StatisticsWidget4][Customer]`, err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  // ── render chart ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (!chartRef.current) return

    chartInstance.current?.destroy()

    const height    = parseInt(getCSS(chartRef.current, 'height') || '150')
    const baseColor = getCSSVariableValue(`--bs-${color}`) || '#009EF7'

    const chart = new ApexCharts(
      chartRef.current,
      getChartOptions(height, baseColor, chartData)
    )
    
    chart.render()
    chartInstance.current = chart

    return () => {
      chartInstance.current?.destroy()
    }
  }, [color, mode, chartData])

  // ── JSX ────────────────────────────────────────────────────────────────────

  return (
    <div className={`card ${className}`}>
      <div className='card-body p-0'>
        <div className='d-flex flex-stack card-p flex-grow-1 align-items-center'>
          <span className={clsx('symbol symbol-50px', 'me-2')}>
            <span className={clsx('symbol-label', `bg-light-${color}`)}>
              <KTIcon iconName={svgIcon} className={`fs-2x text-${color}`} />
            </span>
          </span>

          <div className='d-flex flex-column text-end'>
            <div className='text-gray-900 fw-bold fs-3 lh-1'>
              {loading ? (
                <span className='fs-6 text-muted'>ກຳລັງໂຫຼດ...</span>
              ) : (
                <span className='fs-1 fw-bold text-gray-900'>
                  {count.toLocaleString()}
                </span>
              )}
            </div>
            <span className='text-muted fw-semibold mt-1 fs-7'>
              {description}
            </span>
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

export { StatisticsWidget4 }