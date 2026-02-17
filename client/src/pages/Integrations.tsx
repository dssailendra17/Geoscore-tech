import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TopBar } from "@/components/layout/TopBar";
import { INTEGRATIONS, PLAN_LIMITS, type PlanTier } from "@/lib/data-model";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Lock, Loader2, Plug, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentBrand } from "@/hooks/use-brand";

export default function IntegrationsPage() {
  const { brand, isLoading } = useCurrentBrand();
  const tier = (brand?.tier || "free") as PlanTier;
  const planCaps = PLAN_LIMITS[tier];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <TopBar title="Integrations" showTimeSelector={false} />
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <TopBar title="Integrations" showTimeSelector={false} />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {INTEGRATIONS.map(integration => {
              const isAllowed = planCaps.integrationsAllowed.includes("all") || planCaps.integrationsAllowed.includes(integration.id);
              
              return (
                  <Card key={integration.id} className={cn("glass-card transition-all", !isAllowed && "opacity-80 bg-muted/20")}>
                      <CardHeader className="flex flex-row items-start justify-between pb-2">
                          <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center text-xl">
                                  {integration.icon === 'google' && 'G'}
                                  {integration.icon === 'twitter' && 'X'}
                                  {integration.icon === 'linkedin' && 'In'}
                                  {integration.icon === 'reddit' && 'R'}
                              </div>
                              <div>
                                  <CardTitle className="text-base">{integration.name}</CardTitle>
                                  <CardDescription className="text-xs mt-1">
                                      {integration.connected 
                                        ? <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Connected</span> 
                                        : "Not connected"}
                                  </CardDescription>
                              </div>
                          </div>
                          {!isAllowed && <Lock className="h-4 w-4 text-muted-foreground" />}
                      </CardHeader>
                      <CardContent>
                          <div className="flex items-center justify-between mt-4 pt-4 border-t">
                              {integration.lastSync ? (
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <RefreshCw className="h-3 w-3" /> Synced {integration.lastSync}
                                  </span>
                              ) : (
                                  <span className="text-xs text-muted-foreground">Connect to sync data</span>
                              )}
                              
                              {isAllowed ? (
                                  integration.connected ? (
                                      <Button variant="outline" size="sm">Manage</Button>
                                  ) : (
                                      <Button size="sm">Connect</Button>
                                  )
                              ) : (
                                  <Badge variant="secondary">Upgrade</Badge>
                              )}
                          </div>
                      </CardContent>
                  </Card>
              );
          })}
      </div>
    </div>
  );
}
