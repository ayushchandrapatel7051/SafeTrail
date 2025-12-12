import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check, X, Eye, Clock, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { admin, reports as apiReports } from "@/lib/api";
import { reportTypes } from "@/data/mockData";
import DashboardLayout from "@/components/DashboardLayout";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [reports, setReports] = useState<any[]>([]);
  const [stats, setStats] = useState({ pendingReports: 0, verifiedReports: 0, totalPlaces: 0, totalCities: 0 });
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Check auth on mount
  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    if (!adminToken) {
      navigate('/admin-login');
      return;
    }

    const loadDashboard = async () => {
      try {
        const [dashboardData, reportsData] = await Promise.all([
          admin.getDashboard(),
          apiReports.getAll({ status: 'pending', limit: 100 }),
        ]);

        setStats(dashboardData.stats);
        setReports(reportsData.reports || []);
      } catch (error) {
        console.error('Error loading dashboard:', error);
        toast({
          title: "Error",
          description: "Failed to load dashboard",
          variant: "destructive",
        });
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, [navigate, toast]);

  const filteredReports = reports.filter(r => {
    if (statusFilter === "all") return true;
    return r.status === statusFilter;
  });

  const pendingCount = reports.filter(r => r.status === 'pending').length;
  const verifiedCount = stats.verifiedReports;
  const rejectedCount = reports.filter(r => r.status === 'rejected').length;

  const handleVerify = async (id: number) => {
    setIsVerifying(true);
    try {
      await apiReports.verify(id);
      setReports(prev => prev.map(r => r.id === id ? { ...r, status: 'verified' } : r));
      toast({
        title: "Report Verified",
        description: "The report has been verified and will affect safety scores.",
      });
      setSelectedReport(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify report",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleReject = async (id: number) => {
    setIsVerifying(true);
    try {
      await apiReports.reject(id);
      setReports(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' } : r));
      toast({
        title: "Report Rejected",
        description: "The report has been rejected and marked as invalid.",
      });
      setSelectedReport(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject report",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" /> Pending</Badge>;
      case 'verified':
        return <Badge className="bg-safe text-safe-foreground gap-1"><CheckCircle className="w-3 h-3" /> Verified</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> Rejected</Badge>;
      default:
        return null;
    }
  };

  const getTypeLabel = (type: string) => {
    return reportTypes.find(t => t.value === type)?.label || type;
  };

  if (isLoading) {
    return (
      <DashboardLayout isAdmin>
        <div className="h-full flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout isAdmin>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage and verify safety reports</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-caution/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-caution" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-safe/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-safe" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Verified</p>
                <p className="text-2xl font-bold">{verifiedCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-danger" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold">{rejectedCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reports Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Reports</CardTitle>
                <CardDescription>Review and moderate user-submitted reports</CardDescription>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Place</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map(report => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">#{report.id}</TableCell>
                      <TableCell>{report.placeName}</TableCell>
                      <TableCell>{getTypeLabel(report.type)}</TableCell>
                      <TableCell>{getStatusBadge(report.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(report.createdAt).toLocaleDateString()}
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
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Report #{report.id}</DialogTitle>
                                <DialogDescription>
                                  Submitted on {new Date(report.createdAt).toLocaleString()}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                              <div>
                                  <p className="text-sm font-medium mb-1">Place</p>
                                  <p className="text-muted-foreground">{selectedReport.place_id || 'Unknown'}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium mb-1">Type</p>
                                  <p className="text-muted-foreground">{getTypeLabel(selectedReport.type)}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium mb-1">Description</p>
                                  <p className="text-muted-foreground">{selectedReport.description}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium mb-1">Coordinates</p>
                                  <p className="text-muted-foreground font-mono text-sm">
                                    {selectedReport.latitude.toFixed(4)}, {selectedReport.longitude.toFixed(4)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium mb-1">Status</p>
                                  {getStatusBadge(selectedReport.status)}
                                </div>
                              </div>
                              {selectedReport?.status === 'pending' && (
                                <DialogFooter>
                                  <Button 
                                    variant="destructive" 
                                    onClick={() => handleReject(selectedReport.id)}
                                    className="gap-2"
                                    disabled={isVerifying}
                                  >
                                    {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                                    Reject
                                  </Button>
                                  <Button 
                                    onClick={() => handleVerify(selectedReport.id)}
                                    className="gap-2"
                                    disabled={isVerifying}
                                  >
                                    {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
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
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-danger hover:text-danger hover:bg-danger/10"
                                onClick={() => handleReject(report.id)}
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
                <p className="text-muted-foreground">No reports found.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
