'use client'

import { useState, useEffect } from 'react'

const STORAGE_KEY = 'mnsdk-studio-lang'

export function useLang() {
  const [lang, setLangState] = useState<'en' | 'nl'>('nl')

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'nl' || stored === 'en') setLangState(stored)
  }, [])

  function setLang(l: 'en' | 'nl') {
    setLangState(l)
    localStorage.setItem(STORAGE_KEY, l)
  }

  return { lang, setLang }
}
