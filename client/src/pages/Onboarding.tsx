import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, ChevronRight, Loader2, Plus, Trash2, Sparkles, CreditCard } from "lucide-react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { PLAN_LIMITS, type PlanTier } from "@/lib/data-model";
import * as api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, setUser, refreshUser } = useAuth();

  // Load current onboarding step from user on mount
  useEffect(() => {
    if (user?.onboardingStep) {
      setStep(user.onboardingStep);
    }
  }, [user?.onboardingStep]);

  const [brandDomain, setBrandDomain] = useState("");
  const [brandName, setBrandName] = useState("");
  const [brandIndustry, setBrandIndustry] = useState("");
  const [brandSubindustry, setBrandSubindustry] = useState("");
  const [brandDescription, setBrandDescription] = useState("");
  const [brandSlogan, setBrandSlogan] = useState("");
  const [brandCity, setBrandCity] = useState("");
  const [brandState, setBrandState] = useState("");
  const [brandCountry, setBrandCountry] = useState("");
  const [brandLinkedinUrl, setBrandLinkedinUrl] = useState("");
  const [brandLogo, setBrandLogo] = useState("");
  const [brandId, setBrandId] = useState<string | null>(null);
  const [brandDevData, setBrandDevData] = useState<any>(null);

  const [competitors, setCompetitors] = useState<{ name: string; domain: string }[]>([{ name: "", domain: "" }]);

  const [selectedPlan, setSelectedPlan] = useState<PlanTier>("free");

  const [topicSuggestions, setTopicSuggestions] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [topicsGenerated, setTopicsGenerated] = useState(false);

  const [querySuggestions, setQuerySuggestions] = useState<string[]>([]);
  const [selectedQueries, setSelectedQueries] = useState<string[]>([]);
  const [queriesGenerated, setQueriesGenerated] = useState(false);

  const planLimits = PLAN_LIMITS[selectedPlan];
  const maxTopics = planLimits.maxTopics;
  const maxQueries = planLimits.maxQueries;

  const addCompetitor = () => {
    if (competitors.length < 3) {
      setCompetitors([...competitors, { name: "", domain: "" }]);
    }
  };

  const updateCompetitor = (index: number, field: "name" | "domain", value: string) => {
    const updated = [...competitors];
    updated[index][field] = value;
    setCompetitors(updated);
  };

  const removeCompetitor = (index: number) => {
    setCompetitors(competitors.filter((_, i) => i !== index));
  };

  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev => {
      if (prev.includes(topic)) return prev.filter(t => t !== topic);
      if (prev.length >= maxTopics) {
        toast({ title: `Maximum ${maxTopics} topics allowed on ${selectedPlan} plan`, variant: "destructive" });
        return prev;
      }
      return [...prev, topic];
    });
  };

  const toggleQuery = (query: string) => {
    setSelectedQueries(prev => {
      if (prev.includes(query)) return prev.filter(q => q !== query);
      if (prev.length >= maxQueries) {
        toast({ title: `Maximum ${maxQueries} queries allowed on ${selectedPlan} plan`, variant: "destructive" });
        return prev;
      }
      return [...prev, query];
    });
  };

  // Helper function to update onboarding step in database
  const updateOnboardingStep = async (newStep: number) => {
    try {
      await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ onboardingStep: newStep }),
      });
      // Refresh user data to get updated step
      await refreshUser();
    } catch (error) {
      console.error("Failed to update onboarding step:", error);
    }
  };

  const handleStep1 = async () => {
    if (!brandDomain.trim()) {
      toast({ title: "Please enter your brand domain", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const lookupResult = await api.lookupBrand(brandDomain.trim());

      // Store Brand.dev data for display
      setBrandDevData(lookupResult.brandDevData);

      const brand = await api.createBrand({
        name: lookupResult.name || brandDomain.replace(/\..+$/, "").charAt(0).toUpperCase() + brandDomain.replace(/\..+$/, "").slice(1),
        domain: brandDomain.trim(),
        description: lookupResult.description || "",
        industry: lookupResult.industry || "",
        subindustry: lookupResult.subindustry || "",
        slogan: lookupResult.slogan || "",
        city: lookupResult.city || "",
        state: lookupResult.state || "",
        country: lookupResult.country || "",
        linkedinUrl: lookupResult.linkedinUrl || "",
        logo: lookupResult.logo || "",
        brandDevData: lookupResult.brandDevData,
        tier: "free",
      });

      setBrandId(brand.id);
      setBrandName(brand.name || lookupResult.name || "");
      setBrandIndustry(brand.industry || lookupResult.industry || "");
      setBrandSubindustry(brand.subindustry || lookupResult.subindustry || "");
      setBrandDescription(brand.description || lookupResult.description || "");
      setBrandSlogan(brand.slogan || lookupResult.slogan || "");
      setBrandCity(brand.city || lookupResult.city || "");
      setBrandState(brand.state || lookupResult.state || "");
      setBrandCountry(brand.country || lookupResult.country || "");
      setBrandLinkedinUrl(brand.linkedinUrl || lookupResult.linkedinUrl || "");
      setBrandLogo(brand.logo || lookupResult.logo || "");
      setStep(2);
      await updateOnboardingStep(2);
    } catch (error: any) {
      toast({ title: "Error creating brand", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep2 = async () => {
    if (!brandId) return;

    setIsLoading(true);
    try {
      if (brandName || brandIndustry || brandDescription || brandCity || brandState || brandCountry || brandLinkedinUrl) {
        await api.updateBrand(brandId, {
          name: brandName,
          industry: brandIndustry,
          subindustry: brandSubindustry,
          description: brandDescription,
          slogan: brandSlogan,
          city: brandCity,
          state: brandState,
          country: brandCountry,
          linkedinUrl: brandLinkedinUrl,
        });
      }

      const validCompetitors = competitors.filter(c => c.domain.trim());
      for (const comp of validCompetitors) {
        // Enrich competitor with Brand.dev data
        let competitorData: any = {
          name: comp.name || comp.domain.replace(/\..+$/, ""),
          domain: comp.domain.trim(),
          isTracked: true,
        };

        // Fetch Brand.dev data for competitor
        try {
          const compLookup = await api.lookupBrand(comp.domain.trim());
          if (compLookup.brandDevData) {
            competitorData = {
              ...competitorData,
              description: compLookup.description || "",
              industry: compLookup.industry || "",
              subindustry: compLookup.subindustry || "",
              city: compLookup.city || "",
              state: compLookup.state || "",
              country: compLookup.country || "",
              linkedinUrl: compLookup.linkedinUrl || "",
              logo: compLookup.logo || "",
              brandDevData: compLookup.brandDevData,
            };
          }
        } catch (err) {
          console.warn("Failed to enrich competitor:", err);
        }

        await api.createCompetitor(brandId, competitorData);
      }
      setStep(3);
      await updateOnboardingStep(3);
    } catch (error: any) {
      toast({ title: "Error saving details", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep3 = async () => {
    if (!brandId) return;

    setIsLoading(true);
    try {
      await api.updateBrand(brandId, { tier: selectedPlan });

      toast({ title: "Generating AI-powered topic suggestions...", description: "This may take a few seconds" });
      const validCompetitors = competitors.filter(c => c.domain.trim());
      const result = await api.generateTopics(brandId, validCompetitors);
      setTopicSuggestions(result.topics || []);
      setTopicsGenerated(true);
      setStep(4);
      await updateOnboardingStep(4);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep4 = async () => {
    if (!brandId) return;
    if (selectedTopics.length === 0) {
      toast({ title: "Please select at least one topic", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      for (const topic of selectedTopics) {
        await api.createTopic(brandId, { name: topic });
      }

      toast({ title: "Generating AI-powered query suggestions...", description: "This may take a few seconds" });
      const validCompetitors = competitors.filter(c => c.domain.trim());
      const result = await api.generateQueries(brandId, validCompetitors, selectedTopics);
      setQuerySuggestions(result.queries || []);
      setQueriesGenerated(true);
      setStep(5);
      await updateOnboardingStep(5);
    } catch (error: any) {
      toast({ title: "Error saving topics", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep5 = async () => {
    if (!brandId) return;
    if (selectedQueries.length === 0) {
      toast({ title: "Please select at least one query", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      for (const query of selectedQueries) {
        await api.createPrompt(brandId, {
          text: query,
          category: "general",
          isActive: true,
        });
      }
      setStep(6);
      await updateOnboardingStep(6);
    } catch (error: any) {
      toast({ title: "Error saving queries", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // Activate account after successful payment
  const activateAccount = async () => {
    if (!brandId) return;

    try {
      // Update brand status to active
      await api.updateBrand(brandId, { status: "active" });

      // Mark onboarding as completed for the user
      await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ onboardingCompleted: true }),
      });

      // Update local user state
      if (user) {
        setUser({ ...user, onboardingCompleted: true });
      }

      // Fetch all prompts created during onboarding
      toast({ title: "Initializing AI analysis...", description: "Triggering LLM sampling for your queries" });
      const prompts = await api.getPrompts(brandId);

      if (prompts && prompts.length > 0) {
        // Trigger LLM sampling for each prompt
        const samplingPromises = prompts.map((prompt: any) =>
          api.triggerLLMSampling(prompt.id, ['openai', 'anthropic', 'google'])
            .catch((error: any) => {
              console.error(`Failed to trigger sampling for prompt ${prompt.id}:`, error);
              return null; // Continue with other prompts even if one fails
            })
        );

        await Promise.all(samplingPromises);

        toast({
          title: "Setup complete!",
          description: `AI analysis started for ${prompts.length} queries. Results will appear in your dashboard shortly.`
        });
      } else {
        toast({ title: "Setup complete!", description: "Redirecting to your dashboard..." });
      }

      setLocation("/app/dashboard");
    } catch (error: any) {
      console.error("Error during onboarding completion:", error);
      toast({
        title: "Setup complete with warnings",
        description: "Some background tasks may still be processing. Check your dashboard.",
        variant: "default"
      });
      setLocation("/app/dashboard");
    }
  };

  const handleFinish = async () => {
    if (!brandId || !user) return;
    setIsLoading(true);

    try {
      if (selectedPlan === "free") {
        // For free plan: Skip payment and directly activate account
        toast({ title: "Activating free account...", description: "Please wait" });
        await activateAccount();
        setIsLoading(false);
      } else {
        // For paid plans: Create subscription and process payment
        toast({ title: "Creating subscription...", description: "Please wait" });

        const subscriptionData = await fetch(`/api/brands/${brandId}/subscription`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            planId: selectedPlan,
            email: user.email,
            phone: "", // Phone number if available
            startTrial: false,
          }),
        }).then(res => res.json());

        if (!subscriptionData.razorpaySubscriptionId) {
          throw new Error("Failed to create subscription");
        }

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_xxxxx",
          subscription_id: subscriptionData.razorpaySubscriptionId,
          name: "GeoScore",
          description: `${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} plan subscription`,
          handler: async function(response: any) {
            console.log("Payment successful:", response);
            setIsLoading(true);
            await activateAccount();
            setIsLoading(false);
          },
          prefill: {
            email: user.email,
            contact: "", // Phone number if available
          },
          theme: {
            color: "#6366f1"
          },
          modal: {
            ondismiss: function() {
              setIsLoading(false);
              toast({
                title: "Payment cancelled",
                description: "Please complete payment to activate your account.",
                variant: "destructive"
              });
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      toast({
        title: "Payment error",
        description: error.message || "Failed to process payment. Please try again.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  const handleNext = async () => {
    switch (step) {
      case 1: return handleStep1();
      case 2: return handleStep2();
      case 3: return handleStep3();
      case 4: return handleStep4();
      case 5: return handleStep5();
      case 6: return handleFinish();
    }
  };

  const totalSteps = 6;
  const stepLabels = ["Brand", "Details", "Plan", "Topics", "Queries", "Confirm"];

  return (
    <div className="max-w-5xl mx-auto py-12 animate-in fade-in duration-700">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-display font-bold mb-2">Setup Your Brand</h1>
        <p className="text-muted-foreground">Complete these steps to activate your AI visibility intelligence.</p>
      </div>

      <div className="flex items-center justify-center mb-12">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((i) => (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all
                ${step >= i
                  ? "bg-primary border-primary text-primary-foreground"
                  : "bg-background border-muted text-muted-foreground"}
              `}>
                {step > i ? <Check className="h-4 w-4" /> : i}
              </div>
              <span className="text-[10px] text-muted-foreground mt-1">{stepLabels[i - 1]}</span>
            </div>
            {i < totalSteps && (
              <div className={`w-12 h-0.5 mx-1 ${step > i ? "bg-primary" : "bg-muted"}`} />
            )}
          </div>
        ))}
      </div>

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>
            {step === 1 && "Brand Identity"}
            {step === 2 && "Brand Details & Competitors"}
            {step === 3 && "Choose Your Plan"}
            {step === 4 && "Topic Clusters"}
            {step === 5 && "Target Prompts"}
            {step === 6 && "Confirm & Activate"}
          </CardTitle>
          <CardDescription>
            {step === 1 && "Start by entering your brand domain to auto-detect your brand info."}
            {step === 2 && "Review your brand details and add up to 3 competitors."}
            {step === 3 && "Select a subscription to unlock features."}
            {step === 4 && `AI-generated topics for your brand. Select up to ${maxTopics} (${selectedPlan} plan).`}
            {step === 5 && `AI-generated prompts to monitor. Select up to ${maxQueries} (${selectedPlan} plan).`}
            {step === 6 && (selectedPlan === "free" ? "Review your setup and activate your free account." : "Complete payment to activate your account.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="domain">Brand Domain</Label>
                <div className="flex gap-2 flex-wrap">
                  <Input
                    id="domain"
                    placeholder="e.g. acme.com"
                    className="font-mono flex-1"
                    value={brandDomain}
                    onChange={(e) => setBrandDomain(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleStep1()}
                    data-testid="input-brand-domain"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  We'll auto-detect your brand info and create your profile.
                </p>
              </div>

              {brandDevData && (
                <div className="space-y-2 mt-4">
                  <Label>Brand.dev API Response</Label>
                  <div className="bg-muted p-4 rounded-md overflow-auto max-h-96">
                    <pre className="text-xs font-mono whitespace-pre-wrap">
                      {JSON.stringify(brandDevData, null, 2)}
                    </pre>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Brand information retrieved from Brand.dev API
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {brandLogo && (
                <div className="flex items-center gap-3 mb-2">
                  <img src={brandLogo} alt={brandName} className="w-10 h-10 rounded-md object-contain border" />
                  <span className="text-sm text-muted-foreground">Brand logo detected</span>
                </div>
              )}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Brand Name (Title)</Label>
                  <Input
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    data-testid="input-brand-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slogan</Label>
                  <Input
                    value={brandSlogan}
                    onChange={(e) => setBrandSlogan(e.target.value)}
                    placeholder="Brand slogan or tagline"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Industry</Label>
                  <Input
                    value={brandIndustry}
                    onChange={(e) => setBrandIndustry(e.target.value)}
                    placeholder="e.g. Enterprise Software"
                    data-testid="input-brand-industry"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sub-Industry</Label>
                  <Input
                    value={brandSubindustry}
                    onChange={(e) => setBrandSubindustry(e.target.value)}
                    placeholder="e.g. CRM Software"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Description (About Brand)</Label>
                  <Textarea
                    value={brandDescription}
                    onChange={(e) => setBrandDescription(e.target.value)}
                    placeholder="Brief description of your brand..."
                    data-testid="input-brand-description"
                  />
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={brandCity}
                    onChange={(e) => setBrandCity(e.target.value)}
                    placeholder="e.g. San Francisco"
                  />
                </div>
                <div className="space-y-2">
                  <Label>State/Province</Label>
                  <Input
                    value={brandState}
                    onChange={(e) => setBrandState(e.target.value)}
                    placeholder="e.g. California"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input
                    value={brandCountry}
                    onChange={(e) => setBrandCountry(e.target.value)}
                    placeholder="e.g. United States"
                  />
                </div>
                <div className="space-y-2">
                  <Label>LinkedIn URL</Label>
                  <Input
                    value={brandLinkedinUrl}
                    onChange={(e) => setBrandLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/company/..."
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <Label>Competitors (Max 3)</Label>
                  {competitors.length < 3 && (
                    <Button variant="ghost" size="sm" onClick={addCompetitor} className="h-6 text-xs" data-testid="button-add-competitor">
                      <Plus className="h-3 w-3 mr-1" /> Add
                    </Button>
                  )}
                </div>
                {competitors.map((comp, idx) => (
                  <div key={idx} className="flex gap-2 flex-wrap">
                    <Input
                      placeholder="Name"
                      value={comp.name}
                      onChange={(e) => updateCompetitor(idx, "name", e.target.value)}
                      className="flex-1 min-w-[120px]"
                      data-testid={`input-competitor-name-${idx}`}
                    />
                    <Input
                      placeholder="domain.com"
                      value={comp.domain}
                      onChange={(e) => updateCompetitor(idx, "domain", e.target.value)}
                      className="flex-1 min-w-[120px] font-mono"
                      data-testid={`input-competitor-domain-${idx}`}
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeCompetitor(idx)} disabled={competitors.length === 1} data-testid={`button-remove-competitor-${idx}`}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { key: "free" as PlanTier, label: "Free", price: "$0/mo", features: [`${PLAN_LIMITS.free.maxCompetitors} Competitors`, `${PLAN_LIMITS.free.maxTopics} Topics`, `${PLAN_LIMITS.free.maxQueries} Queries`, "Weekly Updates"] },
                  { key: "growth" as PlanTier, label: "Growth", price: "$100/mo", features: [`${PLAN_LIMITS.growth.maxCompetitors} Competitors`, `${PLAN_LIMITS.growth.maxTopics} Topics`, `${PLAN_LIMITS.growth.maxQueries} Queries`, "Daily Updates"] },
                  { key: "enterprise" as PlanTier, label: "Enterprise", price: "$1k/mo", features: ["Unlimited Competitors", "Unlimited Topics", "Unlimited Queries", "Real-time Updates"] },
                ].map((plan) => (
                  <div
                    key={plan.key}
                    className={`p-4 border rounded-md cursor-pointer transition-all text-center space-y-2 ${
                      selectedPlan === plan.key ? "border-primary bg-primary/5" : "hover:border-muted-foreground/30"
                    }`}
                    onClick={() => setSelectedPlan(plan.key)}
                    data-testid={`plan-${plan.key}`}
                  >
                    <h3 className="font-bold">{plan.label}</h3>
                    <div className="text-2xl font-bold font-mono">{plan.price}</div>
                    <ul className="text-xs text-muted-foreground space-y-1 text-left pl-4 list-disc">
                      {plan.features.map((f) => <li key={f}>{f}</li>)}
                    </ul>
                    {selectedPlan === plan.key && (
                      <Badge variant="default" className="text-[10px]">Selected</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <Label className="text-base">AI-Generated Topics</Label>
                </div>
                <Badge variant="outline">
                  {selectedTopics.length} / {maxTopics} selected
                </Badge>
              </div>
              {!topicsGenerated || topicSuggestions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mb-2" />
                  <p className="text-sm">Generating topics with AI...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {topicSuggestions.map(topic => {
                    const isSelected = selectedTopics.includes(topic);
                    const isDisabled = !isSelected && selectedTopics.length >= maxTopics;
                    return (
                      <div
                        key={topic}
                        className={`flex items-center space-x-2 border p-3 rounded-md cursor-pointer transition-all ${
                          isSelected ? "border-primary bg-primary/5" : isDisabled ? "opacity-50 cursor-not-allowed" : "hover:bg-accent"
                        }`}
                        onClick={() => !isDisabled && toggleTopic(topic)}
                        data-testid={`topic-${topic.replace(/\s+/g, '-').toLowerCase()}`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label className="text-sm font-medium flex-1 cursor-pointer">{topic}</label>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <Label className="text-base">AI-Generated Prompts</Label>
                </div>
                <Badge variant="outline">
                  {selectedQueries.length} / {maxQueries} selected
                </Badge>
              </div>
              {!queriesGenerated || querySuggestions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mb-2" />
                  <p className="text-sm">Generating prompts with AI...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {querySuggestions.map(query => {
                    const isSelected = selectedQueries.includes(query);
                    const isDisabled = !isSelected && selectedQueries.length >= maxQueries;
                    return (
                      <div
                        key={query}
                        className={`flex items-center gap-2 text-sm p-3 rounded-md cursor-pointer transition-all ${
                          isSelected ? "border border-primary bg-primary/5" : isDisabled ? "border opacity-50 cursor-not-allowed" : "border hover:bg-accent"
                        }`}
                        onClick={() => !isDisabled && toggleQuery(query)}
                        data-testid={`query-${query.replace(/\s+/g, '-').toLowerCase().slice(0, 30)}`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span>{query}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {step === 6 && (
            <div className="space-y-6">
              <div className="p-4 border rounded-md bg-card/50">
                <h3 className="font-semibold mb-3">Setup Summary</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Brand:</span>
                    <span className="ml-2 font-medium">{brandName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Domain:</span>
                    <span className="ml-2 font-mono text-xs">{brandDomain}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Plan:</span>
                    <Badge variant="outline" className="ml-2 capitalize">{selectedPlan}</Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Industry:</span>
                    <span className="ml-2">{brandIndustry || "Not set"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Topics:</span>
                    <span className="ml-2">{selectedTopics.length} selected</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Queries:</span>
                    <span className="ml-2">{selectedQueries.length} selected</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Competitors:</span>
                    <span className="ml-2">{competitors.filter(c => c.domain.trim()).length} added</span>
                  </div>
                </div>
              </div>

              {selectedPlan === "free" ? (
                <div className="p-4 border rounded-md bg-primary/5 text-center space-y-2">
                  <CreditCard className="h-8 w-8 mx-auto text-primary" />
                  <p className="font-medium">Free Plan Selected</p>
                  <p className="text-sm text-muted-foreground">
                    No payment required. Click "Activate Account" to complete setup and start analyzing your brand's AI visibility.
                  </p>
                </div>
              ) : (
                <div className="p-4 border rounded-md bg-primary/5 text-center space-y-3">
                  <CreditCard className="h-8 w-8 mx-auto text-primary" />
                  <div>
                    <p className="font-medium text-lg">{selectedPlan === "starter" ? "Starter" : selectedPlan === "growth" ? "Growth" : "Enterprise"} Plan</p>
                    <p className="text-2xl font-bold text-primary mt-1">
                      {selectedPlan === "starter" ? "₹30" : selectedPlan === "growth" ? "₹100" : "₹1,000"}<span className="text-sm font-normal text-muted-foreground">/month</span>
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Payment will be processed securely via Razorpay.
                    Click "Activate Account" to complete payment and activate your subscription.
                  </p>
                </div>
              )}
            </div>
          )}

        </CardContent>
        <CardFooter className="flex justify-between border-t pt-6 flex-wrap gap-2">
          <Button variant="ghost" onClick={() => step > 1 && setStep(step - 1)} disabled={step === 1 || isLoading} data-testid="button-onboarding-back">
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={isLoading}
            className="min-w-[140px]"
            data-testid="button-onboarding-next"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <>
                {step === totalSteps ? "Activate Account" : step === 3 ? "Generate Topics" : step === 4 ? "Generate Prompts" : "Continue"}
                <ChevronRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
