import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, HelpCircle, Code2, Terminal, Plus, Search, Download, 
  Eye, Pencil, Trash2, Copy, ExternalLink, Check, X, AlertTriangle,
  CheckCircle, XCircle, RefreshCw, Globe, Link2, Calendar, Clock,
  ChevronRight, Sparkles, Zap, ArrowUpRight
} from "lucide-react";
import { useCurrentBrand } from "@/hooks/use-brand";
import { useAxpPages, useFaqEntries, useSchemaTemplates } from "@/hooks/use-content";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const mockAXPPages = [
  { 
    id: "1", 
    title: "About Acme Corp", 
    slug: "/axp/about", 
    status: "published", 
    version: "v2", 
    lastUpdated: "Jan 15, 2026",
    views: 1234,
    botHits: 89
  },
  { 
    id: "2", 
    title: "Acme vs Competitors", 
    slug: "/axp/comparison", 
    status: "published", 
    version: "v1", 
    lastUpdated: "Jan 10, 2026",
    views: 567,
    botHits: 45
  },
  { 
    id: "3", 
    title: "Enterprise Features", 
    slug: "/axp/enterprise", 
    status: "draft", 
    version: "v1", 
    lastUpdated: "Jan 17, 2026",
    views: 0,
    botHits: 0
  },
];

const mockFAQs = [
  {
    id: "1",
    page: "Homepage",
    question: "What is Acme Corp?",
    answer: "Acme Corp is a leading provider of AI-powered business solutions...",
    evidence: ["https://acme.com/about", "https://wikipedia.org/acme"],
    lastUpdated: "Jan 14, 2026",
    publishMode: "axp",
    status: "active"
  },
  {
    id: "2",
    page: "Pricing",
    question: "How much does Acme cost?",
    answer: "Acme offers flexible pricing starting from $0 for the free tier...",
    evidence: ["https://acme.com/pricing"],
    lastUpdated: "Jan 12, 2026",
    publishMode: "website",
    status: "active"
  },
  {
    id: "3",
    page: "Features",
    question: "What features does Acme offer?",
    answer: "Acme provides AI visibility tracking, competitor analysis...",
    evidence: [],
    lastUpdated: "Jan 10, 2026",
    publishMode: "hidden",
    status: "draft"
  },
];

const mockSchemaData = {
  org: {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Acme Corp",
    "url": "https://acme.com",
    "logo": "https://acme.com/logo.png",
    "description": "Leading provider of AI-powered business solutions",
    "sameAs": [
      "https://twitter.com/acmecorp",
      "https://linkedin.com/company/acmecorp"
    ]
  }
};

