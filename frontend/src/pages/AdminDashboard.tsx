import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, Eye, Clock, CheckCircle, XCircle, Filter, Loader2, Send, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { reportTypes } from '@/data/mockData';

interface Report {
  id: number;
  place_name?: string;
  city_name?: string;
  type: string;
  reporter_name?: string;
  reporter_email?: string;
  status: string;
  created_at?: string;
  createdAt?: string;
  description?: string;
  photo_path?: string;
  latitude?: string;
  longitude?: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState({
    pendingReports: 0,
    verifiedReports: 0,
    totalPlaces: 0,
    totalCities: 0,
  });
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState('pending');
  
  // Notification state
  const [showNotificationForm, setShowNotificationForm] = useState(false);
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const [notificationData, setNotificationData] = useState({
    title: '',
    message: '',
    incident_type: '',
    recipient_type: 'all', // 'all', 'city', 'custom'
    city_id: '',
    recipient_emails: '',
  });

  // Check auth on mount
  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      navigate('/admin-login');
      return;
    }

    // Decode token to check if it has valid user id (not 0)
    try {
      const tokenPayload = JSON.parse(atob(adminToken.split('.')[1]));
      if (tokenPayload.id === 0) {
        // Old token with invalid user id, force re-login
        console.log('Invalid admin token detected, forcing re-login');
        localStorage.removeItem('adminToken');
        toast({
          title: 'Session Expired',
          description: 'Please login again with your admin credentials.',
          variant: 'destructive',
        });
        navigate('/admin-login');
        return;
      }
    } catch (e) {
      console.error('Error decoding token:', e);
      localStorage.removeItem('adminToken');
      navigate('/admin-login');
      return;
    }

    const loadDashboard = async () => {
      setFetchError(null);
      try {
        const adminToken = localStorage.getItem('adminToken');
        if (!adminToken) {
          throw new Error('Admin token not found');
        }

        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

        // Fetch dashboard data with admin token
        const dashboardRes = await fetch(`${API_BASE_URL}/admin/dashboard`, {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!dashboardRes.ok) {
          throw new Error(`Dashboard fetch failed: ${dashboardRes.status}`);
        }

        const dashboardData = await dashboardRes.json();

        // Fetch reports data with admin token - fetch ALL reports
        const reportsRes = await fetch(`${API_BASE_URL}/reports?limit=100`, {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!reportsRes.ok) {
          throw new Error(`Reports fetch failed: ${reportsRes.status}`);
        }

        const reportsData = await reportsRes.json();

        setStats(dashboardData.stats);
        setReports(reportsData.reports || []);
      } catch (error) {
        console.error('Error loading dashboard:', error);
        toast({
          title: 'Error',
          description: 'Failed to load dashboard',
          variant: 'destructive',
        });
        setFetchError('Unable to load admin dashboard right now. Please try again in a moment.');
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, [navigate, toast]);

  const filteredReports = reports.filter((r) => {
    if (tabValue === 'all') return true;
    return r.status === tabValue;
  });

  const pendingCount = reports.filter((r) => r.status === 'pending').length;
  const verifiedCount = stats.verifiedReports;
  const rejectedCount = reports.filter((r) => r.status === 'rejected').length;

  const handleVerify = async (id: number) => {
    setIsVerifying(true);
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        throw new Error('Admin token not found');
      }

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const res = await fetch(`${API_BASE_URL}/reports/${id}/verify`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`Verify failed: ${res.status}`);
      }

      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'verified' } : r)));
      toast({
        title: 'Report Verified',
        description: 'The report has been verified and will affect safety scores.',
      });
      setSelectedReport(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to verify report',
        variant: 'destructive',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleReject = async (id: number) => {
    setIsVerifying(true);
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        throw new Error('Admin token not found');
      }

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const res = await fetch(`${API_BASE_URL}/reports/${id}/reject`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`Reject failed: ${res.status}`);
      }

      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'rejected' } : r)));
      toast({
        title: 'Report Rejected',
        description: 'The report has been rejected and marked as invalid.',
      });
      setSelectedReport(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject report',
        variant: 'destructive',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSendNotification = async () => {
    if (!notificationData.title || !notificationData.message) {
      toast({
        title: 'Error',
        description: 'Title and message are required',
        variant: 'destructive',
      });
      return;
    }

    setIsSendingNotification(true);
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        throw new Error('Admin token not found');
      }

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      
      const payload: any = {
        title: notificationData.title,
        message: notificationData.message,
        incident_type: notificationData.incident_type || undefined,
      };

      if (notificationData.recipient_type === 'all') {
        payload.send_to_all_users = true;
      } else if (notificationData.recipient_type === 'city' && notificationData.city_id) {
        payload.send_to_city_users = parseInt(notificationData.city_id);
      } else if (notificationData.recipient_type === 'custom' && notificationData.recipient_emails) {
        payload.recipient_emails = notificationData.recipient_emails
          .split(',')
          .map(email => email.trim())
          .filter(email => email);
      }

      const res = await fetch(`${API_BASE_URL}/notifications/send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Send failed: ${res.status}`);
      }

      const result = await res.json();
      
      toast({
        title: 'Notification Sent',
        description: `Successfully sent to ${result.recipients_count} recipient(s)`,
      });

      // Reset form
      setNotificationData({
        title: '',
        message: '',
        incident_type: '',
        recipient_type: 'all',
        city_id: '',
        recipient_emails: '',
      });
      setShowNotificationForm(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send notification',
        variant: 'destructive',
      });
    } finally {
      setIsSendingNotification(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="w-3 h-3" /> Pending
          </Badge>
        );
      case 'verified':
        return (
          <Badge className="bg-safe text-safe-foreground gap-1">
            <CheckCircle className="w-3 h-3" /> Verified
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="w-3 h-3" /> Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  const getTypeLabel = (type: string) => {
    return reportTypes.find((t) => t.value === type)?.label || type;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen w-full bg-background p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground mt-1">Reports & report analysis</p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                localStorage.removeItem('adminToken');
                navigate('/admin-login');
              }}
            >
              Logout
            </Button>
          </div>
          <Card className="border border-destructive/60 bg-destructive/5">
            <CardContent className="pt-6">
              <p className="text-lg font-semibold">{fetchError}</p>
              <p className="text-muted-foreground mt-2">
                Please try again in a moment or contact support.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">Reports & report analysis</p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              localStorage.removeItem('adminToken');
              navigate('/admin-login');
            }}
          >
            Logout
          </Button>
        </div>

        {/* Report Analysis */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Report Analysis</CardTitle>
              <CardDescription>Key safety metrics derived from submitted reports</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg border border-caution/30 p-4">
                <p className="text-sm text-muted-foreground">Pending Reports</p>
                <p className="text-3xl font-bold text-caution">{pendingCount}</p>
                <p className="text-xs text-muted-foreground mt-1">Require verification</p>
              </div>
              <div className="rounded-lg border border-safe/30 p-4">
                <p className="text-sm text-muted-foreground">Verified Reports</p>
                <p className="text-3xl font-bold text-safe">{verifiedCount}</p>
                <p className="text-xs text-muted-foreground mt-1">Contributing to safety scores</p>
              </div>
              <div className="rounded-lg border border-danger/30 p-4">
                <p className="text-sm text-muted-foreground">Rejected Reports</p>
                <p className="text-3xl font-bold text-danger">{rejectedCount}</p>
                <p className="text-xs text-muted-foreground mt-1">Marked invalid</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Send Notifications Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Send Notifications
                </CardTitle>
                <CardDescription>Send alerts and notifications to users</CardDescription>
              </div>
              <Button
                onClick={() => setShowNotificationForm(!showNotificationForm)}
                variant={showNotificationForm ? 'secondary' : 'default'}
              >
                {showNotificationForm ? 'Hide Form' : 'Create Notification'}
              </Button>
            </div>
          </CardHeader>
          {showNotificationForm && (
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Notification Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Weather Alert, Safety Advisory"
                  value={notificationData.title}
                  onChange={(e) =>
                    setNotificationData({ ...notificationData, title: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="incident_type">Incident Type (optional)</Label>
                <Input
                  id="incident_type"
                  placeholder="e.g., weather, safety, emergency"
                  value={notificationData.incident_type}
                  onChange={(e) =>
                    setNotificationData({ ...notificationData, incident_type: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  placeholder="Enter the notification message..."
                  value={notificationData.message}
                  onChange={(e) =>
                    setNotificationData({ ...notificationData, message: e.target.value })
                  }
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Send To</Label>
                <RadioGroup
                  value={notificationData.recipient_type}
                  onValueChange={(value) =>
                    setNotificationData({ ...notificationData, recipient_type: value })
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="all" />
                    <Label htmlFor="all" className="font-normal cursor-pointer">
                      All verified users
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="city" id="city" />
                    <Label htmlFor="city" className="font-normal cursor-pointer">
                      Users in specific city
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="custom" id="custom" />
                    <Label htmlFor="custom" className="font-normal cursor-pointer">
                      Custom email list
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {notificationData.recipient_type === 'city' && (
                <div className="space-y-2">
                  <Label htmlFor="city_id">City ID</Label>
                  <Input
                    id="city_id"
                    type="number"
                    placeholder="Enter city ID"
                    value={notificationData.city_id}
                    onChange={(e) =>
                      setNotificationData({ ...notificationData, city_id: e.target.value })
                    }
                  />
                </div>
              )}

              {notificationData.recipient_type === 'custom' && (
                <div className="space-y-2">
                  <Label htmlFor="emails">Email Addresses</Label>
                  <Textarea
                    id="emails"
                    placeholder="Enter emails separated by commas (e.g., user1@example.com, user2@example.com)"
                    value={notificationData.recipient_emails}
                    onChange={(e) =>
                      setNotificationData({ ...notificationData, recipient_emails: e.target.value })
                    }
                    rows={3}
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowNotificationForm(false)}
                  disabled={isSendingNotification}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendNotification}
                  disabled={isSendingNotification}
                  className="gap-2"
                >
                  {isSendingNotification ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Notification
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Reports Table with Tabs */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Reports</CardTitle>
              <CardDescription>Review and moderate user-submitted reports</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={tabValue} onValueChange={setTabValue}>
              <TabsList>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="verified">Verified</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>

              <TabsContent value={tabValue} className="mt-6">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Place</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Reporter</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell className="font-medium">#{report.id}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{report.place_name || 'Unknown'}</div>
                              {report.city_name && (
                                <div className="text-xs text-muted-foreground">
                                  {report.city_name}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getTypeLabel(report.type)}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {report.reporter_name || (
                                <span className="text-muted-foreground italic">Anonymous</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(report.status)}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(report.created_at || report.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedReport(report)}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>Report #{report.id}</DialogTitle>
                                    <DialogDescription>
                                      Submitted on{' '}
                                      {new Date(
                                        report.created_at || report.createdAt
                                      ).toLocaleString()}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <p className="text-sm font-medium mb-1">Place</p>
                                        <p className="text-muted-foreground">
                                          {selectedReport?.place_name ||
                                            report.place_name ||
                                            'Unknown'}
                                        </p>
                                        {(selectedReport?.city_name || report.city_name) && (
                                          <p className="text-xs text-muted-foreground">
                                            {selectedReport?.city_name || report.city_name}
                                          </p>
                                        )}
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium mb-1">Reported By</p>
                                        {selectedReport?.reporter_name || report.reporter_name ? (
                                          <>
                                            <p className="text-muted-foreground">
                                              {selectedReport?.reporter_name ||
                                                report.reporter_name}
                                            </p>
                                            {(selectedReport?.reporter_email ||
                                              report.reporter_email) && (
                                              <p className="text-xs text-muted-foreground">
                                                {selectedReport?.reporter_email ||
                                                  report.reporter_email}
                                              </p>
                                            )}
                                          </>
                                        ) : (
                                          <p className="text-muted-foreground italic">
                                            Anonymous / Legacy Report
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium mb-1">Type</p>
                                      <p className="text-muted-foreground">
                                        {getTypeLabel(selectedReport?.type || report.type)}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium mb-1">Description</p>
                                      <p className="text-muted-foreground">
                                        {selectedReport?.description || report.description}
                                      </p>
                                    </div>
                                    {(selectedReport?.photo_path || report.photo_path) && (
                                      <div>
                                        <p className="text-sm font-medium mb-1">Attached Photo</p>
                                        <div className="border rounded-lg overflow-hidden bg-muted">
                                          <img
                                            src={`http://localhost:3000/uploads/${(selectedReport?.photo_path || report.photo_path).split('/').pop()}`}
                                            alt="Report evidence"
                                            className="w-full h-auto max-h-64 object-contain"
                                            onError={(e) => {
                                              e.currentTarget.style.display = 'none';
                                              e.currentTarget.nextElementSibling?.classList.remove(
                                                'hidden'
                                              );
                                            }}
                                          />
                                          <div className="hidden p-4 text-center text-muted-foreground">
                                            Unable to load image
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    <div>
                                      <p className="text-sm font-medium mb-1">Coordinates</p>
                                      <p className="text-muted-foreground font-mono text-sm">
                                        {selectedReport?.latitude
                                          ? `${parseFloat(selectedReport.latitude).toFixed(4)}, ${parseFloat(selectedReport.longitude).toFixed(4)}`
                                          : `${parseFloat(report.latitude || 0).toFixed(4)}, ${parseFloat(report.longitude || 0).toFixed(4)}`}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium mb-1">Status</p>
                                      {getStatusBadge(selectedReport?.status || report.status)}
                                    </div>
                                  </div>
                                  {(selectedReport?.status === 'pending' ||
                                    report.status === 'pending') && (
                                    <DialogFooter>
                                      <Button
                                        variant="destructive"
                                        onClick={() =>
                                          handleReject(selectedReport?.id || report.id)
                                        }
                                        className="gap-2"
                                        disabled={isVerifying}
                                      >
                                        {isVerifying ? (
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                          <X className="w-4 h-4" />
                                        )}
                                        Reject
                                      </Button>
                                      <Button
                                        onClick={() =>
                                          handleVerify(selectedReport?.id || report.id)
                                        }
                                        className="gap-2"
                                        disabled={isVerifying}
                                      >
                                        {isVerifying ? (
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                          <Check className="w-4 h-4" />
                                        )}
                                        Verify
                                      </Button>
                                    </DialogFooter>
                                  )}
                                </DialogContent>
                              </Dialog>

                              {report.status === 'pending' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-safe hover:text-safe hover:bg-safe/10"
                                    onClick={() => handleVerify(report.id)}
                                    disabled={isVerifying}
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-danger hover:text-danger hover:bg-danger/10"
                                    onClick={() => handleReject(report.id)}
                                    disabled={isVerifying}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {filteredReports.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      No {tabValue === 'all' ? '' : tabValue} reports found.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
