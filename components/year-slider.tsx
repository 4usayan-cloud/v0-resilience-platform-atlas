"use client"

import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "lucide-react"

interface YearSliderProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
}

export function YearSlider({ value, onChange, min = 2019, max = 2030 }: YearSliderProps) {
  const years = Array.from({ length: max - min + 1 }, (_, i) => min + i)
  const currentYear = new Date().getFullYear()
  
  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Time Window</span>
        </div>
        <Badge variant={value > currentYear ? "secondary" : "default"} className="text-xs">
          {value > currentYear ? "Forecast" : "Historical"}: {value}
        </Badge>
      </div>
      
      <div className="px-2">
        <Slider
          value={[value]}
          onValueChange={([v]) => onChange(v)}
          min={min}
          max={max}
          step={1}
          className="w-full"
        />
      </div>
      
      <div className="flex justify-between text-xs text-muted-foreground px-1">
        <span>{min}</span>
        <span className="text-primary">{currentYear}</span>
        <span>{max}</span>
      </div>
      
      <div className="flex gap-1 justify-center flex-wrap">
        {years.map((year) => (
          <button
            key={year}
            onClick={() => onChange(year)}
            className={`
              px-2 py-0.5 text-xs rounded transition-colors
              ${value === year 
                ? "bg-primary text-primary-foreground" 
                : year > currentYear 
                  ? "bg-secondary/50 text-muted-foreground hover:bg-secondary" 
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }
            `}
          >
            {year}
          </button>
        ))}
      </div>
    </div>
  )
}
