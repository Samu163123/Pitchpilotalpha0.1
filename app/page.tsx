import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Users, MessageSquare, TrendingUp, Star, Sparkles, Zap, Target } from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800" />
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-float" />
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-green-400/20 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "2s" }}
        />

        <div className="relative container mx-auto px-4 py-24 md:py-32">
          <div className="text-center max-w-5xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 mb-8 animate-slide-up">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">AI-Powered Sales Training</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight animate-slide-up">
              <span className="gradient-text">Practice sales.</span>
              <br />
              <span className="text-gray-900 dark:text-white">Anywhere. Anytime.</span>
            </h1>

            <p
              className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed animate-slide-up"
              style={{ animationDelay: "0.2s" }}
            >
              Master your sales pitch with AI-powered roleplay scenarios. Get instant feedback and improve your closing
              rate with personalized coaching.
            </p>

            <div
              className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up"
              style={{ animationDelay: "0.4s" }}
            >
              <Link href="/train/setup">
                <Button
                  size="lg"
                  className="text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-300 group"
                >
                  Start Training
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 py-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-white/20 dark:border-gray-700/20 hover:bg-white/90 dark:hover:bg-gray-800/90"
              >
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 mb-6">
              <Target className="w-4 h-4" />
              <span className="text-sm font-medium">Simple Process</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">How It Works</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Three simple steps to transform your sales skills and close more deals
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: Users,
                title: "1. Setup",
                description:
                  "Choose your product, buyer persona, and difficulty level to create the perfect training scenario.",
                color: "from-blue-500 to-blue-600",
                bgColor: "bg-blue-50 dark:bg-blue-900/20",
                delay: "0s",
              },
              {
                icon: MessageSquare,
                title: "2. Call",
                description:
                  "Practice your pitch in a realistic conversation with an AI buyer that responds naturally.",
                color: "from-green-500 to-green-600",
                bgColor: "bg-green-50 dark:bg-green-900/20",
                delay: "0.2s",
              },
              {
                icon: TrendingUp,
                title: "3. Feedback",
                description:
                  "Get detailed analysis of your performance with actionable insights to improve your next call.",
                color: "from-purple-500 to-purple-600",
                bgColor: "bg-purple-50 dark:bg-purple-900/20",
                delay: "0.4s",
              },
            ].map((step, index) => (
              <Card
                key={index}
                className={`card-hover border-0 shadow-modern ${step.bgColor} animate-slide-up`}
                style={{ animationDelay: step.delay }}
              >
                <CardContent className="p-8 text-center">
                  <div
                    className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mx-auto mb-6 shadow-lg`}
                  >
                    <step.icon className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{step.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 mb-6">
              <Star className="w-4 h-4" />
              <span className="text-sm font-medium">Trusted by Professionals</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">Loved by Sales Teams</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {[
              {
                name: "Sarah Chen",
                role: "Account Executive",
                company: "TechCorp",
                quote:
                  "PitchPilot helped me increase my close rate by 40% in just two months. The AI feedback is incredibly detailed.",
                rating: 5,
                avatar: "SC",
                delay: "0s",
              },
              {
                name: "Mike Rodriguez",
                role: "Sales Manager",
                company: "GrowthCo",
                quote:
                  "The realistic scenarios and instant feedback make this the best sales training tool I've ever used.",
                rating: 5,
                avatar: "MR",
                delay: "0.2s",
              },
              {
                name: "Emily Johnson",
                role: "SDR",
                company: "StartupXYZ",
                quote:
                  "Perfect for practicing objection handling. The scenarios feel so realistic, it's like talking to real prospects.",
                rating: 5,
                avatar: "EJ",
                delay: "0.4s",
              },
            ].map((testimonial, index) => (
              <Card
                key={index}
                className="card-hover bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-white/20 dark:border-gray-700/20 shadow-modern animate-slide-up"
                style={{ animationDelay: testimonial.delay }}
              >
                <CardContent className="p-8">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-6 text-lg leading-relaxed">"{testimonial.quote}"</p>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold mr-4">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{testimonial.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {testimonial.role} at {testimonial.company}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float" />
          <div
            className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-float"
            style={{ animationDelay: "3s" }}
          />
        </div>

        <div className="relative container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/20 text-white mb-8">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-medium">Ready to Excel?</span>
            </div>

            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-white">Ready to Close More Deals?</h2>
            <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed">
              Join thousands of sales professionals who are already improving their skills with PitchPilot.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/train/setup">
                <Button
                  size="lg"
                  className="text-lg px-10 py-6 bg-white text-blue-700 hover:bg-gray-100 shadow-xl hover:shadow-2xl transition-all duration-300 group"
                >
                  Start Your First Training
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-10 py-6 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm bg-transparent"
              >
                View Pricing
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