export default function ContentAXP() {
  const { brand, brandId, isLoading: brandLoading } = useCurrentBrand();
  const [activeTab, setActiveTab] = useState("axp");
  const [showNewAXP, setShowNewAXP] = useState(false);
  const [showNewFAQ, setShowNewFAQ] = useState(false);
  const [showSchemaEditor, setShowSchemaEditor] = useState(false);
  const [selectedSchema, setSelectedSchema] = useState<string | null>(null);
  const [showScriptModal, setShowScriptModal] = useState(false);

  // Fetch real data from API
  const { data: axpPages = [], isLoading: axpLoading } = useAxpPages(brandId || "");
  const { data: faqs = [], isLoading: faqsLoading } = useFaqEntries(brandId || "");
  const { data: schemas = [], isLoading: schemasLoading } = useSchemaTemplates(brandId || "");

  // Use real data or fallback to mock for schema templates (if schemas API doesn't exist yet)
  const mockSchemaTemplates = [
    { id: "org", name: "Organization", icon: "🏢", coverage: 85, status: "active" },
    { id: "product", name: "Product", icon: "📦", coverage: 70, status: "active" },
    { id: "faq", name: "FAQPage", icon: "❓", coverage: 100, status: "active" },
    { id: "article", name: "Article", icon: "📄", coverage: 60, status: "partial" },
    { id: "local", name: "LocalBusiness", icon: "📍", coverage: 0, status: "inactive" },
    { id: "breadcrumb", name: "BreadcrumbList", icon: "🔗", coverage: 90, status: "active" },
  ];
  const schemaTemplates = schemas.length > 0 ? schemas : mockSchemaTemplates;
  const schemaCoverage = schemaTemplates.length > 0
    ? Math.round(schemaTemplates.reduce((acc: any, s: any) => acc + (s.coverage || 0), 0) / schemaTemplates.length)
    : 0;

  // Show loading state
  if (brandLoading || axpLoading || faqsLoading || schemasLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Loading content...</span>
      </div>
    );
  }

  // Show error if no brand
  if (!brand || !brandId) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <AlertCircle className="h-6 w-6 mr-2" />
        No brand found. Please complete onboarding first.
      </div>
    );
  }

  const NewAXPModal = () => (
    <Dialog open={showNewAXP} onOpenChange={setShowNewAXP}>
      <DialogContent className="max-w-2xl" data-testid="modal-new-axp">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Create New AXP Page
          </DialogTitle>
          <DialogDescription>
            Generate a bot-friendly static HTML page with canonical linking and proper headers.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label>Page Title</Label>
            <Input placeholder={`e.g., About ${brand?.name || "Your Brand"}`} data-testid="input-axp-title" />
          </div>
          <div className="grid gap-2">
            <Label>URL Slug</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">/axp/</span>
              <Input placeholder="about" className="flex-1" data-testid="input-axp-slug" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Content Type</Label>
            <Select defaultValue="about">
              <SelectTrigger data-testid="select-axp-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="about">About / Company Info</SelectItem>
                <SelectItem value="comparison">Comparison Page</SelectItem>
                <SelectItem value="features">Feature Overview</SelectItem>
                <SelectItem value="use-case">Use Case / Industry</SelectItem>
                <SelectItem value="custom">Custom Page</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Key Topics / Keywords</Label>
            <Textarea placeholder="Enter main topics this page should cover..." rows={3} data-testid="input-axp-topics" />
          </div>
          <div className="p-3 bg-muted rounded-lg space-y-2">
            <Label className="text-sm font-medium">Bot-Friendly Options</Label>
            <div className="flex items-center justify-between">
              <span className="text-sm">Include canonical link</span>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Add structured data (JSON-LD)</span>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Enable X-Robots-Tag headers</span>
              <Switch defaultChecked />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowNewAXP(false)}>Cancel</Button>
          <Button className="gap-2" data-testid="btn-generate-axp">
            <Sparkles className="h-4 w-4" />
            Generate AXP Page
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const NewFAQModal = () => (
    <Dialog open={showNewFAQ} onOpenChange={setShowNewFAQ}>
      <DialogContent className="max-w-2xl" data-testid="modal-new-faq">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Add FAQ Entry
          </DialogTitle>
          <DialogDescription>
            Create a new FAQ entry with evidence links for AI model verification.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label>Target Page</Label>
            <Select defaultValue="homepage">
              <SelectTrigger data-testid="select-faq-page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="homepage">Homepage</SelectItem>
                <SelectItem value="pricing">Pricing</SelectItem>
                <SelectItem value="features">Features</SelectItem>
                <SelectItem value="about">About Us</SelectItem>
                <SelectItem value="all">All Pages (Global)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Question</Label>
            <Input placeholder="What is your question?" data-testid="input-faq-question" />
          </div>
          <div className="grid gap-2">
            <Label>Answer</Label>
            <Textarea placeholder="Provide a detailed answer..." rows={4} data-testid="input-faq-answer" />
          </div>
          <div className="grid gap-2">
            <Label>Evidence Links</Label>
            <p className="text-xs text-muted-foreground">Add URLs that support this answer for AI verification</p>
            <Input placeholder="https://example.com/source" data-testid="input-faq-evidence" />
            <Button variant="outline" size="sm" className="w-fit gap-1">
              <Plus className="h-3 w-3" /> Add Another Link
            </Button>
          </div>
          <div className="grid gap-2">
            <Label>Publishing Mode</Label>
            <Select defaultValue="axp">
              <SelectTrigger data-testid="select-faq-mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hidden">Hidden (Brand Only)</SelectItem>
                <SelectItem value="axp">Include in AXP Surface</SelectItem>
                <SelectItem value="website">Push to Main Website</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowNewFAQ(false)}>Cancel</Button>
          <Button data-testid="btn-save-faq">Save FAQ Entry</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const SchemaEditorModal = () => (
    <Dialog open={showSchemaEditor} onOpenChange={setShowSchemaEditor}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto" data-testid="modal-schema-editor">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5" />
            Edit {selectedSchema ? schemaTemplates.find(s => s.id === selectedSchema)?.name : ''} Schema
          </DialogTitle>
          <DialogDescription>
            Customize the JSON-LD structured data for your brand.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="p-4 bg-muted rounded-lg font-mono text-sm overflow-x-auto">
            <pre>{JSON.stringify(mockSchemaData.org, null, 2)}</pre>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 text-green-600 border-green-300">
              <CheckCircle className="h-3 w-3" /> Valid JSON-LD
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Globe className="h-3 w-3" /> Schema.org Compatible
            </Badge>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>Missing recommended field: "foundingDate". Add it to improve schema coverage.</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowSchemaEditor(false)}>Cancel</Button>
          <Button variant="outline" className="gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          <Button data-testid="btn-save-schema">Save Schema</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const ScriptProviderModal = () => (
    <Dialog open={showScriptModal} onOpenChange={setShowScriptModal}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto" data-testid="modal-script-provider">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Script Provider - {brand?.name || "Brand"}
          </DialogTitle>
          <DialogDescription>
            Generate JSON + JS snippets for your brand's AXP, Schema, and FAQ embedding.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Script Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable AXP Link Injection</Label>
                  <p className="text-xs text-muted-foreground">Add links to AXP pages in your site header</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Schema Injection</Label>
                  <p className="text-xs text-muted-foreground">Auto-inject JSON-LD schemas on page load</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable FAQ Embedding</Label>
                  <p className="text-xs text-muted-foreground">Embed FAQ accordion on designated pages</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Code2 className="h-4 w-4" />
                Installation Script
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-slate-900 text-slate-100 rounded-lg font-mono text-sm overflow-x-auto">
                <pre>{`<!-- Geoscore AXP Script -->
<script>
  (function(g,e,o,s,c,r){
    g.GeoScoreConfig={brandId:'${brandId || ""}',
      axpEnabled:true,schemaEnabled:true,faqEnabled:false};
    var js=e.createElement(o);js.async=1;js.src=s;
    e.head.appendChild(js);
  })(window,document,'script','https://cdn.geoscore.ai/embed.js');
</script>`}</pre>
              </div>
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" className="gap-2">
                  <Copy className="h-4 w-4" />
                  Copy Script
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4" />
                JSON Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-slate-900 text-slate-100 rounded-lg font-mono text-sm overflow-x-auto">
                <pre>{JSON.stringify({
                  brandId: brandId || "",
                  brandName: brand?.name || "Brand",
                  axpBaseUrl: "/axp",
                  schemas: ["Organization", "Product", "FAQPage"],
                  faqPages: ["homepage", "pricing"],
                  version: "1.0.0"
                }, null, 2)}</pre>
              </div>
            </CardContent>
          </Card>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowScriptModal(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <NewAXPModal />
      <NewFAQModal />
      <SchemaEditorModal />
      <ScriptProviderModal />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            Content & AXP
          </h1>
          <p className="text-muted-foreground mt-1">
            View AXP pages, FAQs, and schema content created by your admin. Get embed scripts for your website.
          </p>
        </div>
        <Button variant="outline" onClick={() => setShowScriptModal(true)} className="gap-2" data-testid="btn-get-script">
          <Terminal className="h-4 w-4" />
          Get Script
        </Button>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="glass-card" data-testid="stat-axp-pages">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono">{axpPages.length}</p>
                <p className="text-sm text-muted-foreground">AXP Pages</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card" data-testid="stat-faqs">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-amber-500/10">
                <HelpCircle className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono">{faqs.length}</p>
                <p className="text-sm text-muted-foreground">FAQ Entries</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card" data-testid="stat-schema-coverage">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-500/10">
                <Code2 className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono">{schemaCoverage}%</p>
                <p className="text-sm text-muted-foreground">Schema Coverage</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card" data-testid="stat-bot-hits">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Zap className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono">{axpPages.reduce((acc: any, p: any) => acc + (p.botHits || 0), 0)}</p>
                <p className="text-sm text-muted-foreground">Bot Hits (30d)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-xl grid-cols-4">
          <TabsTrigger value="axp" className="gap-2" data-testid="tab-axp">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">AXP Pages</span>
          </TabsTrigger>
          <TabsTrigger value="faq" className="gap-2" data-testid="tab-faq">
            <HelpCircle className="h-4 w-4" />
            <span className="hidden sm:inline">FAQ Builder</span>
          </TabsTrigger>
          <TabsTrigger value="schema" className="gap-2" data-testid="tab-schema">
            <Code2 className="h-4 w-4" />
            <span className="hidden sm:inline">Schema</span>
          </TabsTrigger>
          <TabsTrigger value="script" className="gap-2" data-testid="tab-script">
            <Terminal className="h-4 w-4" />
            <span className="hidden sm:inline">Script</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="axp" className="space-y-4 mt-6">
          <Card className="glass-card" data-testid="card-axp-pages">
            <CardHeader>
              <div>
                  <CardTitle>AXP Pages</CardTitle>
                  <CardDescription>View static HTML pages created by your admin for AI bot parsing.</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page Title</TableHead>
                    <TableHead>URL Slug</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Bot Hits</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {axpPages.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No AXP pages yet. Click "New AXP Page" to create one.</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    axpPages.map((page: any) => (
                    <TableRow key={page.id} data-testid={`row-axp-${page.id}`}>
                      <TableCell className="font-medium">{page.title}</TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">{page.slug}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{page.version}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={page.status === "published" ? "outline" : "secondary"} className={cn(
                          page.status === "published" && "text-green-600 border-green-300"
                        )}>
                          {page.status === "published" ? <CheckCircle className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                          {page.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono">{page.botHits}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{page.lastUpdated}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="glass-card" data-testid="card-axp-suggestions">
            <CardHeader>
              <CardTitle>Content Suggestions</CardTitle>
              <CardDescription>AI-generated AXP page ideas based on gap analysis and competitor coverage.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { title: `${brand?.name || "Your Brand"} vs Competitors Comparison`, reason: "Competitor dominance in comparison queries", impact: "+45 visibility" },
                  { title: "Enterprise Security Features", reason: "Missing content for security-related prompts", impact: "+32 visibility" },
                  { title: "Integration Guide for Developers", reason: "High-volume technical queries", impact: "+28 visibility" },
                ].map((suggestion, i) => (
                  <div key={i} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-semibold mb-1">{suggestion.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{suggestion.reason}</p>
                        <Badge variant="secondary" className="text-green-600">
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                          {suggestion.impact}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="gap-1">
                          <Sparkles className="h-3 w-3" />
                          Generate
                        </Button>
                        <Button size="sm" variant="ghost">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faq" className="space-y-4 mt-6">
          <Card className="glass-card" data-testid="card-faq-entries">
            <CardHeader>
              <div>
                  <CardTitle>FAQ Entries</CardTitle>
                  <CardDescription>View FAQ content created by your admin with evidence links and publishing controls.</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Question</TableHead>
                    <TableHead>Page</TableHead>
                    <TableHead>Evidence</TableHead>
                    <TableHead>Publish Mode</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {faqs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        <HelpCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No FAQs yet. Click "New FAQ" to create one.</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    faqs.map((faq: any) => (
                    <TableRow key={faq.id} data-testid={`row-faq-${faq.id}`}>
                      <TableCell className="font-medium max-w-xs truncate">{faq.question}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{faq.page}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Link2 className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{faq.evidence.length} links</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={faq.publishMode === "website" ? "default" : faq.publishMode === "axp" ? "secondary" : "outline"}>
                          {faq.publishMode === "website" ? "Website" : faq.publishMode === "axp" ? "AXP Only" : "Hidden"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={faq.status === "active" ? "outline" : "secondary"} className={cn(
                          faq.status === "active" && "text-green-600 border-green-300"
                        )}>
                          {faq.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{faq.lastUpdated}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-3 gap-4">
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  Hidden Layer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">FAQs visible only to your brand for internal reference.</p>
                <div className="text-2xl font-bold font-mono">{faqs.filter((f: any) => f.publishMode === "hidden").length}</div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  AXP Surface
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">FAQs included in AXP pages for bot consumption.</p>
                <div className="text-2xl font-bold font-mono">{faqs.filter((f: any) => f.publishMode === "axp").length}</div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4 text-green-500" />
                  Main Website
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">FAQs pushed to your main website via script.</p>
                <div className="text-2xl font-bold font-mono">{faqs.filter((f: any) => f.publishMode === "website").length}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="schema" className="space-y-4 mt-6">
          <Card className="glass-card" data-testid="card-schema-templates">
            <CardHeader>
              <CardTitle>Schema / JSON-LD Manager</CardTitle>
              <CardDescription>Configure structured data templates with brand-specific overrides and validation.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {schemaTemplates.map(schema => (
                  <Card 
                    key={schema.id} 
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md",
                      schema.status === "active" && "border-green-200 bg-green-50/30",
                      schema.status === "partial" && "border-amber-200 bg-amber-50/30",
                      schema.status === "inactive" && "border-gray-200 opacity-60"
                    )}
                    onClick={() => {
                      setSelectedSchema(schema.id);
                      setShowSchemaEditor(true);
                    }}
                    data-testid={`schema-${schema.id}`}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{schema.icon}</span>
                          <div>
                            <h4 className="font-semibold">{schema.name}</h4>
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-xs mt-1",
                                schema.status === "active" && "text-green-600 border-green-300",
                                schema.status === "partial" && "text-amber-600 border-amber-300",
                                schema.status === "inactive" && "text-gray-500"
                              )}
                            >
                              {schema.status}
                            </Badge>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Coverage</span>
                          <span className="font-mono font-medium">{schema.coverage}%</span>
                        </div>
                        <Progress value={schema.coverage} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card" data-testid="card-schema-metrics">
            <CardHeader>
              <CardTitle>Schema Coverage Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-4xl font-bold font-mono text-green-600">{schemaCoverage}%</div>
                  <p className="text-sm text-muted-foreground mt-1">Overall Coverage</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-4xl font-bold font-mono">{schemaTemplates.filter(s => s.status === "active").length}</div>
                  <p className="text-sm text-muted-foreground mt-1">Active Schemas</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-4xl font-bold font-mono text-amber-600">{schemaTemplates.filter(s => s.status === "partial").length}</div>
                  <p className="text-sm text-muted-foreground mt-1">Need Attention</p>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button variant="outline" className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Re-validate All
                </Button>
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export All Schemas
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="script" className="space-y-4 mt-6">
          <Card className="glass-card" data-testid="card-script-config">
            <CardHeader>
              <CardTitle>Script Provider Configuration</CardTitle>
              <CardDescription>Generate and customize embed scripts for your website.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Script Controls</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <Label>AXP Link Injection</Label>
                        <p className="text-xs text-muted-foreground">Add navigation links to AXP pages</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <Label>Schema Injection</Label>
                        <p className="text-xs text-muted-foreground">Auto-inject JSON-LD on page load</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <Label>FAQ Widget</Label>
                        <p className="text-xs text-muted-foreground">Embed FAQ accordion component</p>
                      </div>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <Label>Analytics Tracking</Label>
                        <p className="text-xs text-muted-foreground">Track bot visits and interactions</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium">Brand Configuration</h4>
                  <div className="space-y-3">
                    <div className="grid gap-2">
                      <Label>Brand ID</Label>
                      <Input value={brandId || ""} disabled className="font-mono" />
                    </div>
                    <div className="grid gap-2">
                      <Label>AXP Base URL</Label>
                      <Input defaultValue="/axp" />
                    </div>
                    <div className="grid gap-2">
                      <Label>Script Version</Label>
                      <Select defaultValue="latest">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="latest">Latest (1.2.0)</SelectItem>
                          <SelectItem value="1.1.0">1.1.0</SelectItem>
                          <SelectItem value="1.0.0">1.0.0</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card" data-testid="card-embed-script">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="h-5 w-5" />
                Embed Script
              </CardTitle>
              <CardDescription>Copy this script and paste it before the closing &lt;/head&gt; tag on your website.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-slate-900 text-slate-100 rounded-lg font-mono text-sm overflow-x-auto">
                <pre>{`<!-- Geoscore AXP & Schema Script -->
<script>
  (function(g,e,o,s,c,r){
    g.GeoScoreConfig={
      brandId:'${brandId || ""}',
      axpEnabled:true,
      schemaEnabled:true,
      faqEnabled:false,
      analyticsEnabled:true,
      axpBaseUrl:'/axp'
    };
    var js=e.createElement(o);
    js.async=1;
    js.src=s;
    e.head.appendChild(js);
  })(window,document,'script','https://cdn.geoscore.ai/embed.min.js');
</script>`}</pre>
              </div>
              <div className="flex gap-2 mt-4">
                <Button className="gap-2" data-testid="btn-copy-script">
                  <Copy className="h-4 w-4" />
                  Copy Script
                </Button>
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Download as File
                </Button>
                <Button variant="outline" className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Test Script
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card" data-testid="card-json-config">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                JSON Configuration Endpoint
              </CardTitle>
              <CardDescription>Your dynamic configuration is available at this URL for advanced integrations.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <code className="flex-1 font-mono text-sm">https://api.geoscore.ai/v1/config/{brandId || ""}</code>
                <Button variant="ghost" size="icon">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
