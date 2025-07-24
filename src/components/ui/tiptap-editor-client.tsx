'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import the TiptapEditor with SSR disabled
const TiptapEditorComponent = dynamic(
  () => import('./tiptap-editor').then((mod) => ({ default: mod.TiptapEditor })),
  { 
    ssr: false,
    loading: () => (
      <div className="border rounded-lg bg-white min-h-[200px] flex items-center justify-center">
        <div className="text-gray-500">Loading editor...</div>
      </div>
    )
  }
)

interface TiptapEditorClientProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
  dir?: 'ltr' | 'rtl'
}

export function TiptapEditorClient(props: TiptapEditorClientProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <div className="border rounded-lg bg-white min-h-[200px] flex items-center justify-center">
        <div className="text-gray-500">Loading editor...</div>
      </div>
    )
  }

  return <TiptapEditorComponent {...props} />
} 