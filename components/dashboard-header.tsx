"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Globe, BarChart3, FileText, LogOut, User } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth-context";

const navigation = [
  { name: "Interactive Maps", href: "/", icon: Globe },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Methodology", href: "/methodology", icon: FileText },
];

interface DashboardHeaderProps {
  pillar?: "overall" | "economic" | "social" | "institutional" | "infrastructure";
  onPillarChange?: (pillar: "overall" | "economic" | "social" | "institutional" | "infrastructure") => void;
  year?: number;
  onYearChange?: (year: number) => void;
}

export function DashboardHeader({
  pillar = "overall",
  onPillarChange,
  year = 2024,
  onYearChange,
}: DashboardHeaderProps) {
  const pathname = usePathname();
  const isMapPage = pathname === "/";
  const { user, logout } = useAuth();

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-[1920px] mx-auto px-4">
        <div className="flex items-center justify-between h-14 gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold text-foreground">Global Resilience Atlas</h1>
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 font-mono">v1.1</Badge>
              </div>
              <p className="text-[10px] text-muted-foreground -mt-0.5">World Bank Economies | 2019-2030</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="hidden md:inline">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex-1" />

          {/* Map Controls - only show on map page */}
          {isMapPage && onPillarChange && onYearChange && (
            <div className="flex items-center gap-4">
              {/* Pillar Select */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground hidden lg:inline">Pillar:</span>
                <Select value={pillar} onValueChange={(v) => onPillarChange(v as typeof pillar)}>
                  <SelectTrigger className="w-[130px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="overall">Overall</SelectItem>
                    <SelectItem value="economic">Economic</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                    <SelectItem value="institutional">Institutional</SelectItem>
                    <SelectItem value="infrastructure">Infrastructure</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Year Slider */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground hidden lg:inline">Year:</span>
                <Slider
                  value={[year]}
                  onValueChange={([v]) => onYearChange(v)}
                  min={2019}
                  max={2030}
                  step={1}
                  className="w-20"
                />
                <Badge variant="outline" className="font-mono text-xs tabular-nums min-w-[52px] justify-center">
                  {year}
                  {year > 2024 && <span className="text-[9px] text-muted-foreground ml-0.5">(F)</span>}
                </Badge>
              </div>
            </div>
          )}

          {/* Status Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 flex-shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs text-muted-foreground hidden sm:inline">Live</span>
          </div>

          {/* User Menu */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 h-8">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-xs hidden sm:inline">{user.username}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user.username}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user.role} Account</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-500 focus:text-red-500 cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
