import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Plus, Trash2, Copy, FlaskConical, Sparkles } from "lucide-react";
import type { PromptTemplate } from "@shared/schema";

const CATEGORIES = [
  { id: "visibility", label: "Visibility Check", color: "bg-blue-500" },
  { id: "competitive", label: "Competitive Analysis", color: "bg-purple-500" },
  { id: "citation", label: "Citation Extraction", color: "bg-amber-500" },
  { id: "summarization", label: "Summarization", color: "bg-green-500" },
];

const LLM_PROVIDERS = [
  { id: "all", label: "All Models" },
  { id: "chatgpt", label: "ChatGPT" },
  { id: "claude", label: "Claude" },
  { id: "gemini", label: "Gemini" },
  { id: "perplexity", label: "Perplexity" },
];

export default function AdminPromptTemplates() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("");

  const { data: templates, isLoading } = useQuery<PromptTemplate[]>({
    queryKey: ["/api/admin/prompt-templates", filterCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterCategory) params.set("category", filterCategory);
      const res = await fetch(`/api/admin/prompt-templates?${params}`);
      return res.json();
    },
  });

  const createTemplate = useMutation({
    mutationFn: async (data: Partial<PromptTemplate>) => {
      const res = await fetch("/api/admin/prompt-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create template");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/prompt-templates"] });
      toast({ title: "Template created successfully" });
      setIsCreateOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to create template", variant: "destructive" });
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...data }: Partial<PromptTemplate> & { id: string }) => {
      const res = await fetch(`/api/admin/prompt-templates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update template");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/prompt-templates"] });
      toast({ title: "Template updated successfully" });
      setEditingTemplate(null);
    },
    onError: () => {
      toast({ title: "Failed to update template", variant: "destructive" });
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/prompt-templates/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete template");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/prompt-templates"] });
      toast({ title: "Template deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete template", variant: "destructive" });
    },
  });

  const getCategoryBadge = (category: string) => {
    const cat = CATEGORIES.find(c => c.id === category);
    return cat ? (
      <Badge className={`${cat.color} text-white`}>{cat.label}</Badge>
    ) : (
      <Badge variant="secondary">{category}</Badge>
    );
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="page-title">Prompt Templates</h1>
          <p className="text-muted-foreground">Manage prompt templates with versioning and A/B testing.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="create-template-button">
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Prompt Template</DialogTitle>
            </DialogHeader>
            <TemplateForm onSubmit={(data) => createTemplate.mutate(data)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2 mb-6">
        <Button
          variant={filterCategory === "" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterCategory("")}
          data-testid="filter-all"
        >
          All
        </Button>
        {CATEGORIES.map(cat => (
          <Button
            key={cat.id}
            variant={filterCategory === cat.id ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterCategory(cat.id)}
            data-testid={`filter-${cat.id}`}
          >
            {cat.label}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Templates</CardTitle>
            <Badge variant="outline">{templates?.length || 0} templates</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>A/B Test</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates?.map(template => (
                <TableRow key={template.id} data-testid={`template-row-${template.id}`}>
                  <TableCell>
                    <div className="font-medium">{template.name}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">{template.description}</div>
                  </TableCell>
                  <TableCell>{getCategoryBadge(template.category)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{template.llmProvider}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">v{template.version}</span>
                  </TableCell>
                  <TableCell>
                    {template.abTestGroup ? (
                      <div className="flex items-center gap-1">
                        <FlaskConical className="h-4 w-4 text-purple-500" />
                        <span className="text-xs">{template.abTestGroup} ({template.abTestWeight}%)</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={template.isActive}
                      onCheckedChange={(checked) => updateTemplate.mutate({ id: template.id, isActive: checked })}
                      data-testid={`toggle-active-${template.id}`}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setEditingTemplate(template)} data-testid={`edit-${template.id}`}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => createTemplate.mutate({ ...template, name: `${template.name} (Copy)`, version: 1 })} data-testid={`copy-${template.id}`}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteTemplate.mutate(template.id)} data-testid={`delete-${template.id}`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {templates?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No templates found. Create your first template to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && setEditingTemplate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
          </DialogHeader>
          {editingTemplate && (
            <TemplateForm
              template={editingTemplate}
              onSubmit={(data) => updateTemplate.mutate({ ...data, id: editingTemplate.id })}
            />
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

function TemplateForm({ template, onSubmit }: { template?: PromptTemplate; onSubmit: (data: Partial<PromptTemplate>) => void }) {
  const [formData, setFormData] = useState({
    name: template?.name || "",
    description: template?.description || "",
    category: template?.category || "visibility",
    llmProvider: template?.llmProvider || "all",
    template: template?.template || "",
    variables: template?.variables?.join(", ") || "",
    version: template?.version || 1,
    isActive: template?.isActive ?? true,
    isDefault: template?.isDefault ?? false,
    abTestGroup: template?.abTestGroup || "",
    abTestWeight: template?.abTestWeight || 50,
  });

  const handleSubmit = () => {
    onSubmit({
      ...formData,
      variables: formData.variables.split(",").map(v => v.trim()).filter(Boolean),
    });
  };

  const extractVariables = () => {
    const matches = formData.template.match(/\{\{(\w+)\}\}/g);
    if (matches) {
      const vars = matches.map(m => m.replace(/\{\{|\}\}/g, ""));
      setFormData({ ...formData, variables: Array.from(new Set(vars)).join(", ") });
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Template Name</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Brand Visibility Check"
            data-testid="input-name"
          />
        </div>
        <div>
          <Label>Category</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
            <SelectTrigger data-testid="select-category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Description</Label>
        <Input
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Check if brand appears in LLM response..."
          data-testid="input-description"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Target Model</Label>
          <Select value={formData.llmProvider} onValueChange={(value) => setFormData({ ...formData, llmProvider: value })}>
            <SelectTrigger data-testid="select-model">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LLM_PROVIDERS.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Version</Label>
          <Input
            type="number"
            value={formData.version}
            onChange={(e) => setFormData({ ...formData, version: parseInt(e.target.value) || 1 })}
            data-testid="input-version"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Prompt Template</Label>
          <Button variant="outline" size="sm" onClick={extractVariables} data-testid="extract-variables">
            <Sparkles className="h-3 w-3 mr-1" />
            Extract Variables
          </Button>
        </div>
        <Textarea
          value={formData.template}
          onChange={(e) => setFormData({ ...formData, template: e.target.value })}
          placeholder="What are the best {{industry}} companies for {{topic}}?"
          rows={4}
          className="font-mono text-sm"
          data-testid="input-template"
        />
        <p className="text-xs text-muted-foreground mt-1">Use {"{{variable_name}}"} syntax for dynamic values.</p>
      </div>

      <div>
        <Label>Variables (comma-separated)</Label>
        <Input
          value={formData.variables}
          onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
          placeholder="industry, topic, brand_name"
          data-testid="input-variables"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>A/B Test Group (optional)</Label>
          <Select value={formData.abTestGroup} onValueChange={(value) => setFormData({ ...formData, abTestGroup: value })}>
            <SelectTrigger data-testid="select-ab-group">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              <SelectItem value="A">Group A</SelectItem>
              <SelectItem value="B">Group B</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Test Weight (%)</Label>
          <Input
            type="number"
            value={formData.abTestWeight}
            onChange={(e) => setFormData({ ...formData, abTestWeight: parseInt(e.target.value) || 50 })}
            min={0}
            max={100}
            data-testid="input-ab-weight"
          />
        </div>
      </div>

      <div className="flex items-center gap-6 pt-2">
        <div className="flex items-center space-x-2">
          <Switch
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            data-testid="toggle-active"
          />
          <Label>Active</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            checked={formData.isDefault}
            onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
            data-testid="toggle-default"
          />
          <Label>Default Template</Label>
        </div>
      </div>

      <DialogFooter className="pt-4">
        <Button onClick={handleSubmit} data-testid="submit-template">
          {template ? "Update Template" : "Create Template"}
        </Button>
      </DialogFooter>
    </div>
  );
}
