import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Shield, Bell } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";

export default function AdminSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [require2FA, setRequire2FA] = useState(false);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-admin-settings-title">Admin Settings</h1>
          <p className="text-muted-foreground">Manage security and system configurations.</p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security
              </CardTitle>
              <CardDescription>Configure authentication and security policies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="space-y-0.5">
                  <Label htmlFor="require-2fa" className="text-base">Require 2FA for Admins</Label>
                  <p className="text-sm text-muted-foreground">
                    All admin users must enable two-factor authentication
                  </p>
                </div>
                <Switch
                  id="require-2fa"
                  checked={require2FA}
                  onCheckedChange={setRequire2FA}
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="space-y-0.5">
                  <Label className="text-base">Session Timeout</Label>
                  <p className="text-sm text-muted-foreground">
                    Auto-logout after inactivity: <span className="font-medium">30 minutes</span>
                  </p>
                </div>
                <Button variant="outline" data-testid="button-configure-session">Configure</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>Configure system alerts and notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="security-alerts" className="text-base">Security Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified of suspicious activities
                  </p>
                </div>
                <Switch id="security-alerts" defaultChecked />
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="space-y-0.5">
                  <Label htmlFor="system-updates" className="text-base">System Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications about system maintenance
                  </p>
                </div>
                <Switch id="system-updates" defaultChecked />
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="space-y-0.5">
                  <Label htmlFor="user-signups" className="text-base">New User Signups</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when new users register
                  </p>
                </div>
                <Switch id="user-signups" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
