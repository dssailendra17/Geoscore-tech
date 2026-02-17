import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TopBar } from "@/components/layout/TopBar";
import { useCurrentBrand } from "@/hooks/use-brand";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, ArrowUpRight, TrendingUp, TrendingDown, Eye, BarChart3, Target, ChevronDown, CheckCircle2, XCircle, Sparkles, Loader2, AlertCircle, Plus, MessageSquare } from "lucide-react";
import { TrendIndicator, ConfidenceBadge } from "@/components/ui/data-display";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { usePromptRuns, useLLMAnswers } from "@/hooks/use-analytics";
import { getPrompts } from "@/lib/api";
import { AddPromptDialog } from "@/components/prompts/AddPromptDialog";
import { useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "@/components/ui/EmptyState";

const modelFilters = [
  { id: "all", label: "All Models" },
  { id: "gpt4", label: "ChatGPT" },
  { id: "claude", label: "Claude" },
  { id: "gemini", label: "Gemini" },
  { id: "perplexity", label: "Perplexity" },
];

const categoryFilters = [
  "All Categories",
  "Visibility Check",
  "Competitive",
  "Citation",
  "Recommendation",
];

export default function PromptsPage() {
  const { brandId } = useCurrentBrand();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModel, setSelectedModel] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [sortBy, setSortBy] = useState<"visibility" | "rank" | "priority">("priority");
  const [showAddPrompt, setShowAddPrompt] = useState(false);

  // Fetch real data
  const { data: promptRuns, isLoading, error } = usePromptRuns(brandId || "", 100);
  const { data: llmAnswers } = useLLMAnswers(brandId || "", 100);

  // Refresh data after adding a prompt
  const handlePromptAdded = () => {
    queryClient.invalidateQueries({ queryKey: ['promptRuns', brandId] });
    queryClient.invalidateQueries({ queryKey: ['llmAnswers', brandId] });
  };

  // Define prompt interface
  interface TransformedPrompt {
    id: string;
    text: string;
    category: string;
    modelsCovered: string[];
    visibilityPct: number;
    avgRank: number;
    priorityScore: number;
  }

  // Transform API data to match component structure
  const prompts: TransformedPrompt[] = useMemo(() => {
    if (!promptRuns || promptRuns.length === 0) return [];
    
    return promptRuns.map((run: any) => ({
      id: run.id,
      text: run.promptText || run.prompt?.text || "Untitled Prompt",
      category: run.category || "Visibility Check",
      modelsCovered: run.providers || ["gpt4"],
      visibilityPct: run.visibilityScore || 0,
      avgRank: run.averageRank || 10,
      priorityScore: run.priorityScore || 50,
    }));
  }, [promptRuns]);

  const promptStats = useMemo(() => ({
    total: prompts.length,
    avgVisibility: prompts.length > 0 
      ? Math.round(prompts.reduce((acc: number, p: TransformedPrompt) => acc + p.visibilityPct, 0) / prompts.length)
      : 0,
    highPerformers: prompts.filter((p: TransformedPrompt) => p.visibilityPct >= 70).length,
    lowPerformers: prompts.filter((p: TransformedPrompt) => p.visibilityPct < 30).length,
    avgRank: prompts.length > 0
      ? (prompts.reduce((acc: number, p: TransformedPrompt) => acc + p.avgRank, 0) / prompts.length).toFixed(1)
      : "0.0",
  }), [prompts]);

  const filteredPrompts = prompts.filter((p: TransformedPrompt) => {
    if (searchQuery && !p.text.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (selectedModel !== "all" && !p.modelsCovered.includes(selectedModel)) return false;
    if (selectedCategory !== "All Categories" && p.category !== selectedCategory) return false;
    return true;
  }).sort((a: TransformedPrompt, b: TransformedPrompt) => {
    if (sortBy === "visibility") return b.visibilityPct - a.visibilityPct;
    if (sortBy === "rank") return a.avgRank - b.avgRank;
    return b.priorityScore - a.priorityScore;
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading prompts...</p>
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
          <p className="text-muted-foreground">Failed to load prompts. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <TopBar title="Prompt Performance Center" showExport={true} />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="glass-card p-4" data-testid="stat-total-prompts">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <BarChart3 className="h-4 w-4" />
            <span className="text-xs">Total Prompts</span>
          </div>
          <div className="text-2xl font-bold font-mono">{promptStats.total}</div>
        </Card>
        <Card className="glass-card p-4" data-testid="stat-avg-visibility">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Eye className="h-4 w-4" />
            <span className="text-xs">Avg Visibility</span>
          </div>
          <div className="text-2xl font-bold font-mono">{promptStats.avgVisibility}%</div>
        </Card>
        <Card className="glass-card p-4" data-testid="stat-avg-rank">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Target className="h-4 w-4" />
            <span className="text-xs">Avg Rank</span>
          </div>
          <div className="text-2xl font-bold font-mono">#{promptStats.avgRank}</div>
        </Card>
        <Card className="glass-card p-4 border-green-500/20 bg-green-500/5" data-testid="stat-high-performers">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs">High Performers</span>
          </div>
          <div className="text-2xl font-bold font-mono text-green-600">{promptStats.highPerformers}</div>
        </Card>
        <Card className="glass-card p-4 border-red-500/20 bg-red-500/5" data-testid="stat-low-performers">
          <div className="flex items-center gap-2 text-red-500 mb-1">
            <TrendingDown className="h-4 w-4" />
            <span className="text-xs">Needs Attention</span>
          </div>
          <div className="text-2xl font-bold font-mono text-red-500">{promptStats.lowPerformers}</div>
        </Card>
      </div>

      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search prompts..." 
                className="pl-9" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-prompts"
              />
            </div>
            <div className="flex flex-wrap gap-2 w-full lg:w-auto">
              <Tabs value={selectedModel} onValueChange={setSelectedModel} className="w-auto">
                <TabsList className="h-9">
                  {modelFilters.map(m => (
                    <TabsTrigger key={m.id} value={m.id} className="text-xs px-3" data-testid={`filter-model-${m.id}`}>
                      {m.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2" data-testid="filter-category">
                    <Filter className="h-4 w-4" />
                    {selectedCategory}
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {categoryFilters.map(cat => (
                    <DropdownMenuItem key={cat} onClick={() => setSelectedCategory(cat)}>
                      {cat}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                size="sm"
                className="gap-2"
                data-testid="btn-add-prompt"
                onClick={() => setShowAddPrompt(true)}
              >
                <Sparkles className="h-4 w-4" />
                Add Prompt
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card" data-testid="card-prompts-table">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[400px]">Prompt Text</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Models</TableHead>
                <TableHead className="text-center cursor-pointer hover:text-primary" onClick={() => setSortBy("visibility")}>
                  <span className={cn("flex items-center justify-center gap-1", sortBy === "visibility" && "text-primary font-bold")}>
                    Visibility {sortBy === "visibility" && "↓"}
                  </span>
                </TableHead>
                <TableHead className="text-center cursor-pointer hover:text-primary" onClick={() => setSortBy("rank")}>
                  <span className={cn("flex items-center justify-center gap-1", sortBy === "rank" && "text-primary font-bold")}>
                    Avg Rank {sortBy === "rank" && "↑"}
                  </span>
                </TableHead>
                <TableHead className="cursor-pointer hover:text-primary" onClick={() => setSortBy("priority")}>
                  <span className={cn("flex items-center gap-1", sortBy === "priority" && "text-primary font-bold")}>
                    Priority {sortBy === "priority" && "↓"}
                  </span>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPrompts.map((prompt: TransformedPrompt) => (
                <TableRow key={prompt.id} className="cursor-pointer hover:bg-muted/50" data-testid={`row-prompt-${prompt.id}`}>
                  <TableCell className="font-medium">
                    <div className="line-clamp-2" title={prompt.text}>{prompt.text}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">{prompt.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex -space-x-2">
                      {prompt.modelsCovered.map((mid: string) => {
                        const modelColors: Record<string, string> = {
                          gpt4: "bg-green-100 text-green-700 border-green-200",
                          claude: "bg-orange-100 text-orange-700 border-orange-200",
                          gemini: "bg-blue-100 text-blue-700 border-blue-200",
                          perplexity: "bg-purple-100 text-purple-700 border-purple-200",
                        };
                        return (
                          <div 
                            key={mid} 
                            className={cn("h-6 w-6 rounded-full border flex items-center justify-center text-[10px] font-bold", modelColors[mid] || "bg-background")} 
                            title={mid}
                          >
                            {mid.slice(0,1).toUpperCase()}
                          </div>
                        );
                      })}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className={cn(
                        "font-bold font-mono",
                        prompt.visibilityPct >= 70 ? "text-green-600" : 
                        prompt.visibilityPct >= 40 ? "text-amber-500" : "text-red-500"
                      )}>
                        {prompt.visibilityPct}%
                      </span>
                      <Progress 
                        value={prompt.visibilityPct} 
                        className={cn(
                          "h-1 w-16",
                          prompt.visibilityPct >= 70 ? "[&>div]:bg-green-500" : 
                          prompt.visibilityPct >= 40 ? "[&>div]:bg-amber-500" : "[&>div]:bg-red-500"
                        )}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-mono">
                    <span className={cn(
                      "font-bold",
                      prompt.avgRank <= 3 ? "text-green-600" : 
                      prompt.avgRank <= 5 ? "text-amber-500" : "text-muted-foreground"
                    )}>
                      #{prompt.avgRank}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full",
                            prompt.priorityScore >= 70 ? "bg-primary" : 
                            prompt.priorityScore >= 40 ? "bg-amber-500" : "bg-muted-foreground"
                          )} 
                          style={{ width: `${prompt.priorityScore}%` }} 
                        />
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">{prompt.priorityScore}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {prompt.visibilityPct >= 50 ? (
                      <Badge variant="outline" className="gap-1 text-green-600 border-green-200 bg-green-50">
                        <CheckCircle2 className="h-3 w-3" />
                        Visible
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-red-500 border-red-200 bg-red-50">
                        <XCircle className="h-3 w-3" />
                        Low
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`btn-view-prompt-${prompt.id}`}>
                      <ArrowUpRight className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredPrompts.length === 0 && prompts.length > 0 && (
            <EmptyState
              icon={Search}
              title="No prompts match your filters"
              description="Try adjusting your search query or filters to find what you're looking for."
              action={{
                label: "Clear Filters",
                onClick: () => {
                  setSearchQuery("");
                  setSelectedModel("all");
                  setSelectedCategory("All Categories");
                },
              }}
            />
          )}
          {prompts.length === 0 && (
            <EmptyState
              icon={MessageSquare}
              title="No prompts yet"
              description="Get started by adding your first prompt to track how your brand appears in AI responses."
              action={{
                label: "Add Your First Prompt",
                onClick: () => setShowAddPrompt(true),
                icon: Plus,
              }}
              secondaryAction={{
                label: "Learn More",
                onClick: () => window.open("https://docs.geoscore.ai/prompts", "_blank"),
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Add Prompt Dialog */}
      <AddPromptDialog
        brandId={brandId || ""}
        open={showAddPrompt}
        onOpenChange={setShowAddPrompt}
        onSuccess={handlePromptAdded}
      />
    </div>
  );
}
