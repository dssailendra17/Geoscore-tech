import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TopBar } from "@/components/layout/TopBar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Sparkles,
  ChevronDown,
  LayoutGrid,
  Kanban,
  LineChart,
  Zap,
  Target,
  Clock,
  TrendingUp,
  Users,
  Lightbulb,
  CheckCircle,
  Circle,
  ArrowRight,
  Plus,
  Loader2,
  AlertCircle
} from "lucide-react";
import { useCurrentBrand } from "@/hooks/use-brand";
import { cn } from "@/lib/utils";
import { useBrandContext } from "@/hooks/use-brand-context";
import { PageSkeleton } from "@/components/ui/SkeletonLoaders";

const focusAreas = [
  { id: "all", label: "All Categories", description: "Generate balanced mix of action items" },
  { id: "content", label: "Content Strategy", description: "Create/optimize content to beat competitors on specific sources and prompts" },
  { id: "competitive", label: "Competitive Response", description: "Directly counter competitor advantages and close ranking gaps" },
  { id: "technical", label: "Technical Optimization", description: "Website, SEO, and AI model technical improvements" },
];

const quickWins = [
  { title: "Add schema markup to product pages", impact: "+12 visibility", status: "pending" },
  { title: "Update FAQ section with common queries", impact: "+8 visibility", status: "pending" },
];

const bigBets = [
  { title: "Create comprehensive comparison guide", impact: "+45 visibility", status: "in_progress" },
  { title: "Build interactive pricing calculator", impact: "+32 visibility", status: "pending" },
];

const fillIns = [
  { title: "Fix broken links on documentation", impact: "+5 visibility", status: "completed" },
  { title: "Add alt text to images", impact: "+3 visibility", status: "pending" },
];

const longTerm = [
  { title: "Establish thought leadership blog", impact: "+80 visibility", status: "pending" },
  { title: "Build partner ecosystem content", impact: "+65 visibility", status: "pending" },
];

const phases = [
  {
    name: "Foundation",
    status: "active",
    weeks: "Weeks 1-4",
    items: [],
    expectedImpact: "Ready for quick wins",
    color: "bg-green-50 border-green-200",
    badgeColor: "bg-green-500",
  },
  {
    name: "Expansion",
    status: "upcoming",
    weeks: "Weeks 5-8",
    items: [
      "Create content for methodology/schools",
      "Target siyc.edu for innovative learning",
    ],
    expectedImpact: "10-20% growth potential",
    color: "bg-amber-50 border-amber-200",
    badgeColor: "bg-amber-500",
  },
  {
    name: "Domination",
    status: "future",
    weeks: "Weeks 9-12",
    items: [],
    expectedImpact: "Long-term transformation ready",
    color: "bg-blue-50 border-blue-200",
    badgeColor: "bg-blue-500",
  },
];

const teams = [
  { name: "Content Team", items: 1, capacity: 6, hours: 2, color: "bg-green-500" },
  { name: "Technical Team", items: 0, capacity: 0, hours: 0, color: "bg-blue-500" },
  { name: "Marketing Team", items: 1, capacity: 7, hours: 3, color: "bg-purple-500" },
];

