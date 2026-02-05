"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, X, Plus, MapPin, Briefcase } from "lucide-react"
import type { SoulFileData } from "@/lib/types"
import { cn } from "@/lib/utils"

interface StepHiringProps {
  soulData: Partial<SoulFileData>
  updateSoulData: (data: Partial<SoulFileData>) => void
  onNext: () => void
  onPrev: () => void
}

const COMMON_SKILLS = [
  "React", "TypeScript", "Python", "Node.js", "Go", "Rust", "AWS", "Kubernetes",
  "Machine Learning", "Data Science", "Product Management", "Design", "Sales",
  "Marketing", "Finance", "Operations", "Full Stack", "Backend", "Frontend",
  "Mobile", "iOS", "Android", "DevOps", "Security", "Blockchain", "AI/ML"
]

const COMMON_LOCATIONS = [
  "San Francisco, CA", "New York, NY", "Los Angeles, CA", "Seattle, WA",
  "Austin, TX", "Boston, MA", "Denver, CO", "Chicago, IL", "Miami, FL",
  "Remote", "US Only", "Worldwide"
]

export function StepHiring({ soulData, updateSoulData, onNext, onPrev }: StepHiringProps) {
  const [skillsDesired, setSkillsDesired] = useState<string[]>(soulData.hiringSkillsDesired || [])
  const [locationsDesired, setLocationsDesired] = useState<string[]>(soulData.hiringLocationsDesired || [])
  const [skillInput, setSkillInput] = useState("")
  const [locationInput, setLocationInput] = useState("")
  const [skillFocused, setSkillFocused] = useState(false)
  const [locationFocused, setLocationFocused] = useState(false)
  const [showSkillDropdown, setShowSkillDropdown] = useState(false)
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  
  const skillInputRef = useRef<HTMLInputElement>(null)
  const locationInputRef = useRef<HTMLInputElement>(null)
  const skillDropdownRef = useRef<HTMLDivElement>(null)
  const locationDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (skillDropdownRef.current && !skillDropdownRef.current.contains(e.target as Node) &&
          skillInputRef.current && !skillInputRef.current.contains(e.target as Node)) {
        setShowSkillDropdown(false)
      }
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(e.target as Node) &&
          locationInputRef.current && !locationInputRef.current.contains(e.target as Node)) {
        setShowLocationDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const skillSuggestions = useMemo(() => {
    if (!skillInput.trim()) return COMMON_SKILLS.filter(s => !skillsDesired.includes(s)).slice(0, 6)
    const query = skillInput.toLowerCase()
    return COMMON_SKILLS
      .filter(s => s.toLowerCase().includes(query) && !skillsDesired.includes(s))
      .slice(0, 6)
  }, [skillInput, skillsDesired])

  const locationSuggestions = useMemo(() => {
    if (!locationInput.trim()) return COMMON_LOCATIONS.filter(l => !locationsDesired.includes(l)).slice(0, 6)
    const query = locationInput.toLowerCase()
    return COMMON_LOCATIONS
      .filter(l => l.toLowerCase().includes(query) && !locationsDesired.includes(l))
      .slice(0, 6)
  }, [locationInput, locationsDesired])

  const addSkill = (skill: string) => {
    const trimmed = skill.trim()
    if (trimmed && !skillsDesired.includes(trimmed)) {
      setSkillsDesired(prev => [...prev, trimmed])
      setSkillInput("")
      setShowSkillDropdown(false)
    }
  }

  const addLocation = (location: string) => {
    const trimmed = location.trim()
    if (trimmed && !locationsDesired.includes(trimmed)) {
      setLocationsDesired(prev => [...prev, trimmed])
      setLocationInput("")
      setShowLocationDropdown(false)
    }
  }

  const removeSkill = (skill: string) => {
    setSkillsDesired(prev => prev.filter(s => s !== skill))
  }

  const removeLocation = (location: string) => {
    setLocationsDesired(prev => prev.filter(l => l !== location))
  }

  const handleNext = () => {
    updateSoulData({
      hiringSkillsDesired: skillsDesired,
      hiringLocationsDesired: locationsDesired,
    })
    onNext()
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-light mb-3 text-white">
          Who are you looking for?
        </h1>
        <p className="text-white/50">
          If you're here scouting for someone. Help us set the right hard filters for you.
        </p>
      </div>

      <div className="space-y-8">
        {/* Skills Desired */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-white/40">
            <Briefcase className="w-4 h-4" />
            <span>Skills you're looking for</span>
          </div>

          {skillsDesired.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {skillsDesired.map((skill) => (
                <span 
                  key={skill} 
                  className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/20 text-white text-sm"
                >
                  {skill}
                  <button
                    onClick={() => removeSkill(skill)}
                    className="opacity-50 hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="relative">
            <input
              ref={skillInputRef}
              type="text"
              placeholder="Add skills (e.g., React, Python, Product Management)"
              value={skillInput}
              onChange={(e) => {
                setSkillInput(e.target.value)
                setShowSkillDropdown(true)
              }}
              onFocus={() => {
                setSkillFocused(true)
                setShowSkillDropdown(true)
              }}
              onBlur={() => setSkillFocused(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  if (skillSuggestions.length > 0) {
                    addSkill(skillSuggestions[0])
                  } else if (skillInput.trim()) {
                    addSkill(skillInput)
                  }
                }
                if (e.key === "Escape") setShowSkillDropdown(false)
              }}
              className={cn(
                "w-full h-12 bg-transparent border-0 border-b-2 text-base placeholder:text-white/20 focus:outline-none transition-colors px-0 pr-10",
                skillFocused ? "border-white/50" : "border-white/10"
              )}
            />
            
            <button
              onClick={() => skillInput.trim() && addSkill(skillInput)}
              className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-white/30 hover:text-white/70 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>

            {showSkillDropdown && skillSuggestions.length > 0 && (
              <div 
                ref={skillDropdownRef}
                className="absolute z-10 w-full mt-2 bg-black/90 border border-white/10 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl"
              >
                {skillSuggestions.map((suggestion, index) => (
                  <button
                    key={suggestion}
                    onClick={() => addSkill(suggestion)}
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
        </div>

        {/* Locations Desired */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-white/40">
            <MapPin className="w-4 h-4" />
            <span>Preferred locations</span>
          </div>

          {locationsDesired.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {locationsDesired.map((location) => (
                <span 
                  key={location} 
                  className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/20 text-white text-sm"
                >
                  {location}
                  <button
                    onClick={() => removeLocation(location)}
                    className="opacity-50 hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="relative">
            <input
              ref={locationInputRef}
              type="text"
              placeholder="Add locations (e.g., San Francisco, Remote)"
              value={locationInput}
              onChange={(e) => {
                setLocationInput(e.target.value)
                setShowLocationDropdown(true)
              }}
              onFocus={() => {
                setLocationFocused(true)
                setShowLocationDropdown(true)
              }}
              onBlur={() => setLocationFocused(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  if (locationSuggestions.length > 0) {
                    addLocation(locationSuggestions[0])
                  } else if (locationInput.trim()) {
                    addLocation(locationInput)
                  }
                }
                if (e.key === "Escape") setShowLocationDropdown(false)
              }}
              className={cn(
                "w-full h-12 bg-transparent border-0 border-b-2 text-base placeholder:text-white/20 focus:outline-none transition-colors px-0 pr-10",
                locationFocused ? "border-white/50" : "border-white/10"
              )}
            />
            
            <button
              onClick={() => locationInput.trim() && addLocation(locationInput)}
              className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-white/30 hover:text-white/70 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>

            {showLocationDropdown && locationSuggestions.length > 0 && (
              <div 
                ref={locationDropdownRef}
                className="absolute z-10 w-full mt-2 bg-black/90 border border-white/10 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl"
              >
                {locationSuggestions.map((suggestion, index) => (
                  <button
                    key={suggestion}
                    onClick={() => addLocation(suggestion)}
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
