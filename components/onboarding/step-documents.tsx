"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { FileText, Github, Linkedin, Upload, X, ArrowRight, CheckCircle2, Loader2 } from "lucide-react"
import type { SoulFileData } from "@/lib/types"
import { cn } from "@/lib/utils"

interface StepDocumentsProps {
  soulData: Partial<SoulFileData>
  updateSoulData: (data: Partial<SoulFileData>) => void
  onNext: () => void
}

export function StepDocuments({ soulData, updateSoulData, onNext }: StepDocumentsProps) {
  const [githubUrl, setGithubUrl] = useState(soulData.githubUrl || "")
  const [isDraggingResume, setIsDraggingResume] = useState(false)
  const [isDraggingLinkedin, setIsDraggingLinkedin] = useState(false)
  const [resumeFiles, setResumeFiles] = useState<File[]>([])
  const [linkedinFiles, setLinkedinFiles] = useState<File[]>([])
  const [githubFocused, setGithubFocused] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent, type: "resume" | "linkedin") => {
    e.preventDefault()
    if (type === "resume") setIsDraggingResume(true)
    else setIsDraggingLinkedin(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent, type: "resume" | "linkedin") => {
    e.preventDefault()
    if (type === "resume") setIsDraggingResume(false)
    else setIsDraggingLinkedin(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, type: "resume" | "linkedin") => {
    e.preventDefault()
    if (type === "resume") setIsDraggingResume(false)
    else setIsDraggingLinkedin(false)
    
    const files = Array.from(e.dataTransfer.files).filter(
      (file) => file.type === "application/pdf" || file.type.includes("document"),
    )
    
    if (type === "resume") {
      setResumeFiles((prev) => [...prev, ...files])
    } else {
      setLinkedinFiles((prev) => [...prev, ...files])
    }
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>, type: "resume" | "linkedin") => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      if (type === "resume") {
        setResumeFiles((prev) => [...prev, ...files])
      } else {
        setLinkedinFiles((prev) => [...prev, ...files])
      }
    }
  }

  const removeFile = (index: number, type: "resume" | "linkedin") => {
    if (type === "resume") {
      setResumeFiles((prev) => prev.filter((_, i) => i !== index))
    } else {
      setLinkedinFiles((prev) => prev.filter((_, i) => i !== index))
    }
  }

  // Convert file to base64 for server-side parsing
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleNext = async () => {
    setIsUploading(true)
    setUploadError(null)
    
    try {
      let resumeBase64: string | null = null
      let linkedinBase64: string | null = null
      
      // Convert resume to base64 if provided
      if (resumeFiles.length > 0) {
        const resumeFile = resumeFiles[0]
        console.log("Processing resume:", resumeFile.name)
        resumeBase64 = await fileToBase64(resumeFile)
      }
      
      // Convert LinkedIn PDF to base64 if provided
      if (linkedinFiles.length > 0) {
        const linkedinFile = linkedinFiles[0]
        console.log("Processing LinkedIn:", linkedinFile.name)
        linkedinBase64 = await fileToBase64(linkedinFile)
      }
      
      // Update soul data with base64 files (will be parsed server-side)
      const allDocs = [
        ...resumeFiles.map((f) => ({ name: f.name, type: "resume" as const })),
        ...linkedinFiles.map((f) => ({ name: f.name, type: "linkedin" as const })),
      ]
      
      updateSoulData({
        githubUrl: githubUrl || undefined,
        documents: allDocs,
        // Store base64 for server-side parsing
        resumeBase64: resumeBase64 || undefined,
        linkedinBase64: linkedinBase64 || undefined,
      } as Partial<SoulFileData>)
      
      onNext()
    } catch (error: any) {
      console.error("File processing error:", error)
      setUploadError(error.message || "Failed to process files")
    } finally {
      setIsUploading(false)
    }
  }

  const isValid = resumeFiles.length > 0 || linkedinFiles.length > 0 || githubUrl

  return (
    <div className="w-full max-w-2xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-light mb-3 text-white">
          Documents
        </h1>
        <p className="text-white/50">
          Add your resume and profiles for better matches.
        </p>
      </div>

      <div className="space-y-8">
        {/* Resume Upload */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-5 h-5 text-white/50" />
            <span className="text-sm text-white/50">Resume / Documents</span>
          </div>
          
          <div
            className={cn(
              "border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
              isDraggingResume
                ? "border-white/40 bg-white/5"
                : "border-white/10 hover:border-white/30 hover:bg-white/[0.02]",
            )}
            onDragOver={(e) => handleDragOver(e, "resume")}
            onDragLeave={(e) => handleDragLeave(e, "resume")}
            onDrop={(e) => handleDrop(e, "resume")}
            onClick={() => document.getElementById("resume-input")?.click()}
          >
            <input
              id="resume-input"
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx"
              multiple
              onChange={(e) => handleFileInput(e, "resume")}
            />
            <Upload className="w-10 h-10 text-white/30 mx-auto mb-4" />
            <p className="text-white/50">
              Drop files here or <span className="text-white/70 underline">browse</span>
            </p>
            <p className="text-xs text-white/30 mt-2">PDF, DOC up to 10MB</p>
          </div>

          {resumeFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              {resumeFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-white/50" />
                    <span className="text-sm text-white">{file.name}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFile(index, "resume")
                    }}
                    className="p-1 hover:bg-white/10 rounded"
                  >
                    <X className="w-4 h-4 text-white/50" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* LinkedIn PDF Upload */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Linkedin className="w-5 h-5 text-white/50" />
            <span className="text-sm text-white/50">LinkedIn Export</span>
          </div>
          
          <div
            className={cn(
              "border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer",
              isDraggingLinkedin
                ? "border-white/40 bg-white/5"
                : "border-white/10 hover:border-white/30 hover:bg-white/[0.02]",
            )}
            onDragOver={(e) => handleDragOver(e, "linkedin")}
            onDragLeave={(e) => handleDragLeave(e, "linkedin")}
            onDrop={(e) => handleDrop(e, "linkedin")}
            onClick={() => document.getElementById("linkedin-input")?.click()}
          >
            <input
              id="linkedin-input"
              type="file"
              className="hidden"
              accept=".pdf"
              onChange={(e) => handleFileInput(e, "linkedin")}
            />
            <Upload className="w-8 h-8 text-white/30 mx-auto mb-3" />
            <p className="text-white/50">
              Drop LinkedIn PDF or <span className="text-white/70 underline">browse</span>
            </p>
          </div>

          {linkedinFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              {linkedinFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-white/50" />
                    <span className="text-sm text-white">{file.name}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFile(index, "linkedin")
                    }}
                    className="p-1 hover:bg-white/10 rounded"
                  >
                    <X className="w-4 h-4 text-white/50" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* GitHub */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Github className="w-5 h-5 text-white/50" />
            <span className="text-sm text-white/50">GitHub Profile</span>
          </div>
          
          <div className="relative">
            <input
              type="url"
              placeholder="github.com/username"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              onFocus={() => setGithubFocused(true)}
              onBlur={() => setGithubFocused(false)}
              className={cn(
                "w-full h-14 bg-transparent border-0 border-b-2 text-lg placeholder:text-white/30 focus:outline-none transition-colors px-0",
                githubFocused ? "border-white/50" : "border-white/10"
              )}
            />
          </div>
        </div>

        {uploadError && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {uploadError}
          </div>
        )}

        <div className="flex justify-end pt-6">
          <Button
            onClick={handleNext}
            disabled={!isValid || isUploading}
            className="gap-2 bg-white text-black hover:bg-white/90 border-0 h-12 px-6"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
