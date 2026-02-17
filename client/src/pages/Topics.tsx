import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TopBar } from "@/components/layout/TopBar";
import { useCurrentBrand } from "@/hooks/use-brand";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Target, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { TrendIndicator } from "@/components/ui/data-display";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/ui/EmptyState";

export default function Topics() {
  const { data: brands, isLoading: brandsLoading } = useQuery<any[]>({
    queryKey: ['/api/brands'],
  });

  const currentBrand = brands?.[0];
  const brandId = currentBrand?.id;

  const { data: topics = [], isLoading: topicsLoading } = useQuery<any[]>({
    queryKey: ['topics', brandId],
    queryFn: async () => {
      const res = await fetch(`/api/brands/${brandId}/topics`);
      if (!res.ok) throw new Error('Failed to fetch topics');
      return res.json();
    },
    enabled: !!brandId,
  });

  const [searchQuery, setSearchQuery] = useState("");

  const filteredTopics = topics.filter((topic: any) =>
    topic.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (brandsLoading || topicsLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <TopBar title="Topics" description="Manage your topic categories" />
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <TopBar
        title="Topics"
        description="Organize and track your prompts by topic category"
        action={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Topic
          </Button>
        }
      />

      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Topics</CardTitle>
              <CardDescription>
                {topics.length} {topics.length === 1 ? 'topic' : 'topics'} total
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTopics.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Topic Name</TableHead>
                  <TableHead className="text-right">Visibility Score</TableHead>
                  <TableHead className="text-right">Prompts</TableHead>
                  <TableHead className="text-right">Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTopics.map((topic: any) => (
                  <TableRow key={topic.id} className="cursor-pointer hover:bg-accent/50">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        {topic.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-mono font-medium">{topic.visibilityScore || 0}</span>
                        <Progress value={topic.visibilityScore || 0} className="h-2 w-20" />
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {topic.promptCount || 0}
                    </TableCell>
                    <TableCell className="text-right">
                      <TrendIndicator value={topic.trend7d || 0} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              icon={Target}
              title={searchQuery ? "No topics found" : "No topics yet"}
              description={
                searchQuery
                  ? "Try adjusting your search query"
                  : "Topics help you organize and categorize your prompts for better tracking."
              }
              action={
                !searchQuery
                  ? {
                      label: "Add Your First Topic",
                      onClick: () => {},
                    }
                  : undefined
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

