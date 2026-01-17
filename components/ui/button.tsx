import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[4px] text-sm font-medium transition-all duration-200 cursor-pointer disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-500/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive uppercase tracking-wide font-mono",
  {
    variants: {
      variant: {
        default: 'bg-white text-gray-900 hover:bg-gray-50 active:bg-gray-100 shadow-md hover:shadow-lg active:shadow-md transform hover:scale-[1.02] active:scale-[0.98]',
        destructive:
          'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-md hover:shadow-lg active:shadow-md transform hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-red-500/50',
        outline:
          'border-2 border-white bg-transparent text-white hover:bg-white/10 active:bg-white/20 shadow-sm hover:shadow-md active:shadow-sm transform hover:scale-[1.02] active:scale-[0.98]',
        secondary:
          'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 active:bg-gray-300 dark:active:bg-gray-600 shadow-sm hover:shadow-md active:shadow-sm transform hover:scale-[1.02] active:scale-[0.98]',
        ghost:
          'text-white hover:bg-white/10 active:bg-white/20',
        link: 'text-white underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-5 py-2.5 has-[>svg]:px-4 rounded-[4px]',
        sm: 'h-8 rounded-[4px] gap-1.5 px-3 has-[>svg]:px-2.5 text-xs',
        lg: 'h-12 rounded-[4px] px-8 has-[>svg]:px-6 text-base',
        icon: 'size-10 rounded-[4px]',
        'icon-sm': 'size-8 rounded-[4px]',
        'icon-lg': 'size-12 rounded-[4px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
