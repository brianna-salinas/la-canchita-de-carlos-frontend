import { Banknote, CreditCard } from 'lucide-react'

type MetodoPago = 'EFECTIVO' | 'YAPE' | 'OTRO'

interface MetodoPagoIconProps {
  value: MetodoPago
  className?: string
}

export default function MetodoPagoIcon({ value, className = 'h-5 w-5' }: MetodoPagoIconProps) {
  if (value === 'EFECTIVO') {
    return <Banknote className={`${className} text-success`} />
  }

  if (value === 'OTRO') {
    return <CreditCard className={`${className} text-neutral-500 dark:text-neutral-400`} />
  }

  return (
    <span className="inline-flex items-center -space-x-1.5">
      <span
        className="h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white ring-2 ring-white dark:ring-neutral-800"
        style={{ backgroundColor: '#6D2E8E' }}
        aria-hidden="true"
      >
        Y
      </span>
      <span
        className="h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white ring-2 ring-white dark:ring-neutral-800"
        style={{ backgroundColor: '#00B8A9' }}
        aria-hidden="true"
      >
        P
      </span>
    </span>
  )
}
