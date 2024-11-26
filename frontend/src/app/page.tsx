'use client'

import { useState, useEffect } from 'react'
import { Moon, Sun, Send } from 'lucide-react'

interface GitaResponse {
  chapter: number
  verse: number
  translation: string
  summarized_commentary: string
}

export default function Home() {
  const [query, setQuery] = useState('')
  const [response, setResponse] = useState<GitaResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark'
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light')
    setTheme(initialTheme)
    document.documentElement.setAttribute('data-theme', initialTheme)
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })


      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResponse(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const resetPage = () => {
    setQuery('')
    setResponse(null)
    setError('')
    setLoading(false)
  }

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <h1 
            onClick={resetPage}
            className="text-4xl font-bold bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent animate-typing cursor-pointer"
          >
            GitaChat
          </h1>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-secondary/20 transition-colors"
          >
            {theme === 'light' ? <Moon size={24} /> : <Sun size={24} />}
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about the Bhagavad Gita..."
              className="gita-input pr-[100px]"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="gita-button absolute right-2 top-1/2 -translate-y-1/2 !py-2"
            >
              {loading ? (
                'Loading...'
              ) : (
                <>
                  Ask <Send className="inline-block ml-2 w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="p-4 mb-4 text-red-500 bg-red-100/10 rounded-xl border border-red-500/20">
            {error}
          </div>
        )}

        {response && (
          <div className="gita-card space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-primary font-medium">
                Chapter {response.chapter}, Verse {response.verse}
              </span>
              <span className="px-3 py-1 text-xs rounded-full bg-accent text-accent-foreground">
                Bhagavad Gita
              </span>
            </div>
            
            <div className="text-xl font-medium">
              {response.translation}
            </div>
            
            <div className="pt-6 border-t border-card-border">
              <h3 className="font-medium mb-3 text-primary">Commentary</h3>
              <p className="text-foreground/80 leading-relaxed">
                {response.summarized_commentary}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
