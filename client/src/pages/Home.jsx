import HeroSpline from "../components/ui/HeroSpline";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Palette,
  MessageSquare,
  Brain,
  Mic,
  MapPin,
  FileText,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

const features = [
  {
    icon: Palette,
    title: "Visual Generator",
    description:
      "Transform text and PDFs into engaging animated lessons with AI-generated visuals and optional video content.",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    icon: MessageSquare,
    title: "Doubt Solving",
    description:
      "Get instant answers to your questions with our conversational AI tutor that provides step-by-step explanations.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Brain,
    title: "Interactive Quizzes",
    description:
      "Generate custom quizzes from any topic with multiple question types and detailed explanations.",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    icon: Mic,
    title: "Voice Tutor",
    description:
      "Learn through natural conversation with AI voice synthesis and personalized tutoring sessions.",
    gradient: "from-purple-500 to-violet-500",
  },
  {
    icon: MapPin,
    title: "Career Roadmaps",
    description:
      "Get personalized learning paths with milestones, resources, and progress tracking for your goals.",
    gradient: "from-orange-500 to-amber-500",
  },
  {
    icon: FileText,
    title: "Resume Builder",
    description:
      "Optimize your resume with ATS scoring, skill gap analysis, and professional improvement suggestions.",
    gradient: "from-indigo-500 to-purple-500",
  },
];

const steps = [
  {
    number: "01",
    title: "Choose Your Tool",
    description:
      "Select from our suite of AI-powered learning tools based on your current needs.",
  },
  {
    number: "02",
    title: "Input Your Content",
    description:
      "Upload documents, enter topics, or start conversations with our AI systems.",
  },
  {
    number: "03",
    title: "Learn & Progress",
    description:
      "Engage with personalized content and track your learning journey with detailed analytics.",
  },
];

const comparisons = [
  { feature: "AI-Powered Content Generation", edvanta: true, others: false },
  { feature: "Animated Visual Lessons", edvanta: true, others: false },
  { feature: "Voice-Based Learning", edvanta: true, others: false },
  { feature: "Career Roadmap Planning", edvanta: true, others: false },
  { feature: "Resume Optimization", edvanta: true, others: false },
  { feature: "Progress Analytics", edvanta: true, others: true },
  { feature: "Quiz Generation", edvanta: true, others: true },
];

function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with 3D Robot */}
      <HeroSpline />

      {/* Features Section */}
      <section id="features" className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              Features
            </Badge>
            <h2 className="text-4xl font-bold text-text-primary mb-4 text-balance">
              Everything You Need to Excel
            </h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
              Our comprehensive platform combines the latest AI technology with
              proven educational methods.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group transition-all duration-300">
                <CardHeader>
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-soft`}
                  >
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              Process
            </Badge>
            <h2 className="text-4xl font-bold text-text-primary mb-4 text-balance">
              How Edvanta Works
            </h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
              Get started in three simple steps and transform your learning
              experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-primary-600 text-white text-2xl font-bold flex items-center justify-center mx-auto mb-6 shadow-soft">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-4">
                  {step.title}
                </h3>
                <p className="text-text-secondary leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-20 bg-surface">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              Comparison
            </Badge>
            <h2 className="text-4xl font-bold text-text-primary mb-4 text-balance">
              Why Choose Edvanta?
            </h2>
            <p className="text-xl text-text-secondary">
              See how we compare to traditional learning platforms.
            </p>
          </div>

          <Card>
            <CardHeader>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div></div>
                <div className="font-semibold text-primary">Edvanta</div>
                <div className="font-semibold text-text-secondary">Others</div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {comparisons.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-3 gap-4 items-center py-3 border-b border-border last:border-b-0"
                >
                  <div className="font-medium text-text-primary">
                    {item.feature}
                  </div>
                  <div className="text-center">
                    {item.edvanta ? (
                      <CheckCircle className="h-5 w-5 text-success mx-auto" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-muted mx-auto"></div>
                    )}
                  </div>
                  <div className="text-center">
                    {item.others ? (
                      <CheckCircle className="h-5 w-5 text-success mx-auto" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-muted mx-auto"></div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of students and professionals already using Edvanta
            to accelerate their growth.
          </p>
          <Button
            size="xl"
            variant="outline"
            className="bg-white text-primary hover:bg-gray-100 border-white"
            asChild
          >
            <Link to="/auth/signup">
              Get Started Now <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

export default Home;
