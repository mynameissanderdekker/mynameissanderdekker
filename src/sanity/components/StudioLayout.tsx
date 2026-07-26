'use client'
import React from 'react'

interface LayoutProps {
  renderDefault: (props: LayoutProps) => React.JSX.Element
}

const css = `
  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.3); opacity: 0.7; }
  }
  .orders-badge-pulse {
    display: inline-block;
    animation: pulse 1.5s ease-in-out infinite;
  }
  @media (prefers-reduced-motion: reduce) {
    .orders-badge-pulse { animation: none; }
  }
`

export function StudioLayout({ renderDefault, ...props }: LayoutProps) {
  return (
    <>
      <style>{css}</style>
      {renderDefault({ renderDefault, ...props } as LayoutProps)}
    </>
  )
}
