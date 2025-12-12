import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Mail, MapPin, FileText, AlertCircle, BarChart3 } from 'lucide-react';

export default function Profile() {
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userCountry, setUserCountry] = useState<string>('');
  const [userCity, setUserCity] = useState<string>('');

  useEffect(() => {
    // Load user data from localStorage
    const name = localStorage.getItem('userName') || 'User';
    const email = localStorage.getItem('userEmail') || 'Not set';
    const country = localStorage.getItem('userCountry') || 'Not selected';
    const city = localStorage.getItem('userCity') || 'Not selected';

    setUserName(name);
    setUserEmail(email);
    setUserCountry(country);
    setUserCity(city);
  }, []);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Profile Card */}
          <div className="lg:col-span-2 space-y-6">
            {/* User Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Account Information
                </CardTitle>
                <CardDescription>Your account details and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Name */}
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <User className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Full Name</p>
                    <p className="font-semibold">{userName}</p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Email Address</p>
                    <p className="font-semibold">{userEmail}</p>
                  </div>
                </div>

                {/* Country */}
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Country</p>
                    <p className="font-semibold">{userCountry}</p>
                  </div>
                </div>

                {/* City */}
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">City</p>
                    <p className="font-semibold">{userCity}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Your Activity
                </CardTitle>
                <CardDescription>SafeTrail community contributions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Reports Submitted</p>
                    <p className="text-2xl font-bold text-blue-600">0</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Places Checked</p>
                    <p className="text-2xl font-bold text-green-600">0</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Safety Reviews</p>
                    <p className="text-2xl font-bold text-purple-600">0</p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Cities Visited</p>
                    <p className="text-2xl font-bold text-orange-600">1</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Settings Section */}
            <Card>
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>Customize your SafeTrail experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium text-sm">Safety Alerts</p>
                    <p className="text-xs text-muted-foreground">
                      Get notified about safety incidents
                    </p>
                  </div>
                  <Badge variant="outline">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium text-sm">Trip Recommendations</p>
                    <p className="text-xs text-muted-foreground">Personalized travel suggestions</p>
                  </div>
                  <Badge variant="outline">Enabled</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  View My Reports
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <MapPin className="w-4 h-4 mr-2" />
                  Saved Places
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Safety Tips
                </Button>
              </CardContent>
            </Card>

            {/* Account Status */}
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-base text-green-900">Account Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-green-800">
                  <p className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                    Active & Verified
                  </p>
                  <p className="text-xs text-green-700">Your account is in good standing</p>
                </div>
              </CardContent>
            </Card>

            {/* Support */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="ghost" className="w-full justify-start text-xs h-8">
                  Contact Support
                </Button>
                <Button variant="ghost" className="w-full justify-start text-xs h-8">
                  Report a Bug
                </Button>
                <Button variant="ghost" className="w-full justify-start text-xs h-8">
                  Documentation
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
