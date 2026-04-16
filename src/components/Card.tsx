import { type HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean
}

export default function Card({
  elevated = false,
  className = '',
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={[
        'bg-cream-50 rounded-3xl p-6 transition-all duration-300',
        elevated ? 'shadow-[0_12px_40px_rgba(27,28,26,0.05)]' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}
