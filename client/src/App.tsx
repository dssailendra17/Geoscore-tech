import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import NotFound from "@/pages/not-found";
import AppShell from "@/components/layout/AppShell";
import Dashboard from "@/pages/Dashboard";
import Onboarding from "@/pages/Onboarding";
import BrandProfile from "@/pages/BrandProfile";
import AIVisibility from "@/pages/AIVisibility";
import CompetitorsPage from "@/pages/Competitors";
import SourcesPage from "@/pages/Sources";
import IntegrationsPage from "@/pages/Integrations";
import PromptsPage from "@/pages/Prompts";
import TopicsPage from "@/pages/Topics";
import SearchConsolePage from "@/pages/SearchSEO";
import GapAnalysisPage from "@/pages/GapAnalysis";
import SocialCommunity from "@/pages/SocialCommunity";
import ContentAXP from "@/pages/ContentAXP";
import ActionPlan from "@/pages/ActionPlan";
import Settings from "@/pages/Settings";
import Profile from "@/pages/Profile";
import Landing from "@/pages/Landing";
import SignIn from "@/pages/auth/SignIn";
import SignUp from "@/pages/auth/SignUp";
import VerifyEmail from "@/pages/auth/VerifyEmail";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import { AdminLogin, AdminBrands } from "@/pages/Admin";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminPlans from "@/pages/admin/AdminPlans";
import AdminPromptTemplates from "@/pages/admin/AdminPromptTemplates";
import AdminAuditLogs from "@/pages/admin/AdminAuditLogs";
import AdminBrandsManager from "@/pages/admin/AdminBrandsManager";
import { ErrorBoundary } from "@/components/ErrorBoundary";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/auth/sign-in" />;
  }

  return <Component />;
}

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/auth/sign-in" />;
  }

  if (!isAdmin) {
    return <Redirect to="/app/dashboard" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />

      <Route path="/auth/sign-in" component={SignIn} />
      <Route path="/auth/sign-up" component={SignUp} />
      <Route path="/auth/verify-email" component={VerifyEmail} />
      <Route path="/auth/forgot-password" component={ForgotPassword} />

      <Route path="/onboarding">
        <ProtectedRoute component={Onboarding} />
      </Route>

      <Route path="/app/:rest*">
        <AppShell>
          <Switch>
            <Route path="/app">
              <Redirect to="/app/dashboard" />
            </Route>
            <Route path="/app/dashboard">
              <ProtectedRoute component={Dashboard} />
            </Route>
            <Route path="/app/prompts">
              <ProtectedRoute component={PromptsPage} />
            </Route>
            <Route path="/app/topics">
              <ProtectedRoute component={TopicsPage} />
            </Route>
            <Route path="/app/competitors">
              <ProtectedRoute component={CompetitorsPage} />
            </Route>
            <Route path="/app/sources">
              <ProtectedRoute component={SourcesPage} />
            </Route>
            <Route path="/app/integrations">
              <ProtectedRoute component={IntegrationsPage} />
            </Route>
            <Route path="/app/search-console">
              <ProtectedRoute component={SearchConsolePage} />
            </Route>
            <Route path="/app/gap-analysis">
              <ProtectedRoute component={GapAnalysisPage} />
            </Route>
            <Route path="/app/brand-profile">
              <ProtectedRoute component={BrandProfile} />
            </Route>
            <Route path="/app/ai-visibility">
              <ProtectedRoute component={AIVisibility} />
            </Route>
            <Route path="/app/social">
              <ProtectedRoute component={SocialCommunity} />
            </Route>
            <Route path="/app/content-axp">
              <ProtectedRoute component={ContentAXP} />
            </Route>
            <Route path="/app/action-plan">
              <ProtectedRoute component={ActionPlan} />
            </Route>
            <Route path="/app/settings">
              <ProtectedRoute component={Settings} />
            </Route>
            <Route path="/app/profile">
              <ProtectedRoute component={Profile} />
            </Route>
            
            <Route component={NotFound} />
          </Switch>
        </AppShell>
      </Route>

      <Route path="/admin">
        <AdminRoute component={AdminLogin} />
      </Route>
      <Route path="/admin/brands">
        <AdminRoute component={AdminBrandsManager} />
      </Route>
      <Route path="/admin/plans">
        <AdminRoute component={AdminPlans} />
      </Route>
      <Route path="/admin/prompt-templates">
        <AdminRoute component={AdminPromptTemplates} />
      </Route>
      <Route path="/admin/audit-logs">
        <AdminRoute component={AdminAuditLogs} />
      </Route>
      <Route path="/admin/settings">
        <AdminRoute component={AdminSettings} />
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Router />
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