export default function GapAnalysis() {
  const { brand, brandId } = useCurrentBrand();
  const [selectedFocus, setSelectedFocus] = useState(focusAreas[0]);
  const [view, setView] = useState("strategy");

  // Fetch real brand context with gap analysis
  const { data: context, isLoading, error } = useBrandContext(brandId || "");

  // Transform gap analysis data from API
  const gapData = useMemo(() => {
    if (!context?.gapAnalysis) {
      return {
        quickWins: quickWins,
        bigBets: bigBets,
        fillIns: fillIns,
        longTerm: longTerm,
        completed: 0,
        total: 0,
      };
    }

    const gaps = context.gapAnalysis;
    
    // Categorize gaps by impact and effort
    const categorized = {
      quickWins: gaps.filter((g: any) => g.impact === 'high' && g.effort === 'low').map((g: any) => ({
        title: g.title || g.description,
        impact: `+${g.impactScore || 10} visibility`,
        status: g.status || 'pending',
      })),
      bigBets: gaps.filter((g: any) => g.impact === 'high' && g.effort === 'high').map((g: any) => ({
        title: g.title || g.description,
        impact: `+${g.impactScore || 40} visibility`,
        status: g.status || 'pending',
      })),
      fillIns: gaps.filter((g: any) => g.impact === 'low' && g.effort === 'low').map((g: any) => ({
        title: g.title || g.description,
        impact: `+${g.impactScore || 5} visibility`,
        status: g.status || 'pending',
      })),
      longTerm: gaps.filter((g: any) => g.impact === 'low' && g.effort === 'high').map((g: any) => ({
        title: g.title || g.description,
        impact: `+${g.impactScore || 60} visibility`,
        status: g.status || 'pending',
      })),
      completed: gaps.filter((g: any) => g.status === 'completed').length,
      total: gaps.length,
    };

    return categorized;
  }, [context]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <TopBar
          title="Gap Analysis & Action Plan"
          description="AI-powered recommendations to improve your brand visibility"
        />
        <PageSkeleton />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <AlertCircle className="h-8 w-8 mx-auto text-destructive" />
          <p className="text-muted-foreground">Failed to load gap analysis. Please try again.</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const progressPercentage = gapData.total > 0 ? (gapData.completed / gapData.total) * 100 : 0;

  const renderQuadrant = (title: string, subtitle: string, items: typeof quickWins, color: string, icon: React.ReactNode) => (
    <Card className={cn("glass-card", color)} data-testid={`quadrant-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription className="text-xs">{subtitle}</CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">{items.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            <Circle className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p>No items in this quadrant</p>
            <p className="text-xs">Items will appear here based on priority and effort</p>
          </div>
        ) : (
          items.map((item, i) => (
            <div key={i} className="p-3 bg-background/60 rounded-lg border text-sm">
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium">{item.title}</span>
                {item.status === "completed" && <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />}
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-green-600 font-medium">{item.impact}</span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            Gap Analysis - {brand?.name || ""}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">AI visibility improvement plan based on competitor analysis</p>
        </div>
        <Button className="gap-2" data-testid="btn-generate-more">
          <Plus className="h-4 w-4" />
          Generate More
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <Card className="glass-card lg:w-64 flex-shrink-0" data-testid="card-overall-progress">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Overall Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono mb-2">{gapData.completed}<span className="text-lg text-muted-foreground"> completed</span></div>
            <Progress value={progressPercentage} className="h-2 mb-4" />
            <div className="flex gap-2">
              <Tabs value={view} onValueChange={setView} className="w-full">
                <TabsList className="grid grid-cols-3 w-full h-8">
                  <TabsTrigger value="table" className="text-xs px-2 gap-1">
                    <LayoutGrid className="h-3 w-3" />
                  </TabsTrigger>
                  <TabsTrigger value="kanban" className="text-xs px-2 gap-1">
                    <Kanban className="h-3 w-3" />
                  </TabsTrigger>
                  <TabsTrigger value="strategy" className="text-xs px-2 gap-1">
                    <LineChart className="h-3 w-3" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card flex-1" data-testid="card-focus-area">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Choose Focus Area</CardTitle>
            <CardDescription className="text-xs">Generate action items for specific categories</CardDescription>
          </CardHeader>
          <CardContent>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between" data-testid="dropdown-focus-area">
                  <span>{selectedFocus.label}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80">
                {focusAreas.map(area => (
                  <DropdownMenuItem key={area.id} onClick={() => setSelectedFocus(area)} className="flex flex-col items-start py-3">
                    <span className="font-medium">{area.label}</span>
                    <span className="text-xs text-muted-foreground">{area.description}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-display font-bold">Impact Opportunity Matrix</h2>
        </div>
        <p className="text-muted-foreground text-sm mb-4">Strategic prioritization framework for maximum ROI</p>
        
        <div className="grid md:grid-cols-2 gap-4">
          {renderQuadrant(
            "Quick Wins", 
            "High Impact • Low Effort", 
            gapData.quickWins, 
            "border-green-200 bg-green-50/50", 
            <Zap className="h-5 w-5 text-green-600" />
          )}
          {renderQuadrant(
            "Big Bets", 
            "High Impact • High Effort", 
            gapData.bigBets, 
            "border-amber-200 bg-amber-50/50", 
            <Target className="h-5 w-5 text-amber-600" />
          )}
          {renderQuadrant(
            "Fill-Ins", 
            "Low Impact • Low Effort", 
            gapData.fillIns, 
            "border-blue-200 bg-blue-50/50", 
            <CheckCircle className="h-5 w-5 text-blue-600" />
          )}
          {renderQuadrant(
            "Long-Term", 
            "Low Impact • High Effort", 
            gapData.longTerm, 
            "border-purple-200 bg-purple-50/50", 
            <Clock className="h-5 w-5 text-purple-600" />
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          <h2 className="text-xl font-display font-bold">Recommended Improvement Path</h2>
        </div>
        <p className="text-muted-foreground text-sm mb-4">Phased approach to maximize strategic impact</p>
        
        <div className="grid md:grid-cols-3 gap-4">
          {phases.map((phase, i) => (
            <Card key={phase.name} className={cn("glass-card relative", phase.color)} data-testid={`phase-${phase.name.toLowerCase()}`}>
              <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-background border-2 flex items-center justify-center font-bold text-sm">
                {i + 1}
              </div>
              <CardHeader className="pt-6 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{phase.name}</CardTitle>
                  <Badge className={cn("text-white text-[10px]", phase.badgeColor)}>{phase.status}</Badge>
                </div>
                <CardDescription className="text-xs">{phase.weeks}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {phase.items.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    <Circle className="h-6 w-6 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">No items in this phase</p>
                    <p className="text-xs">Items will be assigned automatically</p>
                  </div>
                ) : (
                  phase.items.map((item, j) => (
                    <div key={j} className="flex items-start gap-2 text-sm">
                      <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))
                )}
                <div className="pt-3 border-t mt-3">
                  <div className="flex items-center gap-2 text-xs">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span className="text-muted-foreground">Expected Impact</span>
                  </div>
                  <p className="text-sm font-medium text-green-600 mt-1">{phase.expectedImpact}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-display font-bold">Team Capacity Planning</h2>
        </div>
        <p className="text-muted-foreground text-sm mb-4">Resource allocation and workload management</p>
        
        <div className="grid md:grid-cols-3 gap-4">
          {teams.map(team => (
            <Card key={team.name} className="glass-card" data-testid={`team-${team.name.toLowerCase().replace(/\s+/g, '-')}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", team.color)} />
                    {team.name}
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">{team.items} action items assigned</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Team Capacity</span>
                  <span className="font-mono font-bold text-lg">{team.capacity}%</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                  <Clock className="h-3 w-3" />
                  <span>{team.hours} hrs/week</span>
                  <span className="mx-1">•</span>
                  <span>{team.items} items</span>
                </div>
                <Progress value={team.capacity} className="h-2 mb-3" />
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span className="text-green-600">Optimal Load</span>
                  <span className="text-muted-foreground">• Team capacity available</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
