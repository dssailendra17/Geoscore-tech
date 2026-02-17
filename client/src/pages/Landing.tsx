import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TrendingUp, Target, BarChart3, Zap, Shield, Globe } from "lucide-react";
import logoImage from "@assets/generated_images/geoscore_logo,_geometric_globe_with_data_nodes,_blue_and_emerald_gradient.png";
import { useLocation } from "wouter";

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-card border-b backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img src={logoImage} alt="Geoscore" className="h-8 w-8" />
              <span className="font-display font-bold text-xl">Geoscore</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm hover:text-primary transition-colors">Features</a>
              <a href="#pricing" className="text-sm hover:text-primary transition-colors">Pricing</a>
              <a href="#about" className="text-sm hover:text-primary transition-colors">About</a>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => setLocation("/auth/sign-in")} data-testid="button-nav-signin">
                Sign In
              </Button>
              <Button onClick={() => setLocation("/auth/sign-up")} data-testid="button-nav-signup">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-primary/10 mb-4 border border-primary/20">
            <img src={logoImage} alt="Geoscore" className="h-14 w-14" />
          </div>
          
          <h1 className="text-5xl md:text-7xl font-display font-bold leading-tight">
            AI Visibility Intelligence
            <br />
            <span className="text-primary">for Modern Brands</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Track how your brand appears in LLM responses across ChatGPT, Claude, Gemini, and Perplexity. 
            Optimize your AI visibility and stay ahead of competitors in the AI-powered search era.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button size="lg" className="h-14 px-8 text-lg" onClick={() => setLocation("/auth/sign-up")}>
              Start Free Trial
            </Button>
            <Button variant="outline" size="lg" className="h-14 px-8 text-lg">
              Watch Demo
            </Button>
          </div>

          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground pt-4">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Free Forever Plan</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>No Credit Card Required</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold mb-4">Everything you need to dominate AI search</h2>
            <p className="text-lg text-muted-foreground">Comprehensive AI visibility tracking and optimization tools</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="glass-card p-6 space-y-4 hover:bg-background/50 transition-all">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Competitive Intelligence</h3>
              <p className="text-muted-foreground">Track how you stack up against competitors in LLM responses. Identify gaps and opportunities.</p>
            </Card>

            <Card className="glass-card p-6 space-y-4 hover:bg-background/50 transition-all">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Prompt Tracking</h3>
              <p className="text-muted-foreground">Monitor thousands of queries across multiple AI models. See exactly where you appear.</p>
            </Card>

            <Card className="glass-card p-6 space-y-4 hover:bg-background/50 transition-all">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Source Analytics</h3>
              <p className="text-muted-foreground">Understand which sources LLMs cite about you. Optimize your content strategy.</p>
            </Card>

            <Card className="glass-card p-6 space-y-4 hover:bg-background/50 transition-all">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Real-time Alerts</h3>
              <p className="text-muted-foreground">Get notified when your brand visibility changes or competitors make moves.</p>
            </Card>

            <Card className="glass-card p-6 space-y-4 hover:bg-background/50 transition-all">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Brand Protection</h3>
              <p className="text-muted-foreground">Monitor brand mentions and sentiment across all major LLM platforms.</p>
            </Card>

            <Card className="glass-card p-6 space-y-4 hover:bg-background/50 transition-all">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Multi-Model Coverage</h3>
              <p className="text-muted-foreground">Track visibility across ChatGPT, Claude, Gemini, Perplexity, and more.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-lg text-muted-foreground">Start free, scale as you grow</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <Card className="glass-card p-6 space-y-6">
              <div>
                <h3 className="text-xl font-bold mb-2">Free</h3>
                <div className="text-4xl font-bold font-mono">$0</div>
                <p className="text-sm text-muted-foreground mt-1">Forever free</p>
              </div>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <svg className="h-4 w-4 text-emerald-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>3 Competitors</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="h-4 w-4 text-emerald-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>3 Topics</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="h-4 w-4 text-emerald-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Weekly updates</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full" onClick={() => setLocation("/auth/sign-up")}>
                Get Started
              </Button>
            </Card>

            <Card className="glass-card p-6 space-y-6">
              <div>
                <h3 className="text-xl font-bold mb-2">Starter</h3>
                <div className="text-4xl font-bold font-mono">$30</div>
                <p className="text-sm text-muted-foreground mt-1">Per month</p>
              </div>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <svg className="h-4 w-4 text-emerald-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>5 Competitors</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="h-4 w-4 text-emerald-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>10 Topics</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="h-4 w-4 text-emerald-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Daily updates</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full" onClick={() => setLocation("/auth/sign-up")}>
                Start Trial
              </Button>
            </Card>

            <Card className="glass-card p-6 space-y-6 border-primary">
              <div>
                <div className="inline-block px-2 py-1 rounded text-xs font-semibold bg-primary text-primary-foreground mb-2">Popular</div>
                <h3 className="text-xl font-bold mb-2">Growth</h3>
                <div className="text-4xl font-bold font-mono">$100</div>
                <p className="text-sm text-muted-foreground mt-1">Per month</p>
              </div>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <svg className="h-4 w-4 text-emerald-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>15 Competitors</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="h-4 w-4 text-emerald-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>50 Topics</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="h-4 w-4 text-emerald-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Realtime updates</span>
                </li>
              </ul>
              <Button className="w-full" onClick={() => setLocation("/auth/sign-up")}>
                Start Trial
              </Button>
            </Card>

            <Card className="glass-card p-6 space-y-6">
              <div>
                <h3 className="text-xl font-bold mb-2">Enterprise</h3>
                <div className="text-4xl font-bold font-mono">$1k</div>
                <p className="text-sm text-muted-foreground mt-1">Per month</p>
              </div>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <svg className="h-4 w-4 text-emerald-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Unlimited everything</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="h-4 w-4 text-emerald-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Custom integrations</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="h-4 w-4 text-emerald-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Priority support</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full" onClick={() => setLocation("/auth/sign-up")}>
                Contact Sales
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4">
        <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
          <p>© 2026 Geoscore. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-4">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-primary transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
