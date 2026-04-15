import { type HTMLAttributes } from 'react'

interface PageSectionProps extends HTMLAttributes<HTMLElement> {
  // Render as a different HTML element (default: section)
  as?: keyof JSX.IntrinsicElements
  // Narrower max-width for focused content like forms
  narrow?: boolean
}

export default function PageSection({
  as: Tag = 'section',
  narrow = false,
  className = '',
  children,
  ...props
}: PageSectionProps) {
  return (
    // @ts-expect-error — dynamic tag; safe for a styling-only wrapper
    <Tag
      className={[
        'w-full mx-auto px-4 py-8',
        narrow ? 'max-w-xl' : 'max-w-2xl',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </Tag>
  )
}
