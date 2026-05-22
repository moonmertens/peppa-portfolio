'use client'

import { useState, useCallback, useRef } from 'react'
import { PieceImage } from '@/components/projects/PieceImage'
import { Lightbox } from '@/components/ui/Lightbox'
import type { ProjectDetail } from '@/lib/types'

interface ProjectDetailClientProps {
  project: ProjectDetail
  pieceImageUrls: string[]
}

export function ProjectDetailClient({
  project,
  pieceImageUrls,
}: ProjectDetailClientProps) {
  const [openIndex, setOpenIndex] = useState(-1)
  const pieceButtonRefs = useRef<(HTMLButtonElement | null)[]>([])

  const pieces = project.pieces ?? []

  const handleOpen = useCallback((i: number) => {
    setOpenIndex(i)
  }, [])

  const handleClose = useCallback(() => {
    const idx = openIndex
    setOpenIndex(-1)
    // Return focus to the triggering piece button
    setTimeout(() => {
      pieceButtonRefs.current[idx]?.focus()
    }, 0)
  }, [openIndex])

  const handlePrev = useCallback(() => {
    setOpenIndex((i) => Math.max(0, i - 1))
  }, [])

  const handleNext = useCallback(() => {
    setOpenIndex((i) => Math.min(pieces.length - 1, i + 1))
  }, [pieces.length])

  return (
    <>
      <section className="max-w-5xl mx-auto px-4 py-16 flex flex-col gap-20">
        {pieces.map((piece, index) => (
          <PieceImage
            key={piece._key}
            ref={(el) => {
              pieceButtonRefs.current[index] = el
            }}
            piece={piece}
            imageUrl={pieceImageUrls[index] ?? ''}
            index={index}
            onOpen={handleOpen}
            priority={index === 0}
          />
        ))}
      </section>

      <Lightbox
        pieces={pieces}
        imageUrls={pieceImageUrls}
        currentIndex={openIndex}
        onClose={handleClose}
        onPrev={handlePrev}
        onNext={handleNext}
      />
    </>
  )
}
