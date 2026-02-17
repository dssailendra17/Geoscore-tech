import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TopBar } from "@/components/layout/TopBar";
import { useCurrentBrand } from "@/hooks/use-brand";
import { TrendIndicator } from "@/components/ui/data-display";
import { ArrowRight, BarChart3, Globe, MessageSquare, Target, Trophy, Users, Eye, Zap, TrendingUp, AlertCircle, CheckCircle2, Loader2, Plus } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, Legend, AreaChart, Area, PieChart, Pie, LineChart, Line, CartesianGrid } from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLatestVisibilityScore, useVisibilityScores, useMentions, usePromptRuns } from "@/hooks/use-analytics";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import * as api from "@/lib/api";
import { getCompetitors, getSources } from "@/lib/api";
import { DashboardSkeleton, StatCardSkeleton } from "@/components/ui/SkeletonLoaders";

// Removed hardcoded topicPerformance - will fetch from API

export default function Dashboard() {
  const { data: brands, isLoading: brandsLoading } = useQuery<any[]>({
    queryKey: ['/api/brands'],
  });

  const currentBrand = brands?.[0];
  const brandId = currentBrand?.id;
  
  const { data: latestScore, isLoading: scoreLoading, error: scoreError } = useLatestVisibilityScore(brandId);
  const { data: visibilityHistory, isLoading: historyLoading } = useVisibilityScores(brandId, '30d', 30);
  const { data: mentions, isLoading: mentionsLoading } = useMentions(brandId, 100);
  const { data: promptRuns, isLoading: promptRunsLoading } = usePromptRuns(brandId, 100);
  const { data: competitors = [] } = useQuery<any[]>({
    queryKey: ['competitors', brandId],
    queryFn: () => getCompetitors(brandId),
    enabled: !!brandId,
  });
  const { data: sources = [] } = useQuery<any[]>({
    queryKey: ['sources', brandId],
    queryFn: () => getSources(brandId),
    enabled: !!brandId,
  });
  const { data: topics = [] } = useQuery<any[]>({
    queryKey: ['topics', brandId],
    queryFn: async () => {
      const res = await fetch(`/api/brands/${brandId}/topics`);
      if (!res.ok) throw new Error('Failed to fetch topics');
      return res.json();
    },
    enabled: !!brandId,
  });
  const { data: prompts = [] } = useQuery<any[]>({
    queryKey: ['prompts', brandId],
    queryFn: async () => {
      const res = await fetch(`/api/brands/${brandId}/prompts`);
      if (!res.ok) throw new Error('Failed to fetch prompts');
      return res.json();
    },
    enabled: !!brandId,
  });

  const visibilityScore = latestScore?.overallScore || 0;
  const previousScore = latestScore?.previousScore || 0;
  const scoreDelta = visibilityScore - previousScore;

  // Calculate KPIs from real data
  const totalPrompts = prompts?.length || 0;
  const totalMentions = mentions?.length || 0;
  const avgRank = useMemo(() => {
    if (!latestScore?.modelScores) return null;
    const ranks = Object.values(latestScore.modelScores).map((m: any) => m.rank || 10);
    return ranks.length > 0 ? (ranks.reduce((a, b) => a + b, 0) / ranks.length).toFixed(1) : null;
  }, [latestScore]);

  // Model performance from real data
  const modelPerformance = useMemo(() => {
    if (!latestScore?.modelScores) {
      return [
        { model: "ChatGPT", icon: "🤖", score: 0, trend: 0 },
        { model: "Claude", icon: "🎭", score: 0, trend: 0 },
        { model: "Gemini", icon: "✨", score: 0, trend: 0 },
        { model: "Perplexity", icon: "🔍", score: 0, trend: 0 },
      ];
    }
    return Object.entries(latestScore.modelScores).map(([key, value]: [string, any]) => ({
      model: key.charAt(0).toUpperCase() + key.slice(1),
      icon: key === 'chatgpt' ? '🤖' : key === 'claude' ? '🎭' : key === 'gemini' ? '✨' : '🔍',
      score: value.score || 0,
      trend: value.trend || 0,
    }));
  }, [latestScore]);

  // Visibility trend data from API
  const visibilityTrendData = useMemo(() => {
    if (!visibilityHistory || visibilityHistory.length === 0) {
      return [];
    }
    return visibilityHistory.map((item: any) => ({
      date: new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      score: item.overallScore,
      mentions: item.totalMentions || 0,
    }));
  }, [visibilityHistory]);

  // Calculate estimated traffic from mentions
  const estimatedTraffic = useMemo(() => {
    if (totalMentions === 0) return 0;
    // Simple estimation: mentions * average CTR (assume 10% CTR for AI citations)
    return Math.round(totalMentions * 0.1);
  }, [totalMentions]);

  // Calculate prompt coverage
  const promptCoverage = useMemo(() => {
    if (totalPrompts === 0 || !topics || topics.length === 0) return 0;
    // Coverage = (prompts with recent runs / total prompts) * 100
    const promptsWithRuns = promptRuns?.filter((run: any) => {
      const runDate = new Date(run.createdAt);
      const daysSince = (Date.now() - runDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 30; // Recent = within 30 days
    }).length || 0;
    return totalPrompts > 0 ? Math.round((promptsWithRuns / totalPrompts) * 100) : 0;
  }, [totalPrompts, promptRuns, topics]);

  // Calculate traffic by model from mentions
  const trafficByModel = useMemo(() => {
    if (!mentions || mentions.length === 0) {
      return { chatgpt: 0, perplexity: 0, gemini: 0, claude: 0, total: 0 };
    }
    const byModel = mentions.reduce((acc: any, mention: any) => {
      const model = mention.model?.toLowerCase() || 'unknown';
      acc[model] = (acc[model] || 0) + 1;
      return acc;
    }, {});

    // Estimate traffic (mentions * CTR)
    const ctr = 0.1; // 10% CTR assumption
    return {
      chatgpt: Math.round((byModel.chatgpt || 0) * ctr),
      perplexity: Math.round((byModel.perplexity || 0) * ctr),
      gemini: Math.round((byModel.gemini || 0) * ctr),
      claude: Math.round((byModel.claude || 0) * ctr),
      total: Math.round(totalMentions * ctr),
    };
  }, [mentions, totalMentions]);

  // Calculate gap analysis opportunities
  const gapOpportunities = useMemo(() => {
    // Count prompts where competitors have higher scores
    if (!competitors || competitors.length === 0) return 0;
    // This would need gap analysis data - for now return 0
    return 0;
  }, [competitors]);

  // Calculate source outreach opportunities
  const sourceOpportunities = useMemo(() => {
    if (!sources || sources.length === 0) return 0;
    // Count high-authority sources where brand is absent
    return sources.filter((s: any) => s.isBrandAbsent && (s.authority || 0) > 50).length;
  }, [sources]);

  const kpiTiles = [
    {
      label: "Avg Rank Position",
      value: avgRank || "—",
      delta: null,
      invert: true,
      icon: Trophy,
      href: "/app/competitors"
    },
    {
      label: "Total Prompts",
      value: totalPrompts,
      delta: null,
      icon: MessageSquare,
      href: "/app/prompts"
    },
    {
      label: "AI Mentions",
      value: totalMentions > 1000 ? `${(totalMentions / 1000).toFixed(1)}k` : totalMentions,
      delta: null,
      icon: BarChart3,
      href: "/app/sources?sort=citations"
    },
    {
      label: "Est. AI Traffic",
      value: estimatedTraffic > 1000 ? `${(estimatedTraffic / 1000).toFixed(1)}k` : estimatedTraffic,
      delta: null,
      icon: Users,
      href: "/app/prompts?sort=traffic"
    },
    {
      label: "Prompt Coverage",
      value: promptCoverage,
      suffix: "%",
      delta: null,
      icon: Target,
      href: "/app/gap-analysis"
    },
  ];

  if (brandsLoading || scoreLoading || historyLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <TopBar
          title="Dashboard"
          description="Track your brand's AI visibility across all platforms"
        />
        <DashboardSkeleton />
      </div>
    );
  }

  if (!currentBrand) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <TopBar title="Dashboard" />
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Eye className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Welcome to GeoScore</CardTitle>
              <CardDescription>
                Get started by setting up your brand to track AI visibility across search engines.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Link href="/onboarding">
                <Button data-testid="button-setup-brand">
                  <Plus className="h-4 w-4 mr-2" />
                  Set Up Your Brand
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (scoreLoading || historyLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Check if there's any analysis data - if not, show empty state with "Run Analysis" button
  // Only check for actual analysis results (mentions or prompt runs), not just existence of prompts
  const hasData = totalMentions > 0 || (promptRuns && promptRuns.length > 0);

  if (!hasData && !scoreLoading && !historyLoading && !mentionsLoading && !promptRunsLoading) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <TopBar title="Executive Dashboard" />
        <div className="flex items-center justify-center min-h-[500px]">
          <Card className="max-w-2xl w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">No Analysis Data Yet</CardTitle>
              <CardDescription className="text-base mt-2">
                Your brand is set up, but we haven't run any AI visibility analysis yet.
                Click the button below to start analyzing your brand's presence across AI models.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/30 p-4 rounded-lg space-y-2 text-sm">
                <p className="font-medium">What happens when you run analysis:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                  <li>Your prompts will be tested across ChatGPT, Claude, Gemini, and Perplexity</li>
                  <li>We'll track how often your brand is mentioned in AI responses</li>
                  <li>Calculate your visibility score and ranking position</li>
                  <li>Generate competitive insights and recommendations</li>
                </ul>
              </div>
              <div className="flex justify-center pt-4">
                <Button
                  size="lg"
                  className="gap-2"
                  onClick={async () => {
                    if (!brandId || !prompts || prompts.length === 0) {
                      alert('Please create some prompts first in the Prompts page');
                      return;
                    }

                    // Trigger LLM sampling for all prompts
                    const samplingPromises = prompts.map((prompt: any) =>
                      api.triggerLLMSampling(prompt.id, ['openai', 'anthropic', 'google'])
                        .catch((error: any) => {
                          console.error(`Failed to trigger sampling for prompt ${prompt.id}:`, error);
                          return null;
                        })
                    );

                    await Promise.all(samplingPromises);
                    alert(`Analysis started for ${prompts.length} prompts! Results will appear shortly. Refresh the page in a few minutes.`);
                    window.location.reload();
                  }}
                >
                  <Zap className="h-5 w-5" />
                  Run Analysis Now
                </Button>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                Analysis typically takes 2-5 minutes depending on the number of prompts
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <TopBar title="Executive Dashboard" />

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="glass-card lg:row-span-2" data-testid="card-visibility-score">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              AI Visibility Score
            </CardTitle>
            <CardDescription>Your brand's visibility across major AI models</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center py-4">
              <div className="relative w-40 h-40">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="hsl(var(--muted))"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${visibilityScore * 2.51} 251`}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="hsl(var(--primary))" />
                      <stop offset="100%" stopColor="hsl(142.1 76.2% 36.3%)" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold font-mono">{visibilityScore}</span>
                  <span className="text-xs text-muted-foreground">out of 100</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <TrendIndicator value={scoreDelta} />
                <span className="text-sm text-muted-foreground">vs last week</span>
              </div>
            </div>

            <div className="space-y-3 mt-4 border-t pt-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Performance by Model</p>
              {modelPerformance.map(m => (
                <div key={m.model} className="flex items-center gap-3">
                  <span className="text-lg">{m.icon}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span>{m.model}</span>
                      <span className="font-mono font-medium">{m.score}</span>
                    </div>
                    <Progress value={m.score} className="h-1.5" />
                  </div>
                  <TrendIndicator value={m.trend} className="text-xs" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {kpiTiles.map((tile, i) => (
              <Link key={i} href={tile.href}>
                <Card className="glass-card hover:bg-accent/50 transition-colors cursor-pointer p-4 flex flex-col justify-between h-full" data-testid={`kpi-${tile.label.toLowerCase().replace(/\s+/g, '-')}`}>
                  <div className="flex items-center justify-between mb-2">
                    <tile.icon className="h-4 w-4 text-muted-foreground" />
                    {tile.delta !== null && <TrendIndicator value={tile.delta} invert={tile.invert} />}
                  </div>
                  <div>
                    <div className="text-2xl font-bold font-mono tracking-tight">
                      {tile.value}<span className="text-sm font-sans font-normal text-muted-foreground">{tile.suffix}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{tile.label}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          <Card className="glass-card" data-testid="card-visibility-trend">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Visibility Trend</CardTitle>
                  <CardDescription>Score progression over time</CardDescription>
                </div>
                <Tabs defaultValue="7d" className="w-auto">
                  <TabsList className="h-8">
                    <TabsTrigger value="7d" className="text-xs h-6 px-2">7D</TabsTrigger>
                    <TabsTrigger value="30d" className="text-xs h-6 px-2">30D</TabsTrigger>
                    <TabsTrigger value="90d" className="text-xs h-6 px-2">90D</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={visibilityTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={11} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis domain={[50, 100]} tickLine={false} axisLine={false} fontSize={11} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: "8px", 
                        border: "1px solid hsl(var(--border))", 
                        backgroundColor: "hsl(var(--card))",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                      }} 
                    />
                    <Area type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid md:grid-cols-7 gap-6">
        <Card className="glass-card md:col-span-4" data-testid="card-competitive-visibility">
          <CardHeader>
            <CardTitle>Competitive Visibility</CardTitle>
            <CardDescription>How you stack up against tracked competitors.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brand</TableHead>
                  <TableHead className="text-right">Vis Score</TableHead>
                  <TableHead className="text-right">Share</TableHead>
                  <TableHead className="text-right">Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="bg-primary/5 hover:bg-primary/10">
                  <TableCell className="font-medium flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={currentBrand?.logo} />
                      <AvatarFallback>YOU</AvatarFallback>
                    </Avatar>
                    {currentBrand?.name || "Your Brand"} (You)
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold">{visibilityScore}</TableCell>
                  <TableCell className="text-right">{totalMentions > 0 ? `${Math.round((totalMentions / (totalMentions + (competitors.reduce((sum: number, c: any) => sum + (c.mentions || 0), 0)))) * 100)}%` : '—'}</TableCell>
                  <TableCell className="text-right"><TrendIndicator value={scoreDelta} showIcon={false} /></TableCell>
                </TableRow>
                {competitors.slice(0, 5).map((comp: any) => (
                  <TableRow key={comp.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={comp.logo} />
                        <AvatarFallback>{(comp.name || "").slice(0,2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      {comp.name}
                    </TableCell>
                    <TableCell className="text-right font-mono">{comp.visibilityScore || 0}</TableCell>
                    <TableCell className="text-right">{((comp.mentions || 0) / 100).toFixed(0)}%</TableCell>
                    <TableCell className="text-right"><TrendIndicator value={comp.trend7d || 0} showIcon={false} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="glass-card md:col-span-3" data-testid="card-topic-performance">
          <CardHeader>
            <CardTitle>Topic Performance</CardTitle>
            <CardDescription>Your visibility score by topic category.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {topics && topics.length > 0 ? (
              <>
                {topics.slice(0, 5).map((topic: any, i: number) => (
                  <div key={topic.id} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-mono font-bold">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="truncate">{topic.name}</span>
                        <span className="font-mono font-medium">{topic.visibilityScore || 0}</span>
                      </div>
                      <Progress
                        value={topic.visibilityScore || 0}
                        className="h-2"
                      />
                    </div>
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="w-full mt-2" asChild>
                  <Link href="/app/topics">View All Topics <ArrowRight className="ml-1 h-3 w-3" /></Link>
                </Button>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No topics yet</p>
                <p className="text-xs mt-1">Topics help categorize your prompts</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="glass-card" data-testid="card-source-intelligence">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Source Intelligence</CardTitle>
              <CardDescription>Where AI models are getting their answers.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/app/sources">View All <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source Domain</TableHead>
                  <TableHead>DA</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sources.slice(0, 5).map((source: any) => (
                  <TableRow key={source.domain || source.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <Globe className="h-3 w-3 text-muted-foreground" />
                      {source.domain}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{source.authority || 0}</TableCell>
                    <TableCell>
                      {source.isBrandAbsent ? (
                        <Badge variant="secondary" className="text-[10px] gap-1">
                          <AlertCircle className="h-2.5 w-2.5" />
                          Opportunity
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] gap-1 text-green-600 border-green-600/30">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          Present
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="glass-card" data-testid="card-traffic-estimate">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>AI Traffic Estimate</CardTitle>
                <CardDescription>Projected clicks from AI citations.</CardDescription>
              </div>
              <Badge variant="outline" className="font-normal">Medium Confidence</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-4xl font-mono font-bold">
                {trafficByModel.total > 1000 ? `${(trafficByModel.total / 1000).toFixed(1)}k` : trafficByModel.total}
              </span>
              <span className="text-sm text-muted-foreground">visits / mo</span>
            </div>

            {trafficByModel.total > 0 ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      GPT-4 Referrals
                    </span>
                    <span className="font-mono">{trafficByModel.chatgpt}</span>
                  </div>
                  <Progress value={trafficByModel.total > 0 ? (trafficByModel.chatgpt / trafficByModel.total) * 100 : 0} className="h-1.5" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      Perplexity Citations
                    </span>
                    <span className="font-mono">{trafficByModel.perplexity}</span>
                  </div>
                  <Progress value={trafficByModel.total > 0 ? (trafficByModel.perplexity / trafficByModel.total) * 100 : 0} className="h-1.5 [&>div]:bg-blue-500" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      Gemini / SGE
                    </span>
                    <span className="font-mono">{trafficByModel.gemini}</span>
                  </div>
                  <Progress value={trafficByModel.total > 0 ? (trafficByModel.gemini / trafficByModel.total) * 100 : 0} className="h-1.5 [&>div]:bg-amber-500" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                      Claude Citations
                    </span>
                    <span className="font-mono">{trafficByModel.claude}</span>
                  </div>
                  <Progress value={trafficByModel.total > 0 ? (trafficByModel.claude / trafficByModel.total) * 100 : 0} className="h-1.5 [&>div]:bg-purple-500" />
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No traffic data yet</p>
                <p className="text-xs mt-1">Run prompts to generate traffic estimates</p>
              </div>
            )}

            <div className="mt-6 p-3 bg-muted/30 rounded text-xs text-muted-foreground border">
              <span className="font-semibold block mb-1">Estimation Logic:</span>
              Based on search volume for "branded" + "category" queries multiplied by your current visibility score and standard CTR curve for AI citations.
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card" data-testid="card-quick-actions">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            Quick Actions
          </CardTitle>
          <CardDescription>Recommended next steps to improve visibility</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer" data-testid="action-gap-analysis">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Gap Analysis</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {gapOpportunities > 0
                  ? `Identify ${gapOpportunities} prompts where competitors outrank you`
                  : 'Analyze competitive gaps in your visibility'}
              </p>
            </div>
            <div className="p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer" data-testid="action-source-outreach">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Source Outreach</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {sourceOpportunities > 0
                  ? `${sourceOpportunities} high-authority sources don't mention your brand`
                  : 'Identify high-authority sources for outreach'}
              </p>
            </div>
            <div className="p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer" data-testid="action-content-optimize">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Content Optimization</span>
              </div>
              <p className="text-xs text-muted-foreground">Generate AXP content for low-visibility topics</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
