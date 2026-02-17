import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

export default function ActionPlan() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight">Action Plan</h1>
        <p className="text-muted-foreground mt-1">
          Prioritized tasks to improve your AI visibility.
        </p>
      </div>

      <Card className="glass-card">
        <CardHeader>
            <CardTitle>High Priority</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
             {[
                { title: "Update Wikipedia entry with new pricing", tag: "Citation", impact: "High" },
                { title: "Fix hallucination regarding API limits in Claude 3", tag: "Correction", impact: "High" },
                { title: "Publish comparison article vs Globex", tag: "Content", impact: "Medium" }
             ].map((task, i) => (
                 <div key={i} className="flex items-start gap-3 p-4 border rounded-lg">
                    <Checkbox className="mt-1" />
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                            <span className="font-medium decoration-inherit">{task.title}</span>
                            <Badge variant={task.impact === 'High' ? 'destructive' : 'secondary'}>{task.impact} Impact</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">Category: {task.tag}</p>
                    </div>
                 </div>
             ))}
        </CardContent>
      </Card>
    </div>
  );
}
