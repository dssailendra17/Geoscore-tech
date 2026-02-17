import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { useCurrentBrand } from "@/hooks/use-brand";
import { useVisibilityScores, useLatestVisibilityScore } from "@/hooks/use-analytics";
import { Loader2, AlertCircle, TrendingUp, TrendingDown, Eye } from "lucide-react";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChartSkeleton, StatCardSkeleton, CardSkeleton } from "@/components/ui/SkeletonLoaders";

export default function AIVisibility() {
  const { brandId } = useCurrentBrand();
  
  // Fetch real data
  const { data: visibilityHistory, isLoading, error } = useVisibilityScores(brandId, '90d', 90);
  const { data: latestScore } = useLatestVisibilityScore(brandId);

  // Transform data for chart
  const chartData = useMemo(() => {
    if (!visibilityHistory || visibilityHistory.length === 0) {
      return [
        { date: "Dec 1", score: 58 },
        { date: "Dec 8", score: 61 },
        { date: "Dec 15", score: 59 },
        { date: "Dec 22", score: 64 },
        { date: "Dec 29", score: 68 },
        { date: "Jan 5", score: 70 },
        { date: "Jan 12", score: 72 },
      ];
    }
    
    return visibilityHistory.map((item: any) => ({
      date: new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      score: item.overallScore,
    }));
  }, [visibilityHistory]);

  // Model breakdown from latest score
  const modelBreakdown = useMemo(() => {
    if (!latestScore?.modelScores) return [];
    
    return Object.entries(latestScore.modelScores).map(([key, value]: [string, any]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      score: value.score || 0,
      trend: value.trend || 0,
      mentions: value.mentions || 0,
    }));
  }, [latestScore]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight">AI Visibility Intelligence</h1>
            <p className="text-muted-foreground mt-1">
              Deep dive into how Large Language Models perceive and cite your brand.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>

        <ChartSkeleton height="h-80" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CardSkeleton rows={5} />
          <CardSkeleton rows={5} />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <AlertCircle className="h-8 w-8 mx-auto text-destructive" />
          <p className="text-muted-foreground">Failed to load visibility data. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">AI Visibility Intelligence</h1>
          <p className="text-muted-foreground mt-1">
            Deep dive into how Large Language Models perceive and cite your brand.
          </p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline">Export CSV</Button>
            <Button>Schedule Report</Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Overall Visibility Score
            </CardTitle>
            <CardDescription>Current AI visibility across all models</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold font-mono">{latestScore?.overallScore || 0}</span>
              <span className="text-muted-foreground">/100</span>
              {latestScore?.trend && (
                <Badge variant={latestScore.trend > 0 ? "default" : "secondary"} className="ml-2">
                  {latestScore.trend > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {Math.abs(latestScore.trend).toFixed(1)}%
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Model Performance</CardTitle>
            <CardDescription>Visibility breakdown by AI model</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {modelBreakdown.length > 0 ? (
              modelBreakdown.map((model) => (
                <div key={model.name} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span>{model.name}</span>
                      <span className="font-mono font-medium">{model.score}</span>
                    </div>
                    <Progress value={model.score} className="h-2" />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {model.trend > 0 ? '+' : ''}{model.trend.toFixed(1)}%
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No model data available</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Share of Model Attention</CardTitle>
          <CardDescription>Visibility scores across major LLMs over time.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVis" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `${value}%`} 
                  domain={[0, 100]}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: "8px", 
                    border: "1px solid hsl(var(--border))",
                    backgroundColor: "hsl(var(--card))",
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorVis)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
