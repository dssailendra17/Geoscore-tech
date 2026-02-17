import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { 
  Building2, Users, CreditCard, Clock, Settings as SettingsIcon, 
  Mail, Shield, UserPlus, Trash2, Crown, Check, AlertCircle,
  Calendar, RefreshCw, Zap, Key, Smartphone, Monitor, Globe,
  Pencil, X, Lock, Eye, EyeOff, ChevronRight, Loader2, Play
} from "lucide-react";
import { PLAN_LIMITS } from "@/lib/data-model";
import { cn } from "@/lib/utils";
import { useBrandJobs } from "@/hooks/use-jobs";
import { useTriggerEnrichment } from "@/hooks/use-brand-context";
import { useCurrentBrand } from "@/hooks/use-brand";

const mockTeamMembers = [
  { id: "1", name: "John Doe", email: "john@acme.com", role: "admin", avatar: "", status: "active", lastActive: "2 hours ago" },
  { id: "2", name: "Jane Smith", email: "jane@acme.com", role: "editor", avatar: "", status: "active", lastActive: "1 day ago" },
  { id: "3", name: "Mike Johnson", email: "mike@acme.com", role: "viewer", avatar: "", status: "pending", lastActive: "Invited" },
];

const mockInvoices = [
  { id: "INV-001", date: "Jan 1, 2026", amount: "$100.00", status: "paid" },
  { id: "INV-002", date: "Dec 1, 2025", amount: "$100.00", status: "paid" },
  { id: "INV-003", date: "Nov 1, 2025", amount: "$100.00", status: "paid" },
];

const allPlans = [
  { 
    id: "free", 
    name: "Free", 
    price: 0, 
    priceLabel: "$0", 
    period: "/month",
    features: ["3 competitors", "15 queries/day", "Basic analytics", "Community support"],
    popular: false
  },
  { 
    id: "starter", 
    name: "Starter", 
    price: 30, 
    priceLabel: "$30", 
    period: "/month",
    features: ["5 competitors", "50 queries/day", "GSC integration", "Email support", "Weekly reports"],
    popular: false
  },
  { 
    id: "growth", 
    name: "Growth", 
    price: 100, 
    priceLabel: "$100", 
    period: "/month",
    features: ["15 competitors", "200 queries/day", "Full integrations", "Data exports", "Priority support", "Custom reports"],
    popular: true
  },
  { 
    id: "enterprise", 
    name: "Enterprise", 
    price: 1000, 
    priceLabel: "$1,000", 
    period: "/month",
    features: ["Unlimited competitors", "Unlimited queries", "SSO/SAML", "Dedicated support", "Custom SLA", "API access", "White-label option"],
    popular: false
  },
];

