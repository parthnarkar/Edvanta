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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Visual Content Generator</h1>
        <p className="text-gray-600">
          Transform your text and documents into engaging animated lessons with AI-powered visuals.
        </p>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Generation Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center ${
                  index < steps.length - 1 ? 'flex-1' : ''
                }`}
              >
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  index <= currentStep 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {index < currentStep ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : index === currentStep ? (
                    <Clock className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-4 ${
                    index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <Progress value={progress} className="mb-2" />
          <p className="text-sm text-gray-500">
            Step {currentStep + 1} of {steps.length}: {steps[currentStep]?.title}
          </p>
        </CardContent>
      </Card>

      {currentStep === 0 && (
        <Tabs defaultValue="text" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="text">Text Input</TabsTrigger>
            <TabsTrigger value="upload">Upload PDF</TabsTrigger>
          </TabsList>

          <TabsContent value="text">
            <Card>
              <CardHeader>
                <CardTitle>Enter Your Content</CardTitle>
                <CardDescription>
                  Paste your text, notes, or topic description to generate visual content.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <textarea
                  className="w-full h-64 p-4 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your text content here... For example: 'Explain the concept of machine learning algorithms including supervised, unsupervised, and reinforcement learning with examples.'"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
                <Button 
                  onClick={handleTextSubmit} 
                  disabled={loading || !content.trim()}
                  className="w-full"
                >
                  {loading ? 'Processing...' : 'Generate Visual Content'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle>Upload PDF Document</CardTitle>
                <CardDescription>
                  Upload your PDF notes or documents to create visual lessons.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Upload your PDF file
                  </p>
                  <p className="text-gray-500 mb-4">
                    Drag and drop your file here, or click to browse
                  </p>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button asChild variant="outline">
                    <label htmlFor="file-upload" className="cursor-pointer">
                      Select File
                    </label>
                  </Button>
                  {file && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">
                        Selected: {file.name}
                      </p>
                    </div>
                  )}
                </div>
                <Button 
                  onClick={generateContent} 
                  disabled={!file}
                  className="w-full"
                >
                  Process PDF Document
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              Content Summary & Outline
            </CardTitle>
            <CardDescription>
              AI has analyzed your content and created a structured outline.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Generated Summary</h3>
              <p className="text-blue-800 text-sm">
                This content covers machine learning fundamentals including three main types of algorithms: 
                supervised learning (with labeled data), unsupervised learning (pattern finding), and 
                reinforcement learning (reward-based learning).
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">Content Outline</h3>
              <div className="space-y-2">
                {[
                  'Introduction to Machine Learning',
                  'Supervised Learning Algorithms',
                  'Unsupervised Learning Techniques', 
                  'Reinforcement Learning Concepts',
                  'Real-world Examples & Applications'
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 border rounded">
                    <Badge variant="secondary">{index + 1}</Badge>
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={generateContent} className="w-full" disabled={loading}>
              {loading ? 'Creating Storyboard...' : 'Create Storyboard'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {currentStep >= 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Generated Assets
            </CardTitle>
            <CardDescription>
              Your visual content is ready! Download the complete package.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    className="w-full h-32 object-cover"
                  />
                  <div className="p-3">
                    <h4 className="font-medium text-sm mb-1">{asset.title}</h4>
                    <Badge variant={asset.type === 'video' ? 'default' : 'secondary'} className="text-xs">
                      {asset.type === 'video' ? <Video className="h-3 w-3 mr-1" /> : <Image className="h-3 w-3 mr-1" />}
                      {asset.type.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download ZIP Package
              </Button>
              <Button variant="outline" onClick={generateContent}>
                Generate New Content
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}