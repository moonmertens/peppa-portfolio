'use client'

import React from 'react'
import { useInView } from '@/lib/hooks/useInView'

interface FadeInProps {
  children: React.ReactNode
  className?: string
  delay?: number // stagger delay in ms, applied via inline style
}

export function FadeIn({ children, className = '', delay = 0 }: FadeInProps) {
  const { ref, isVisible } = useInView<HTMLDivElement>()
  return (
    <div
      ref={ref}
      className={`${isVisible ? 'fade-in-visible' : 'fade-in-hidden'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}