export default function Settings() {
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState("organization");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ old: "", new: "", confirm: "" });
  const [showPassword, setShowPassword] = useState({ old: false, new: false, confirm: false });
  const [otpCode, setOtpCode] = useState("");
  const [editMode, setEditMode] = useState(false);

  // Fetch current brand from database
  const { brand, brandId, isLoading: brandLoading } = useCurrentBrand();

  // Fetch billing data
  const [subscription, setSubscription] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [billingLoading, setBillingLoading] = useState(false);
  const [enrichmentTriggered, setEnrichmentTriggered] = useState(false);

  // Active devices/sessions
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Trigger brand enrichment if fields are missing
  useEffect(() => {
    if (brand && brandId && !enrichmentTriggered) {
      const needsEnrichment = !brand.industry || !brand.description || !brand.logo ||
                              !brand.city || !brand.state || !brand.country;

      if (needsEnrichment) {
        setEnrichmentTriggered(true);
        fetch(`/api/brands/${brandId}/enrich`, {
          method: 'POST',
          credentials: 'include',
        })
          .then(r => r.json())
          .then(data => {
            if (data.fieldsUpdated && data.fieldsUpdated.length > 0) {
              console.log('Brand enriched with fields:', data.fieldsUpdated);
              // Refresh the page to show updated data
              window.location.reload();
            }
          })
          .catch(err => console.error('Enrichment failed:', err));
      }
    }
  }, [brand, brandId, enrichmentTriggered]);

  useEffect(() => {
    if (brandId && activeTab === "billing") {
      fetchBillingData();
    }
  }, [brandId, activeTab]);

  useEffect(() => {
    if (activeTab === "security") {
      fetchActiveSessions();
    }
  }, [activeTab]);

  const fetchActiveSessions = async () => {
    setSessionsLoading(true);
    try {
      const response = await fetch('/api/sessions', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setActiveSessions(data);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setSessionsLoading(false);
    }
  };

  const handleRevokeSession = async (sessionToken: string) => {
    try {
      const response = await fetch(`/api/sessions/${sessionToken}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        // Refresh sessions list
        await fetchActiveSessions();
      } else {
        const error = await response.json();
        console.error('Failed to revoke session:', error.message);
      }
    } catch (error) {
      console.error('Failed to revoke session:', error);
    }
  };

  const fetchBillingData = async () => {
    if (!brandId) return;
    setBillingLoading(true);
    try {
      const [subData, usageData, invoicesData] = await Promise.all([
        fetch(`/api/brands/${brandId}/subscription`, { credentials: 'include' }).then(r => r.json()),
        fetch(`/api/brands/${brandId}/usage`, { credentials: 'include' }).then(r => r.json()),
        fetch(`/api/brands/${brandId}/invoices?limit=10`, { credentials: 'include' }).then(r => r.json()),
      ]);
      setSubscription(subData);
      setUsage(usageData);
      setInvoices(invoicesData);
    } catch (error) {
      console.error('Failed to fetch billing data:', error);
    } finally {
      setBillingLoading(false);
    }
  };

  const currentPlan = allPlans.find(p => p.id === brand?.tier) || allPlans[0];
  const planCaps = PLAN_LIMITS[brand?.tier || "free"];

  // Job tracking
  const { data: brandJobs, isLoading: jobsLoading } = useBrandJobs(brandId || "");
  const { mutate: triggerEnrichment, isPending: isTriggering } = useTriggerEnrichment(brandId || "");
  const latestJob = brandJobs?.[0];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    const openUpgrade = params.get('upgrade');
    
    if (tab && ['organization', 'team', 'billing', 'schedule'].includes(tab)) {
      setActiveTab(tab);
    }
    if (openUpgrade === 'true' || tab === 'billing') {
      setTimeout(() => setShowUpgradeModal(true), 100);
    }
  }, [location]);

  const handlePasswordChange = () => {
    if (passwordForm.new !== passwordForm.confirm) {
      alert("Passwords do not match");
      return;
    }
    setShowPasswordModal(false);
    setShowOtpModal(true);
  };

  const handleOtpVerify = () => {
    setShowOtpModal(false);
    setOtpCode("");
    setPasswordForm({ old: "", new: "", confirm: "" });
  };

  const handleRazorpayPayment = (plan: typeof allPlans[0]) => {
    const options = {
      key: "rzp_test_xxxxx",
      amount: plan.price * 100,
      currency: "INR",
      name: "Geoscore",
      description: `${plan.name} Plan Subscription`,
      handler: function(response: any) {
        console.log("Payment successful:", response);
        setShowUpgradeModal(false);
      },
      prefill: {
        email: "admin@acme.com",
        contact: "+919876543210"
      },
      theme: {
        color: "#6366f1"
      }
    };
    console.log("Razorpay options:", options);
    alert(`This would open Razorpay checkout for ${plan.name} plan at ${plan.priceLabel}/month`);
  };

  const UpgradeModal = () => (
    <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="modal-upgrade">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Crown className="h-6 w-6 text-amber-500" />
            Choose Your Plan
          </DialogTitle>
          <DialogDescription>
            Select the plan that best fits your needs. Upgrade or downgrade anytime.
          </DialogDescription>
        </DialogHeader>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 py-4">
          {allPlans.map(plan => (
            <Card 
              key={plan.id} 
              className={cn(
                "relative transition-all hover:shadow-lg",
                plan.id === brand?.tier && "ring-2 ring-primary",
                plan.popular && "border-primary"
              )}
              data-testid={`plan-card-${plan.id}`}
            >
              {plan.popular && (
                <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary">Most Popular</Badge>
              )}
              {plan.id === brand?.tier && (
                <Badge variant="secondary" className="absolute -top-2 right-2">Current</Badge>
              )}
              <CardHeader className="pb-2 pt-6">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-3xl font-bold">{plan.priceLabel}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={plan.id === brand?.tier ? "outline" : plan.popular ? "default" : "outline"}
                  disabled={plan.id === brand?.tier}
                  onClick={() => handleRazorpayPayment(plan)}
                  data-testid={`btn-select-${plan.id}`}
                >
                  {plan.id === brand?.tier ? "Current Plan" : plan.price === 0 ? "Downgrade" : "Upgrade"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground border-t pt-4">
          <Shield className="h-4 w-4" />
          <span>Secure payment powered by Razorpay. Cancel anytime.</span>
        </div>
      </DialogContent>
    </Dialog>
  );

  const PasswordChangeModal = () => (
    <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
      <DialogContent
        className="max-w-md"
        data-testid="modal-password"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Reset Password
          </DialogTitle>
          <DialogDescription>
            Enter your current password and choose a new one.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); handlePasswordChange(); }} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="old-password">Old Password</Label>
            <div className="relative">
              <Input
                id="old-password"
                type={showPassword.old ? "text" : "password"}
                value={passwordForm.old}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, old: e.target.value }))}
                placeholder="Enter current password"
                data-testid="input-old-password"
                autoComplete="current-password"
                autoFocus={false}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full hover:bg-transparent"
                onClick={(e) => { e.preventDefault(); setShowPassword(prev => ({ ...prev, old: !prev.old })); }}
                tabIndex={-1}
              >
                {showPassword.old ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword.new ? "text" : "password"}
                value={passwordForm.new}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, new: e.target.value }))}
                placeholder="Enter new password"
                data-testid="input-new-password"
                autoComplete="new-password"
                autoFocus={false}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full hover:bg-transparent"
                onClick={(e) => { e.preventDefault(); setShowPassword(prev => ({ ...prev, new: !prev.new })); }}
                tabIndex={-1}
              >
                {showPassword.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showPassword.confirm ? "text" : "password"}
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm: e.target.value }))}
                placeholder="Confirm new password"
                data-testid="input-confirm-password"
                autoComplete="new-password"
                autoFocus={false}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full hover:bg-transparent"
                onClick={(e) => { e.preventDefault(); setShowPassword(prev => ({ ...prev, confirm: !prev.confirm })); }}
                tabIndex={-1}
              >
                {showPassword.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setShowPasswordModal(false)}>Cancel</Button>
          <Button type="button" onClick={handlePasswordChange} data-testid="btn-submit-password">Save & Verify</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const OtpVerificationModal = () => (
    <Dialog open={showOtpModal} onOpenChange={setShowOtpModal}>
      <DialogContent
        className="max-w-sm"
        data-testid="modal-otp"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Verify OTP
          </DialogTitle>
          <DialogDescription>
            We've sent a verification code to your registered phone number. Please enter it below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); if (otpCode.length === 6) handleOtpVerify(); }} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="otp-input">Enter OTP Code</Label>
            <Input
              id="otp-input"
              type="text"
              value={otpCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setOtpCode(value);
              }}
              placeholder="Enter 6-digit code"
              maxLength={6}
              className="text-center text-2xl tracking-[0.5em] font-mono"
              data-testid="input-otp"
              inputMode="numeric"
              pattern="[0-9]*"
              autoFocus={false}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Didn't receive the code? <Button type="button" variant="link" className="p-0 h-auto text-xs">Resend OTP</Button>
          </p>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setShowOtpModal(false)}>Cancel</Button>
          <Button type="button" onClick={handleOtpVerify} disabled={otpCode.length !== 6} data-testid="btn-verify-otp">
            Verify & Update Password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <UpgradeModal />
      <PasswordChangeModal />
      <OtpVerificationModal />

      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your organization, team, billing, and analysis preferences.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="organization" className="gap-2" data-testid="tab-organization">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Organization</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2" data-testid="tab-team">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Team</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2" data-testid="tab-billing">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Billing</span>
          </TabsTrigger>
          <TabsTrigger value="schedule" className="gap-2" data-testid="tab-schedule">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Schedule</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="organization" className="space-y-6 max-w-3xl">
          <Card className="glass-card" data-testid="card-brand-details">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Brand Information
                  </CardTitle>
                  <CardDescription>View and manage your core brand details.</CardDescription>
                </div>
                <Button 
                  variant={editMode ? "default" : "outline"} 
                  onClick={() => setEditMode(!editMode)}
                  data-testid="btn-edit-details"
                >
                  {editMode ? <Check className="h-4 w-4 mr-2" /> : <Pencil className="h-4 w-4 mr-2" />}
                  {editMode ? "Save Details" : "Edit Details"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {brandLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Loading brand details...</span>
                </div>
              ) : !brand ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  No brand found. Please complete onboarding first.
                </div>
              ) : (
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Brand Name</Label>
                    <Input defaultValue={brand.name} disabled={!editMode} data-testid="input-brand-name" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Website URL</Label>
                    <Input defaultValue={brand.domain} disabled={!editMode} data-testid="input-website-url" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Product Description</Label>
                    <Textarea
                      defaultValue={brand.description || ""}
                      disabled={!editMode}
                      rows={4}
                      data-testid="input-product-description"
                    />
                  </div>
                  {brand.slogan && (
                    <div className="grid gap-2">
                      <Label>Brand Slogan</Label>
                      <Input defaultValue={brand.slogan} disabled={!editMode} data-testid="input-brand-slogan" />
                    </div>
                  )}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Industry</Label>
                      <Select defaultValue={brand.industry || "technology"} disabled={!editMode}>
                        <SelectTrigger data-testid="select-industry">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="technology">Technology</SelectItem>
                          <SelectItem value="saas">SaaS / Software</SelectItem>
                          <SelectItem value="ecommerce">E-commerce</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="healthcare">Healthcare</SelectItem>
                          <SelectItem value="education">Education</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {brand.subindustry && (
                      <div className="grid gap-2">
                        <Label>Sub-Industry</Label>
                        <Input defaultValue={brand.subindustry} disabled={!editMode} data-testid="input-subindustry" />
                      </div>
                    )}
                  </div>
                  {(brand.city || brand.state || brand.country) && (
                    <div className="grid md:grid-cols-3 gap-4">
                      {brand.city && (
                        <div className="grid gap-2">
                          <Label>City</Label>
                          <Input defaultValue={brand.city} disabled={!editMode} data-testid="input-city" />
                        </div>
                      )}
                      {brand.state && (
                        <div className="grid gap-2">
                          <Label>State/Province</Label>
                          <Input defaultValue={brand.state} disabled={!editMode} data-testid="input-state" />
                        </div>
                      )}
                      {brand.country && (
                        <div className="grid gap-2">
                          <Label>Country</Label>
                          <Input defaultValue={brand.country} disabled={!editMode} data-testid="input-country" />
                        </div>
                      )}
                    </div>
                  )}
                  {brand.linkedinUrl && (
                    <div className="grid gap-2">
                      <Label>LinkedIn URL</Label>
                      <Input defaultValue={brand.linkedinUrl} disabled={!editMode} data-testid="input-linkedin-url" />
                    </div>
                  )}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Primary Language</Label>
                      <Select defaultValue={brand.primaryLanguage || "en"} disabled={!editMode}>
                        <SelectTrigger data-testid="select-language">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">🇺🇸 English</SelectItem>
                          <SelectItem value="es">🇪🇸 Spanish</SelectItem>
                          <SelectItem value="fr">🇫🇷 French</SelectItem>
                          <SelectItem value="de">🇩🇪 German</SelectItem>
                          <SelectItem value="hi">🇮🇳 Hindi</SelectItem>
                          <SelectItem value="zh">🇨🇳 Chinese</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Target Market/Location</Label>
                      <Select defaultValue={brand.targetMarket || "us"} disabled={!editMode}>
                        <SelectTrigger data-testid="select-location">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="us">🇺🇸 United States</SelectItem>
                          <SelectItem value="uk">🇬🇧 United Kingdom</SelectItem>
                          <SelectItem value="in">🇮🇳 India</SelectItem>
                          <SelectItem value="eu">🇪🇺 Europe</SelectItem>
                          <SelectItem value="global">🌍 Global</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Brand Name Variations</Label>
                    <p className="text-xs text-muted-foreground">Add alternative names that should be recognized as mentions of your brand.</p>
                    <div className="p-4 border rounded-lg bg-muted/30 text-center text-sm text-muted-foreground">
                      {brand.brandVariations && brand.brandVariations.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {brand.brandVariations.map((variation, idx) => (
                            <Badge key={idx} variant="secondary">{variation}</Badge>
                          ))}
                        </div>
                      ) : (
                        <>
                          <p>No variations added yet. Add variations like "{brand.name.split(' ')[0]}", "{brand.name} Inc", etc. to improve brand detection.</p>
                          <Button variant="link" className="mt-2 p-0 h-auto" disabled={!editMode}>Click "Edit Details" to manage variations</Button>
                        </>
                      )}
                    </div>
                  </div>

                  {brand.brandDevData && (
                    <div className="grid gap-2 border-t pt-4">
                      <Label>Brand.dev Enrichment Data</Label>
                      <p className="text-xs text-muted-foreground">Full brand information from Brand.dev API</p>
                      <div className="bg-muted p-4 rounded-md overflow-auto max-h-96">
                        <pre className="text-xs font-mono whitespace-pre-wrap">
                          {JSON.stringify(brand.brandDevData, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="border-t pt-6">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  Developer Tools
                </h4>
                <p className="text-sm text-muted-foreground mb-3">Clear browser storage for debugging purposes</p>
                <Button variant="outline" className="text-destructive hover:text-destructive" data-testid="btn-clear-storage">
                  Clear Report Storage
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card" data-testid="card-notifications">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Weekly Reports</Label>
                  <p className="text-sm text-muted-foreground">Receive a summary of AI visibility every Monday.</p>
                </div>
                <Switch defaultChecked data-testid="switch-weekly-reports" />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Critical Alerts</Label>
                  <p className="text-sm text-muted-foreground">Get notified immediately for large visibility drops.</p>
                </div>
                <Switch defaultChecked data-testid="switch-critical-alerts" />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Competitor Alerts</Label>
                  <p className="text-sm text-muted-foreground">Alert when a competitor gains significant visibility.</p>
                </div>
                <Switch data-testid="switch-competitor-alerts" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card" data-testid="card-security">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Reset Password
              </CardTitle>
              <CardDescription>Update your account password for enhanced security.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setShowPasswordModal(true)} className="gap-2" data-testid="btn-reset-password">
                <Key className="h-4 w-4" />
                Change Password
              </Button>
              <p className="text-xs text-muted-foreground mt-2">You'll need to verify with OTP sent to your phone.</p>
            </CardContent>
          </Card>

          <Card className="glass-card" data-testid="card-devices">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Active Devices
              </CardTitle>
              <CardDescription>Manage devices where your account is currently logged in.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {sessionsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : activeSessions.length > 0 ? (
                activeSessions.map(device => (
                  <div
                    key={device.id}
                    className={cn(
                      "p-4 border rounded-lg flex items-center justify-between",
                      device.current && "border-primary bg-primary/5"
                    )}
                    data-testid={`device-${device.id}`}
                  >
                    <div className="flex items-center gap-4">
                      {device.deviceType === 'mobile' ? (
                        <Smartphone className="h-8 w-8 text-muted-foreground" />
                      ) : (
                        <Monitor className="h-8 w-8 text-muted-foreground" />
                      )}
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {device.name}
                          {device.current && <Badge variant="secondary" className="text-xs">Current</Badge>}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {device.browser} • {device.os} • {device.ip}
                        </div>
                        <div className="text-xs text-muted-foreground">{device.lastActive}</div>
                      </div>
                    </div>
                    {!device.current && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleRevokeSession(device.sessionToken)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Revoke
                      </Button>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <Smartphone className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No active sessions found</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="flex gap-4">
            <Button data-testid="btn-save-org">Save Changes</Button>
            <Button variant="outline" data-testid="btn-cancel-org">Cancel</Button>
          </div>
        </TabsContent>

        <TabsContent value="team" className="space-y-6 max-w-4xl">
          {brand?.tier === "free" ? (
            <Card className="glass-card border-2 border-dashed" data-testid="card-team-locked">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="h-5 w-5 text-muted-foreground" />
                      Team Members
                      <Badge variant="secondary" className="ml-2">
                        <Crown className="h-3 w-3 mr-1" />
                        Upgrade Required
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Team collaboration is available on paid plans
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="text-center py-12">
                <div className="max-w-md mx-auto space-y-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">Collaborate with Your Team</h3>
                  <p className="text-sm text-muted-foreground">
                    Upgrade to a paid plan to invite team members, assign roles, and collaborate on brand visibility tracking.
                  </p>
                  <div className="grid grid-cols-3 gap-4 pt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">3</div>
                      <div className="text-xs text-muted-foreground">Starter Plan</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">10</div>
                      <div className="text-xs text-muted-foreground">Growth Plan</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">∞</div>
                      <div className="text-xs text-muted-foreground">Enterprise</div>
                    </div>
                  </div>
                  <Button onClick={() => setShowUpgradeModal(true)} className="gap-2 mt-6">
                    <Crown className="h-4 w-4" />
                    Upgrade Plan
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="glass-card" data-testid="card-team-management">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Team Members
                    </CardTitle>
                    <CardDescription>
                      {mockTeamMembers.length} of {brand?.tier === "enterprise" ? "unlimited" : PLAN_LIMITS[brand?.tier as keyof typeof PLAN_LIMITS]?.maxTeamMembers || 10} seats used
                    </CardDescription>
                  </div>
                  <Button
                    className="gap-2"
                    data-testid="btn-invite-member"
                    disabled={brand?.tier !== "enterprise" && mockTeamMembers.length >= (PLAN_LIMITS[brand?.tier as keyof typeof PLAN_LIMITS]?.maxTeamMembers || 10)}
                  >
                    <UserPlus className="h-4 w-4" />
                    Invite Member
                  </Button>
                </div>
              </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockTeamMembers.map(member => (
                    <TableRow key={member.id} data-testid={`row-member-${member.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{member.name}</div>
                            <div className="text-xs text-muted-foreground">{member.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select defaultValue={member.role}>
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">
                              <div className="flex items-center gap-1">
                                <Crown className="h-3 w-3" /> Admin
                              </div>
                            </SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={member.status === "active" ? "outline" : "secondary"}
                          className={cn(
                            member.status === "active" && "text-green-600 border-green-300 bg-green-50"
                          )}
                        >
                          {member.status === "active" ? <Check className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{member.lastActive}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          )}

          {brand?.tier !== "free" && (
            <Card className="glass-card" data-testid="card-permissions">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Role Permissions
                </CardTitle>
                <CardDescription>Role permissions are managed by your organization admin.</CardDescription>
              </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-4 gap-4 text-sm font-medium border-b pb-2">
                  <div>Permission</div>
                  <div className="text-center">Admin</div>
                  <div className="text-center">Editor</div>
                  <div className="text-center">Viewer</div>
                </div>
                {[
                  "View Dashboard",
                  "Manage Prompts",
                  "Add Competitors",
                  "Export Data",
                  "Manage Team",
                  "Billing Access",
                ].map((perm, i) => (
                  <div key={perm} className="grid grid-cols-4 gap-4 text-sm">
                    <div>{perm}</div>
                    <div className="text-center"><Check className="h-4 w-4 text-green-500 mx-auto" /></div>
                    <div className="text-center">{i < 4 ? <Check className="h-4 w-4 text-green-500 mx-auto" /> : <span className="text-muted-foreground">—</span>}</div>
                    <div className="text-center">{i < 1 ? <Check className="h-4 w-4 text-green-500 mx-auto" /> : <span className="text-muted-foreground">—</span>}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          )}
        </TabsContent>

        <TabsContent value="billing" className="space-y-6 max-w-4xl">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="glass-card" data-testid="card-current-plan">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-amber-500" />
                  Current Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-3xl font-bold">{currentPlan.priceLabel}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <Badge className="mb-4">{currentPlan.name}</Badge>
                <ul className="space-y-2">
                  {currentPlan.features.slice(0, 4).map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full mt-6" 
                  onClick={() => setShowUpgradeModal(true)}
                  data-testid="btn-upgrade-plan"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade Plan
                </Button>
              </CardContent>
            </Card>

            <Card className="glass-card" data-testid="card-usage">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Usage This Month
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {billingLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : usage ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Prompts</span>
                        <span className="font-mono">{usage.promptsUsed || 0} / {usage.promptsLimit === -1 ? '∞' : usage.promptsLimit || 0}</span>
                      </div>
                      <Progress value={usage.promptsLimit === -1 ? 0 : ((usage.promptsUsed || 0) / (usage.promptsLimit || 1)) * 100} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Competitors</span>
                        <span className="font-mono">{usage.competitorsUsed || 0} / {usage.competitorsLimit === -1 ? '∞' : usage.competitorsLimit || 0}</span>
                      </div>
                      <Progress value={usage.competitorsLimit === -1 ? 0 : ((usage.competitorsUsed || 0) / (usage.competitorsLimit || 1)) * 100} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Team Members</span>
                        <span className="font-mono">{usage.teamMembersUsed || 0} / {usage.teamMembersLimit === -1 ? '∞' : usage.teamMembersLimit || 0}</span>
                      </div>
                      <Progress value={usage.teamMembersLimit === -1 ? 0 : ((usage.teamMembersUsed || 0) / (usage.teamMembersLimit || 1)) * 100} className="h-2" />
                    </div>
                    {usage.promptsUsed && usage.promptsLimit !== -1 && (usage.promptsUsed / usage.promptsLimit) > 0.7 && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>You're at {Math.round((usage.promptsUsed / usage.promptsLimit) * 100)}% of your prompt limit. Consider upgrading for more capacity.</span>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No usage data available</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="glass-card" data-testid="card-invoices">
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
            </CardHeader>
            <CardContent>
              {billingLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : invoices && invoices.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map(inv => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-mono">{inv.razorpayInvoiceId || inv.id}</TableCell>
                        <TableCell>{new Date(inv.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</TableCell>
                        <TableCell className="font-medium">₹{(inv.amount / 100).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              inv.status === "paid" && "text-green-600 border-green-300 bg-green-50",
                              inv.status === "pending" && "text-amber-600 border-amber-300 bg-amber-50",
                              inv.status === "failed" && "text-red-600 border-red-300 bg-red-50"
                            )}
                          >
                            {inv.status === "paid" && <Check className="h-3 w-3 mr-1" />}
                            {inv.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                            {inv.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`/api/invoices/${inv.id}/pdf`, '_blank')}
                            disabled={inv.status !== "paid"}
                          >
                            Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No invoices yet</p>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card" data-testid="card-payment-method">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-800 rounded flex items-center justify-center text-white text-xs font-bold">
                    VISA
                  </div>
                  <div>
                    <div className="font-medium">•••• •••• •••• 4242</div>
                    <div className="text-xs text-muted-foreground">Expires 12/27</div>
                  </div>
                </div>
                <Button variant="outline" size="sm">Update</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6 max-w-2xl">
          <Card className="glass-card" data-testid="card-analysis-schedule">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Analysis Schedule
              </CardTitle>
              <CardDescription>
                Configure when Geoscore runs automated visibility analysis. Frequency options depend on your plan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Scheduled Analysis</Label>
                    <p className="text-sm text-muted-foreground">Automatically run visibility checks on a schedule</p>
                  </div>
                  <Switch defaultChecked data-testid="switch-enable-schedule" />
                </div>

                <div className="grid gap-2">
                  <Label>Frequency</Label>
                  <Select defaultValue="daily">
                    <SelectTrigger data-testid="select-frequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly" disabled={brand?.tier === "free" || brand?.tier === "starter"}>
                        Hourly {brand?.tier !== "enterprise" && brand?.tier !== "growth" && "(Growth+)"}
                      </SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Preferred Time</Label>
                  <Select defaultValue="06:00">
                    <SelectTrigger data-testid="select-time">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="00:00">12:00 AM</SelectItem>
                      <SelectItem value="06:00">6:00 AM</SelectItem>
                      <SelectItem value="12:00">12:00 PM</SelectItem>
                      <SelectItem value="18:00">6:00 PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Timezone</Label>
                  <Select defaultValue="utc">
                    <SelectTrigger data-testid="select-timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="utc">UTC</SelectItem>
                      <SelectItem value="est">Eastern Time (EST)</SelectItem>
                      <SelectItem value="pst">Pacific Time (PST)</SelectItem>
                      <SelectItem value="cet">Central European (CET)</SelectItem>
                      <SelectItem value="ist">India Standard Time (IST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card" data-testid="card-models-config">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Models Configuration
              </CardTitle>
              <CardDescription>
                Select which AI models to include in scheduled analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {["ChatGPT (GPT-4)", "Claude 3", "Gemini Pro", "Perplexity"].map((model, i) => (
                <div key={model} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{model}</span>
                    {i === 3 && brand?.tier === "free" && (
                      <Badge variant="secondary" className="text-[10px]">Upgrade Required</Badge>
                    )}
                  </div>
                  <Switch defaultChecked={i < 3} disabled={i === 3 && brand?.tier === "free"} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="glass-card" data-testid="card-last-run">
            <CardHeader>
              <CardTitle>Last Analysis Run</CardTitle>
              <CardDescription>View recent analysis status and trigger manual runs</CardDescription>
            </CardHeader>
            <CardContent>
              {jobsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : latestJob ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">
                        {new Date(latestJob.createdAt).toLocaleString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {latestJob.type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </div>
                      {latestJob.completedAt && latestJob.createdAt && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Completed in {Math.round((new Date(latestJob.completedAt).getTime() - new Date(latestJob.createdAt).getTime()) / 1000)} seconds
                        </div>
                      )}
                    </div>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        latestJob.status === 'completed' && "text-green-600 border-green-300 bg-green-50",
                        latestJob.status === 'failed' && "text-red-600 border-red-300 bg-red-50",
                        latestJob.status === 'running' && "text-blue-600 border-blue-300 bg-blue-50",
                        latestJob.status === 'pending' && "text-yellow-600 border-yellow-300 bg-yellow-50"
                      )}
                    >
                      {latestJob.status === 'completed' && <Check className="h-3 w-3 mr-1" />}
                      {latestJob.status === 'running' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                      {latestJob.status === 'failed' && <AlertCircle className="h-3 w-3 mr-1" />}
                      {latestJob.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                      {latestJob.status.charAt(0).toUpperCase() + latestJob.status.slice(1)}
                    </Badge>
                  </div>
                  
                  {latestJob.status === 'running' && latestJob.progress !== undefined && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-mono">{latestJob.progress}%</span>
                      </div>
                      <Progress value={latestJob.progress} className="h-2" />
                    </div>
                  )}
                  
                  {latestJob.error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                      <div className="font-medium mb-1">Error</div>
                      <div>{latestJob.error}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No analysis runs yet</p>
                  <p className="text-sm mt-1">Click "Run Analysis Now" to start</p>
                </div>
              )}
              
              <Button 
                className="w-full mt-4" 
                variant="outline" 
                onClick={() => triggerEnrichment()}
                disabled={isTriggering || latestJob?.status === 'running'}
                data-testid="btn-run-now"
              >
                {isTriggering || latestJob?.status === 'running' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run Analysis Now
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
          
          <div className="flex gap-4">
            <Button data-testid="btn-save-schedule">Save Schedule</Button>
            <Button variant="outline" data-testid="btn-cancel-schedule">Cancel</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
