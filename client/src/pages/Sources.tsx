import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TopBar } from "@/components/layout/TopBar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ExternalLink, Globe, Loader2, AlertCircle, Play } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getSources, getSourceDomains, getSourceRecommendations } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentBrand } from "@/hooks/use-brand";
import { EmptyState } from "@/components/ui/EmptyState";

interface Source {
  id: string;
  domain: string;
  url?: string;
  title?: string;
  citationCount?: number;
  llmProvider?: string;
  lastSeenAt?: string;
  authority?: number;
}

interface DomainStats {
  domain: string;
  totalCitations: number;
  uniquePages: number;
  models: string[];
  lastSeen: string;
}

interface SourceRecommendation {
  domain: string;
  actionability: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  impactScore: number;
}

export default function SourcesPage() {
  const { brandId: currentBrandId } = useCurrentBrand();

  const { data: sources = [], isLoading: sourcesLoading, error: sourcesError } = useQuery({
    queryKey: ['sources', currentBrandId || ""],
    queryFn: () => getSources(currentBrandId || ""),
    retry: 1,
    enabled: !!currentBrandId,
  });

  const { data: domains = [], isLoading: domainsLoading } = useQuery({
    queryKey: ['source-domains', currentBrandId || ""],
    queryFn: () => getSourceDomains(currentBrandId || ""),
    retry: 1,
    enabled: !!currentBrandId,
  });

  const { data: recommendations = [] } = useQuery<SourceRecommendation[]>({
    queryKey: ['source-recommendations', currentBrandId || ""],
    queryFn: () => getSourceRecommendations(currentBrandId || ""),
    retry: 1,
    enabled: !!currentBrandId,
  });

  const isLoading = sourcesLoading || domainsLoading;

  // If we have domain stats, use those; otherwise aggregate from sources
  const displayData = domains.length > 0 ? domains : aggregateSources(sources);

  function aggregateSources(sources: Source[]): DomainStats[] {
    const domainMap = new Map<string, DomainStats>();
    
    sources.forEach((source) => {
      const domain = source.domain || '';
      if (!domainMap.has(domain)) {
        domainMap.set(domain, {
          domain,
          totalCitations: 0,
          uniquePages: 0,
          models: [],
          lastSeen: '',
        });
      }
      const entry = domainMap.get(domain)!;
      entry.totalCitations += source.citationCount || 1;
      if (source.llmProvider && !entry.models.includes(source.llmProvider)) {
        entry.models.push(source.llmProvider);
      }
      if (source.lastSeenAt && (!entry.lastSeen || source.lastSeenAt > entry.lastSeen)) {
        entry.lastSeen = source.lastSeenAt;
      }
    });
    
    return Array.from(domainMap.values()).sort((a, b) => b.totalCitations - a.totalCitations);
  }

  const getActionabilityBadge = (domain: string) => {
    const rec = recommendations.find(r => r.domain === domain);
    if (!rec) return <Badge variant="secondary" className="text-muted-foreground">Monitor</Badge>;
    
    switch (rec.actionability) {
      case 'acquire_backlink':
        return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Acquire Link</Badge>;
      case 'publish_content':
        return <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50">Publish</Badge>;
      case 'partner':
        return <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">Partner</Badge>;
      default:
        return <Badge variant="secondary" className="text-muted-foreground">Monitor</Badge>;
    }
  };

  if (sourcesError) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <TopBar title="Source Intelligence" />
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Unable to load sources</h3>
            <p className="text-muted-foreground text-center max-w-md">
              No source data available yet. Sources will appear here once LLM responses are analyzed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <TopBar title="Source Intelligence" />

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Top Cited Domains</CardTitle>
          <CardDescription>
            Websites that AI models trust for information about your industry.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-5 w-16 ml-auto" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-24" />
                </div>
              ))}
            </div>
          ) : displayData.length === 0 ? (
            <EmptyState
              icon={Globe}
              title="No sources discovered yet"
              description="Sources will appear here once your prompts are analyzed by AI models. Run your first analysis to discover which domains are being cited."
              action={{
                label: "Run Analysis",
                onClick: () => window.location.href = "/app/prompts",
                icon: Play,
              }}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Domain</TableHead>
                  <TableHead className="text-center">Citations</TableHead>
                  <TableHead className="text-center">Pages</TableHead>
                  <TableHead>Models</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayData.map((source: DomainStats) => (
                  <TableRow key={source.domain}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      {source.domain}
                    </TableCell>
                    <TableCell className="text-center font-mono font-bold">{source.totalCitations}</TableCell>
                    <TableCell className="text-center font-mono text-muted-foreground">{source.uniquePages}</TableCell>
                    <TableCell>
                      <div className="flex -space-x-1">
                        {source.models.slice(0, 3).map((model: string) => (
                          <div key={model} className="h-5 w-5 rounded-full bg-background border flex items-center justify-center text-[8px] font-bold uppercase">
                            {model.slice(0, 1)}
                          </div>
                        ))}
                        {source.models.length > 3 && (
                          <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[8px]">
                            +{source.models.length - 3}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getActionabilityBadge(source.domain)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => window.open(`https://${source.domain}`, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {recommendations.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
            <CardDescription>
              Actions to improve your brand's presence in AI-cited sources.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations.slice(0, 5).map((rec) => (
                <div key={rec.domain} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{rec.domain}</span>
                      <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'secondary' : 'outline'}>
                        {rec.priority} priority
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{rec.reason}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold font-mono">{rec.impactScore}</div>
                    <div className="text-xs text-muted-foreground">Impact Score</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
