import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="hero-gradient py-20 md:py-32">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-12 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
              <span className="gradient-text">AI-Powered</span> Sales Training
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Master your sales pitch with AI-powered roleplay scenarios. Get instant feedback and improve your closing rate with personalized coaching.
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link href="/train/setup">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 rounded-full font-medium transition shadow-lg">
                  Start Free Trial
                </Button>
              </Link>
              <Button variant="outline" className="border border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-300 dark:hover:bg-blue-950/30 px-8 py-6 rounded-full font-medium transition">
                Watch Demo
              </Button>
              <Link href="/sign-in">
                <Button variant="ghost" className="px-8 py-6 rounded-full font-medium">Log in</Button>
              </Link>
            </div>
          </div>
          <div className="md:w-1/2">
            <div className="relative">
              <div className="absolute -top-6 -left-6 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70" />
              <div className="absolute -bottom-8 -right-8 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70" />
              <div className="relative bg-white p-2 rounded-2xl shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                  alt="Sales call"
                  className="rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Transform Your Sales Skills</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">Three simple steps to master your pitch and close more deals</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {["1", "2", "3"].map((n, idx) => (
              <Card key={idx} className="bg-gray-50 dark:bg-gray-800/60 p-0 rounded-xl hover:shadow-lg transition">
                <CardContent className="p-8">
                  <div className={`w-16 h-16 ${idx === 1 ? "bg-purple-100" : "bg-blue-100"} rounded-full flex items-center justify-center mb-6`}>
                    <span className={`${idx === 1 ? "text-purple-600" : "text-blue-600"} text-2xl font-bold`}>{n}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-3">{idx === 0 ? "Setup" : idx === 1 ? "Call" : "Feedback"}</h3>
                  <p className="text-gray-600 mb-4">
                    {idx === 0 && "Choose your product, buyer persona, and difficulty level to create the perfect training scenario."}
                    {idx === 1 && "Practice your pitch in a realistic conversation with an AI buyer that responds naturally."}
                    {idx === 2 && "Get detailed analysis of your performance with actionable insights to improve your next call."}
                  </p>
                  <div className="flex space-x-2">
                    {idx === 0 && (
                      <>
                        <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm">Customizable</span>
                        <span className="px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-sm">Flexible</span>
                      </>
                    )}
                    {idx === 1 && (
                      <>
                        <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm">Realistic</span>
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-600 rounded-full text-sm">Interactive</span>
                      </>
                    )}
                    {idx === 2 && (
                      <>
                        <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm">Instant</span>
                        <span className="px-3 py-1 bg-indigo-100 text-indigo-600 rounded-full text-sm">Actionable</span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Trusted by Sales Professionals</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">Join thousands of sales professionals who are already improving their skills</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { initials: "SC", name: "Sarah Chen", role: "Account Executive", company: "TechCorp", quote: "PitchPilot helped me increase my close rate by 40% in just two months. The AI feedback is incredibly detailed." },
              { initials: "MR", name: "Mike Rodriguez", role: "Sales Manager", company: "GrowthCo", quote: "The realistic scenarios and instant feedback make this the best sales training tool I've ever used." },
              { initials: "EJ", name: "Emily Johnson", role: "SDR", company: "StartupXYZ", quote: "Perfect for practicing objection handling. The scenarios feel so realistic, it's like talking to real prospects." },
            ].map((t, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 p-8 rounded-xl testimonial-card transition duration-300 shadow-md">
                <div className="flex items-center mb-6">
                  <div className={`w-12 h-12 ${i===0?"bg-blue-100":i===1?"bg-purple-100":"bg-green-100"} rounded-full flex items-center justify-center ${i===0?"text-blue-600":i===1?"text-purple-600":"text-green-600"} font-bold mr-4`}>{t.initials}</div>
                  <div>
                    <h4 className="font-bold">{t.name}</h4>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">{t.role} at {t.company}</p>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 italic mb-4">"{t.quote}"</p>
                <div className="flex text-yellow-400">{"★★★★★"}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Close More Deals?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">Join thousands of sales professionals who are already improving their skills with PitchPilot.</p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link href="/train/setup">
              <Button className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-6 rounded-full font-medium transition shadow-lg">Start Free Trial</Button>
            </Link>
            <Button variant="outline" className="border border-white text-white hover:bg-white/10 px-8 py-6 rounded-full font-medium transition">Schedule Demo</Button>
          </div>
        </div>
      </section>
    </div>
  )
}
