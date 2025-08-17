import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '../../lib/utils'
import {
  LayoutDashboard,
  Palette,
  MessageSquare,
  Brain,
  Mic,
  MapPin,
  FileText,
  Trophy,
  Settings
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Visual Generator', href: '/tools/visual-generator', icon: Palette },
  { name: 'Doubt Solving', href: '/tools/doubt-solving', icon: MessageSquare },
  { name: 'Quizzes', href: '/tools/quizzes', icon: Brain },
  { name: 'Voice Tutor', href: '/tools/conversational-tutor', icon: Mic },
  { name: 'Roadmap', href: '/tools/roadmap', icon: MapPin },
  { name: 'Resume Builder', href: '/tools/resume-builder', icon: FileText },
]

export function Sidebar({ className }) {
  const location = useLocation()

  return (
    <aside className={cn("w-64 bg-surface border-r border-border min-h-screen shadow-soft", className)}>
      <div className="p-6">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-6">
          Learning Tools
        </h2>
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "sidebar-link",
                  isActive
                    ? "active"
                    : ""
                )}
              >
                <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}