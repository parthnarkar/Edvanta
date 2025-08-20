import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { Progress } from '../../components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import {
  Upload,
  FileText,
  Wand2,
  Image,
  Video,
  Download,
  ArrowRight,
  CheckCircle,
  Clock,
  Sparkles
} from 'lucide-react'

const steps = [
  { id: 'input', title: 'Input Content', icon: FileText, status: 'completed' },
  { id: 'summarize', title: 'Summarize', icon: Wand2, status: 'active' },
  { id: 'storyboard', title: 'Create Storyboard', icon: Image, status: 'pending' },
  { id: 'generate', title: 'Generate Assets', icon: Sparkles, status: 'pending' },
  { id: 'download', title: 'Download', icon: Download, status: 'pending' }
]

export function VisualGenerator() {
  const [currentStep, setCurrentStep] = useState(0)
  const [content, setContent] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(20)

  const handleTextSubmit = () => {
    if (!content.trim()) return
    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      setCurrentStep(1)
      setProgress(40)
    }, 2000)
  }

  const handleFileUpload = (event) => {
    const selectedFile = event.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  const generateContent = () => {
    setLoading(true)
    // Simulate content generation
    setTimeout(() => {
      setLoading(false)
      setCurrentStep(currentStep + 1)
      setProgress(progress + 20)
    }, 3000)
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Visual Content Generator</h1>
        <p className="text-sm sm:text-base text-gray-600">
          Transform your text and documents into engaging animated lessons with AI-powered visuals.
        </p>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Wand2 className="h-4 w-4 sm:h-5 sm:w-5" />
            Generation Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="flex items-center justify-between mb-4 overflow-x-auto">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center ${
                  index < steps.length - 1 ? 'flex-1' : ''
                }`}
              >
                <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full ${
                  index <= currentStep 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {index < currentStep ? (
                    <CheckCircle className="h-3 w-3 sm:h-5 sm:w-5" />
                  ) : index === currentStep ? (
                    <Clock className="h-3 w-3 sm:h-5 sm:w-5" />
                  ) : (
                    <step.icon className="h-3 w-3 sm:h-5 sm:w-5" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 sm:mx-4 ${
                    index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <Progress value={progress} className="mb-2" />
          <p className="text-xs sm:text-sm text-gray-500">
            Step {currentStep + 1} of {steps.length}: {steps[currentStep]?.title}
          </p>
        </CardContent>
      </Card>

      {currentStep === 0 && (
        <Tabs defaultValue="text" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="text" className="text-xs sm:text-sm">Text Input</TabsTrigger>
            <TabsTrigger value="upload" className="text-xs sm:text-sm">Upload PDF</TabsTrigger>
          </TabsList>

          <TabsContent value="text">
            <Card>
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-lg sm:text-xl">Enter Your Content</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Paste your text, notes, or topic description to generate visual content.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
                <textarea
                  className="w-full h-48 sm:h-64 p-3 sm:p-4 text-sm sm:text-base border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your text content here... For example: 'Explain the concept of machine learning algorithms including supervised, unsupervised, and reinforcement learning with examples.'"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
                <Button 
                  onClick={handleTextSubmit} 
                  disabled={loading || !content.trim()}
                  className="w-full text-sm sm:text-base py-2 sm:py-3"
                >
                  {loading ? 'Processing...' : 'Generate Visual Content'}
                  <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upload">
            <Card>
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-lg sm:text-xl">Upload PDF Document</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Upload your PDF notes or documents to create visual lessons.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-8 text-center">
                  <Upload className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                  <p className="text-base sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">
                    Upload your PDF file
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
                    Drag and drop your file here, or click to browse
                  </p>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button asChild variant="outline" className="text-xs sm:text-sm">
                    <label htmlFor="file-upload" className="cursor-pointer">
                      Select File
                    </label>
                  </Button>
                  {file && (
                    <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs sm:text-sm text-blue-700">
                        Selected: {file.name}
                      </p>
                    </div>
                  )}
                </div>
                <Button 
                  onClick={generateContent} 
                  disabled={!file}
                  className="w-full text-sm sm:text-base py-2 sm:py-3"
                >
                  Process PDF Document
                  <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {currentStep === 1 && (
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Wand2 className="h-4 w-4 sm:h-5 sm:w-5" />
              Content Summary & Outline
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              AI has analyzed your content and created a structured outline.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
            <div className="p-3 sm:p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">Generated Summary</h3>
              <p className="text-blue-800 text-xs sm:text-sm">
                This content covers machine learning fundamentals including three main types of algorithms: 
                supervised learning (with labeled data), unsupervised learning (pattern finding), and 
                reinforcement learning (reward-based learning).
              </p>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <h3 className="font-semibold text-sm sm:text-base">Content Outline</h3>
              <div className="space-y-2">
                {[
                  'Introduction to Machine Learning',
                  'Supervised Learning Algorithms',
                  'Unsupervised Learning Techniques', 
                  'Reinforcement Learning Concepts',
                  'Real-world Examples & Applications'
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-2 sm:gap-3 p-2 border rounded">
                    <Badge variant="secondary" className="text-xs">{index + 1}</Badge>
                    <span className="text-xs sm:text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={generateContent} className="w-full text-sm sm:text-base py-2 sm:py-3" disabled={loading}>
              {loading ? 'Creating Storyboard...' : 'Create Storyboard'}
              <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {currentStep >= 2 && (
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Image className="h-4 w-4 sm:h-5 sm:w-5" />
              Generated Assets
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Your visual content is ready! Download the complete package.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {[
                { title: 'Slide 1: Introduction', type: 'image', preview: 'https://images.pexels.com/photos/5428836/pexels-photo-5428836.jpeg?auto=compress&cs=tinysrgb&w=400' },
                { title: 'Slide 2: Supervised Learning', type: 'image', preview: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=400' },
                { title: 'Slide 3: Unsupervised Learning', type: 'image', preview: 'https://images.pexels.com/photos/5483077/pexels-photo-5483077.jpeg?auto=compress&cs=tinysrgb&w=400' },
                { title: 'Complete Lesson Video', type: 'video', preview: 'https://images.pexels.com/photos/5926382/pexels-photo-5926382.jpeg?auto=compress&cs=tinysrgb&w=400' }
              ].map((asset, index) => (
                <div key={index} className="border rounded-lg overflow-hidden">
                  <img
                    src={asset.preview}
                    alt={asset.title}
                    className="w-full h-24 sm:h-32 object-cover"
                  />
                  <div className="p-2 sm:p-3">
                    <h4 className="font-medium text-xs sm:text-sm mb-1">{asset.title}</h4>
                    <Badge variant={asset.type === 'video' ? 'default' : 'secondary'} className="text-xs">
                      {asset.type === 'video' ? <Video className="h-2 w-2 sm:h-3 sm:w-3 mr-1" /> : <Image className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />}
                      {asset.type.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button className="flex-1 text-sm sm:text-base py-2 sm:py-3">
                <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Download ZIP Package
              </Button>
              <Button variant="outline" onClick={generateContent} className="text-sm sm:text-base py-2 sm:py-3">
                Generate New Content
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}