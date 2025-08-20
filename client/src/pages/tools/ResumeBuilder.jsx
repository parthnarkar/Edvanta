import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { Progress } from '../../components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import {
  FileText,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  Star,
  Award,
  Target,
  TrendingUp,
  CheckCircle,
  Plus,
  Save,
  Share,
  Sparkles,
  User,
  Briefcase,
  GraduationCap,
  Mail,
  Phone,
  MapPin,
  Globe
} from 'lucide-react'

export function ResumeBuilder() {
  const [selectedTemplate, setSelectedTemplate] = useState('modern')
  const [activeSection, setActiveSection] = useState('personal')
  const [resumeData, setResumeData] = useState({
    personal: {
      name: 'John Doe',
      email: 'john.doe@email.com',
      phone: '+1 (555) 123-4567',
      location: 'San Francisco, CA',
      website: 'johndoe.dev'
    }
  })

  const templates = [
    {
      id: 'modern',
      name: 'Modern Professional',
      preview: '/api/placeholder/300/400',
      description: 'Clean and contemporary design',
      category: 'Professional'
    },
    {
      id: 'creative',
      name: 'Creative Designer',
      preview: '/api/placeholder/300/400',
      description: 'Colorful and artistic layout',
      category: 'Creative'
    },
    {
      id: 'minimal',
      name: 'Minimal Classic',
      preview: '/api/placeholder/300/400',
      description: 'Simple and elegant format',
      category: 'Classic'
    },
    {
      id: 'technical',
      name: 'Technical Expert',
      preview: '/api/placeholder/300/400',
      description: 'Perfect for developers and engineers',
      category: 'Technical'
    }
  ]

  const sections = [
    { id: 'personal', name: 'Personal Info', icon: User, completed: true },
    { id: 'summary', name: 'Professional Summary', icon: FileText, completed: false },
    { id: 'experience', name: 'Work Experience', icon: Briefcase, completed: false },
    { id: 'education', name: 'Education', icon: GraduationCap, completed: false },
    { id: 'skills', name: 'Skills', icon: Star, completed: false },
    { id: 'projects', name: 'Projects', icon: Target, completed: false }
  ]

  const atsScore = 85

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Resume Builder</h1>
        <p className="text-sm sm:text-base text-gray-600">
          AI-powered resume optimization and ATS scoring to land your dream job
        </p>
      </div>

      <Tabs defaultValue="builder" className="space-y-4 sm:space-y-6">
        <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:flex gap-1">
          <TabsTrigger value="builder" className="text-xs sm:text-sm py-2">
            Builder
          </TabsTrigger>
          <TabsTrigger value="templates" className="text-xs sm:text-sm py-2">
            Templates
          </TabsTrigger>
          <TabsTrigger value="optimize" className="text-xs sm:text-sm py-2">
            Optimize
          </TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Resume Sections */}
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Resume Sections</CardTitle>
                  <CardDescription>
                    Complete each section to build your resume
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {sections.map((section) => (
                    <div
                      key={section.id}
                      className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                        activeSection === section.id
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                      onClick={() => setActiveSection(section.id)}
                    >
                      <section.icon className={`h-4 w-4 mr-3 ${
                        section.completed ? 'text-green-600' : 'text-gray-400'
                      }`} />
                      <span className="flex-1 text-sm font-medium">{section.name}</span>
                      {section.completed && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                  ))}
                  
                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Completion</span>
                      <span className="text-sm text-gray-600">17%</span>
                    </div>
                    <Progress value={17} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs sm:text-sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Import from LinkedIn
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs sm:text-sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Import Existing Resume
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs sm:text-sm">
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI Auto-Fill
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Section Editor */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    {sections.find(s => s.id === activeSection)?.icon && 
                      React.createElement(sections.find(s => s.id === activeSection).icon, { className: "h-5 w-5" })
                    }
                    {sections.find(s => s.id === activeSection)?.name}
                  </CardTitle>
                  <CardDescription>
                    Fill in your information for this section
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activeSection === 'personal' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Full Name</label>
                        <Input 
                          value={resumeData.personal.name}
                          onChange={(e) => setResumeData({
                            ...resumeData,
                            personal: { ...resumeData.personal, name: e.target.value }
                          })}
                          className="text-sm sm:text-base"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            type="email"
                            value={resumeData.personal.email}
                            className="pl-10 text-sm sm:text-base"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Phone Number</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            value={resumeData.personal.phone}
                            className="pl-10 text-sm sm:text-base"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Location</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            value={resumeData.personal.location}
                            className="pl-10 text-sm sm:text-base"
                          />
                        </div>
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <label className="text-sm font-medium">Website/Portfolio</label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            value={resumeData.personal.website}
                            className="pl-10 text-sm sm:text-base"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSection === 'summary' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Professional Summary</label>
                        <textarea
                          placeholder="Write a compelling summary of your professional experience and goals..."
                          className="w-full h-32 p-3 border rounded-lg text-sm sm:text-base resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <Button size="sm" variant="outline" className="text-xs sm:text-sm">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate with AI
                      </Button>
                    </div>
                  )}

                  {activeSection === 'experience' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-medium">Work Experience</h3>
                        <Button size="sm" className="text-xs sm:text-sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Experience
                        </Button>
                      </div>
                      <div className="p-4 border rounded-lg bg-gray-50">
                        <p className="text-sm text-gray-600 text-center">
                          No work experience added yet. Click "Add Experience" to get started.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 pt-4 border-t">
                    <Button className="flex-1 text-sm sm:text-base">
                      <Save className="h-4 w-4 mr-2" />
                      Save Section
                    </Button>
                    <Button variant="outline" className="flex-1 text-sm sm:text-base">
                      <Eye className="h-4 w-4 mr-2" />
                      Preview Resume
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Choose Template</CardTitle>
              <CardDescription>
                Select a professional template that matches your industry
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`cursor-pointer group ${
                      selectedTemplate === template.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedTemplate(template.id)}
                  >
                    <Card className="h-full hover:shadow-lg transition-shadow duration-200">
                      <div className="aspect-[3/4] bg-gray-100 rounded-t-lg flex items-center justify-center">
                        <FileText className="h-12 w-12 text-gray-400" />
                      </div>
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-sm sm:text-base">{template.name}</h3>
                          {selectedTemplate === template.id && (
                            <CheckCircle className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-2">{template.description}</p>
                        <Badge variant="secondary" className="text-xs">
                          {template.category}
                        </Badge>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimize" className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* ATS Score */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Award className="h-5 w-5" />
                  ATS Score
                </CardTitle>
                <CardDescription>
                  How well your resume performs with Applicant Tracking Systems
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <div className="relative inline-flex">
                    <svg className="w-20 h-20 sm:w-24 sm:h-24 transform -rotate-90">
                      <circle
                        className="text-gray-200"
                        strokeWidth="6"
                        stroke="currentColor"
                        fill="transparent"
                        r="34"
                        cx="48"
                        cy="48"
                      />
                      <circle
                        className="text-green-500"
                        strokeWidth="6"
                        strokeDasharray={`${atsScore * 2.14} 214`}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="34"
                        cx="48"
                        cy="48"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xl sm:text-2xl font-bold">
                      {atsScore}
                    </span>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-green-600">Excellent</p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Your resume is highly optimized for ATS systems
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Optimization Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Optimization Tips</CardTitle>
                <CardDescription>
                  Suggestions to improve your resume
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Good keyword usage</p>
                    <p className="text-xs text-gray-600">Your resume includes relevant industry keywords</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Add more quantifiable achievements</p>
                    <p className="text-xs text-gray-600">Include numbers and metrics in your experience</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <Target className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Tailor for specific roles</p>
                    <p className="text-xs text-gray-600">Customize your resume for each job application</p>
                  </div>
                </div>
                
                <Button className="w-full text-sm sm:text-base">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Auto-Optimize Resume
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Action Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <Button className="flex-1 text-sm sm:text-base">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="outline" className="flex-1 text-sm sm:text-base">
              <Share className="h-4 w-4 mr-2" />
              Share Resume
            </Button>
            <Button variant="outline" className="flex-1 text-sm sm:text-base">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
