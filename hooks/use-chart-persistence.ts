"use client"

import { useEffect, useState } from "react"

export interface ChartLayout {
  id: string
  x: number
  y: number
  width: number
  height: number
}

const STORAGE_KEY = "chart-layouts"

export function useChartPersistence() {
  const [layouts, setLayouts] = useState<ChartLayout[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load layouts from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setLayouts(parsed)
      }
    } catch (error) {
      console.error("Failed to load chart layouts:", error)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Save layouts to localStorage whenever they change
  useEffect(() => {
    if (isLoaded && layouts.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(layouts))
      } catch (error) {
        console.error("Failed to save chart layouts:", error)
      }
    }
  }, [layouts, isLoaded])

  const updateLayout = (id: string, updates: Partial<Omit<ChartLayout, "id">>) => {
    setLayouts(prev => {
      const existing = prev.find(layout => layout.id === id)
      if (existing) {
        return prev.map(layout =>
          layout.id === id ? { ...layout, ...updates } : layout
        )
      } else {
        // Create new layout entry
        return [...prev, {
          id,
          x: 0,
          y: 0,
          width: 320,
          height: 240,
          ...updates,
        }]
      }
    })
  }

  const getLayout = (id: string): ChartLayout | undefined => {
    return layouts.find(layout => layout.id === id)
  }

  return {
    layouts,
    isLoaded,
    updateLayout,
    getLayout,
  }
}