"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, Sparkles, X, Plus } from "lucide-react"
import type { SoulFileData } from "@/lib/types"
import { cn } from "@/lib/utils"

interface StepInterestsProps {
  soulData: Partial<SoulFileData>
  updateSoulData: (data: Partial<SoulFileData>) => void
  onNext: () => void
  onPrev: () => void
}

const ALL_INTERESTS = [
  "LLMs", "AI/ML", "Distributed Systems", "Backend Development", "Frontend Development",
  "DevOps", "Cloud Infrastructure", "Kubernetes", "Systems Programming", "Rust",
  "TypeScript", "Python", "Go", "Product Management", "Developer Tools", "Open Source",
  "High-Performance Computing", "WASM", "Memory Safety", "Data Engineering", "MLOps",
  "API Design", "Microservices", "Database Design", "Security", "Cryptography",
  "Mechanical Keyboards", "Biohacking", "Espresso Brewing", "Indie Hacking", "Startups",
  "Product Design", "Photography", "Running", "Cycling", "Climbing", "Travel",
  "Reading", "Writing", "Podcasts", "Music Production", "Gaming", "Longevity",
  "Meditation", "Fitness", "Cooking", "Wine", "Coffee", "Tea", "Minimalism"
]

const RELATED_INTERESTS: Record<string, string[]> = {
  "Biohacking": ["Longevity", "Fitness", "Meditation", "Supplements", "Sleep Optimization"],
  "Rust": ["WASM", "Memory Safety", "Systems Programming", "Performance", "Embedded"],
  "LLMs": ["AI/ML", "Prompt Engineering", "RAG", "Fine-tuning", "AI Safety"],
  "AI/ML": ["LLMs", "MLOps", "Data Engineering", "Python", "Deep Learning"],
  "Startups": ["Indie Hacking", "Product Management", "Fundraising", "Growth", "YC"],
  "Espresso Brewing": ["Coffee", "Latte Art", "Home Roasting", "Specialty Coffee"],
  "Mechanical Keyboards": ["Custom Builds", "Switches", "Keycaps", "Ergonomics"],
  "Open Source": ["GitHub", "Community", "Developer Tools", "Documentation"],
  "Distributed Systems": ["Kubernetes", "Microservices", "Scalability", "Consensus"],
  "TypeScript": ["React", "Node.js", "Frontend Development", "Type Safety"],
  "Python": ["Data Science", "AI/ML", "Automation", "FastAPI", "Django"],
  "Product Management": ["User Research", "Roadmapping", "Metrics", "Strategy"],
  "Fitness": ["Running", "Cycling", "Climbing", "Strength Training", "Recovery"],
}

const EXTRACTED_FROM_RESUME = [
  "TypeScript", "React", "Distributed Systems", "AI/ML", "Startups"
]

export function StepInterests({ soulData, updateSoulData, onNext, onPrev }: StepInterestsProps) {
  const [interests, setInterests] = useState<string[]>(() => {
    if (soulData.raw_assets?.interests && soulData.raw_assets.interests.length > 0) {
      return soulData.raw_assets.interests
    }
    return EXTRACTED_FROM_RESUME
  })
  const [interestInput, setInterestInput] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const typeaheadSuggestions = useMemo(() => {
    if (!interestInput.trim()) return []
    const query = interestInput.toLowerCase()
    return ALL_INTERESTS
      .filter(i => i.toLowerCase().includes(query) && !interests.includes(i))
      .slice(0, 6)
  }, [interestInput, interests])

  const contextualSuggestions = useMemo(() => {
    const suggestions = new Set<string>()
    interests.forEach(interest => {
      const related = RELATED_INTERESTS[interest]
      if (related) {
        related.forEach(r => {
          if (!interests.includes(r)) suggestions.add(r)
        })
      }
    })
    if (suggestions.size === 0) {
      const popular = ["LLMs", "Startups", "Open Source", "Fitness", "Coffee"]
      popular.forEach(p => {
        if (!interests.includes(p)) suggestions.add(p)
      })
    }
    return Array.from(suggestions).slice(0, 8)
  }, [interests])

  const addInterest = (interest: string) => {
    const trimmed = interest.trim()
    if (trimmed && !interests.includes(trimmed)) {
      setInterests((prev) => [...prev, trimmed])
      setInterestInput("")
      setShowDropdown(false)
    }
  }

  const removeInterest = (interest: string) => {
    setInterests((prev) => prev.filter((i) => i !== interest))
  }

  const handleNext = () => {
    updateSoulData({
      raw_assets: {
        ...soulData.raw_assets,
        interests,
      },
    })
    onNext()
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-light mb-3 text-white">
          Interests
        </h1>
        <p className="text-white/50">
          We match you on skills and personality.
        </p>
      </div>

      <div className="space-y-8">
        {/* Extracted from resume */}
        {interests.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-white/40">
              <Sparkles className="w-4 h-4" />
              <span>Found in your resume</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {interests.map((interest) => (
                <span 
                  key={interest} 
                  className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/20 text-white text-sm"
                >
                  {interest}
                  <button
                    onClick={() => removeInterest(interest)}
                    className="opacity-50 hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Hero Input */}
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            placeholder="Type to add more..."
            value={interestInput}
            onChange={(e) => {
              setInterestInput(e.target.value)
              setShowDropdown(true)
            }}
            onFocus={() => {
              setInputFocused(true)
              setShowDropdown(true)
            }}
            onBlur={() => setInputFocused(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                if (typeaheadSuggestions.length > 0) {
                  addInterest(typeaheadSuggestions[0])
                } else if (interestInput.trim()) {
                  addInterest(interestInput)
                }
              }
              if (e.key === "Escape") {
                setShowDropdown(false)
              }
            }}
            className={cn(
              "w-full h-14 bg-transparent border-0 border-b-2 text-lg placeholder:text-white/20 focus:outline-none transition-colors px-0 pr-10",
              inputFocused ? "border-white/50" : "border-white/10"
            )}
          />
          
          <button
            onClick={() => {
              if (interestInput.trim()) addInterest(interestInput)
            }}
            className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-white/30 hover:text-white/70 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
          
          {/* Typeahead dropdown */}
          {showDropdown && typeaheadSuggestions.length > 0 && (
            <div 
              ref={dropdownRef}
              className="absolute z-10 w-full mt-2 bg-black/90 border border-white/10 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl"
            >
              {typeaheadSuggestions.map((suggestion, index) => (
                <button
                  key={suggestion}
                  onClick={() => addInterest(suggestion)}
                  className={cn(
                    "w-full px-4 py-3 text-left text-sm hover:bg-white/5 flex items-center gap-3 transition-colors",
                    index === 0 && "bg-white/[0.03]"
                  )}
                >
                  <span className="w-2 h-2 rounded-full bg-white/30" />
                  <span className="text-white/80">{suggestion}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Contextual suggestions */}
        <div className="space-y-3">
          <span className="text-xs text-white/30">Suggestions</span>
          <div className="flex flex-wrap gap-2">
            {contextualSuggestions.map((interest) => (
              <button
                key={interest}
                onClick={() => addInterest(interest)}
                className="px-3 py-1.5 rounded-full border border-dashed border-white/20 text-white/40 text-sm transition-all hover:border-white/40 hover:text-white/70 hover:bg-white/5"
              >
                + {interest}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between pt-6">
          <Button 
            variant="ghost" 
            onClick={onPrev} 
            className="gap-2 text-white/50 hover:text-white hover:bg-white/5"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <Button 
            onClick={handleNext} 
            className="gap-2 bg-white text-black hover:bg-white/90 border-0 h-12 px-6"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
