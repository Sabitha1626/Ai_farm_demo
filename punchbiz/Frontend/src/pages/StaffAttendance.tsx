import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Fingerprint,
  UserCheck,
  UserX,
  Clock,
  Plus,
  LogOut,
  Calendar,
  Scan,
  Wifi
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { format, startOfDay, endOfDay } from 'date-fns';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface Staff {
  id: string;
  name: string;
  role: string | null;
  biometric_id: string | null;
  biometric_type: string | null;
}

interface AttendanceRecord {
  id: string;
  staff_id: string;
  check_in: string;
  check_out: string | null;
  biometric_type: string | null;
  status: string;
  staff?: {
    name: string;
    role: string | null;
  };
}

const BIOMETRIC_TYPES = [
  { id: 'fingerprint', name: 'Fingerprint', icon: Fingerprint },
  { id: 'face_id', name: 'Face ID', icon: Scan },
  { id: 'card', name: 'ID Card', icon: UserCheck },
  { id: 'manual', name: 'Manual Entry', icon: Clock },
];

export default function StaffAttendance() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { showLocalNotification, permission } = usePushNotifications();

  const [staff, setStaff] = useState<Staff[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCheckInDialog, setShowCheckInDialog] = useState(false);
  const [showAddStaffDialog, setShowAddStaffDialog] = useState(false);

  const [selectedStaff, setSelectedStaff] = useState('');
  const [biometricType, setBiometricType] = useState('fingerprint');
  const [biometricId, setBiometricId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  // New staff form
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffBiometricId, setNewStaffBiometricId] = useState('');
  const [newStaffBiometricType, setNewStaffBiometricType] = useState('fingerprint');

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const today = new Date();
      const start = startOfDay(today).toISOString();
      const end = endOfDay(today).toISOString();

      const [staffResult, attendanceResult] = await Promise.all([
        api.get('/staff'),
        api.get(`/staff/attendance?startDate=${start}&endDate=${end}`),
      ]);

      setStaff(staffResult.data.map((s: any) => ({
        id: s._id,
        name: s.name,
        role: s.role,
        biometric_id: s.biometricId,
        biometric_type: s.biometricType
      })));

      setAttendance(attendanceResult.data.map((a: any) => ({
        id: a._id,
        staff_id: a.staffId?._id || a.staffId,
        check_in: a.checkIn,
        check_out: a.checkOut,
        biometric_type: a.biometricType,
        status: a.status,
        staff: a.staffId && typeof a.staffId === 'object' ? {
          name: a.staffId.name,
          role: a.staffId.role
        } : undefined
      })));
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const handleCheckIn = async () => {
    if (!user || !selectedStaff) {
      toast.error('Please select a staff member');
      return;
    }

    setSubmitting(true);

    // Check if already checked in today (optional, backend should handle it too)
    const existingRecord = attendance.find(
      (a) => a.staff_id === selectedStaff && !a.check_out
    );

    if (existingRecord) {
      toast.error('Staff member already checked in');
      setSubmitting(false);
      return;
    }

    try {
      await api.post('/staff/check-in', {
        staffId: selectedStaff,
        biometricId: biometricId || undefined,
        biometricType: biometricType,
      });

      toast.success('Check-in recorded successfully');
      setShowCheckInDialog(false);
      setSelectedStaff('');
      setBiometricId('');
      fetchData();
    } catch (error) {
      toast.error('Failed to record check-in');
      console.error(error);
    }

    setSubmitting(false);
  };

  const handleCheckOut = async (recordId: string) => {
    try {
      await api.put(`/staff/check-out/${recordId}`);
      toast.success('Check-out recorded');
      fetchData();
    } catch (error) {
      toast.error('Failed to record check-out');
    }
  };

  const handleAddStaff = async () => {
    if (!user || !newStaffName) {
      toast.error('Please enter staff name');
      return;
    }

    setSubmitting(true);

    try {
      await api.post('/staff', {
        name: newStaffName,
        role: newStaffRole || undefined,
        phone: newStaffPhone || undefined,
        biometricId: newStaffBiometricId || undefined,
        biometricType: newStaffBiometricType,
      });

      toast.success('Staff member added');
      setShowAddStaffDialog(false);
      resetNewStaffForm();
      fetchData();
    } catch (error) {
      toast.error('Failed to add staff');
      console.error(error);
    }

    setSubmitting(false);
  };

  const resetNewStaffForm = () => {
    setNewStaffName('');
    setNewStaffRole('');
    setNewStaffPhone('');
    setNewStaffBiometricId('');
    setNewStaffBiometricType('fingerprint');
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      present: 'bg-green-500 text-white hover:bg-green-600',
      late: 'bg-yellow-500 text-white hover:bg-yellow-600',
      early_out: 'bg-orange-500 text-white hover:bg-orange-600',
      absent: 'bg-red-500 text-white hover:bg-red-600',
    };
    return styles[status] || 'bg-gray-500 text-white hover:bg-gray-600';
  };

  const presentCount = attendance.filter(a => !a.check_out).length;
  const checkedOutCount = attendance.filter(a => a.check_out).length;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              {t('staffAttendance') || 'Staff Attendance'}
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              {t('staffAttendanceDesc') || 'Track staff attendance with biometric verification'}
              {isRealtimeConnected && (
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                  <Wifi className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowAddStaffDialog(true)}>
              <Plus className="h-4 w-4 mr-2" /> {t('addStaff') || 'Add Staff'}
            </Button>
            <Button variant="hero" onClick={() => setShowCheckInDialog(true)}>
              <Fingerprint className="h-4 w-4 mr-2" /> {t('checkIn') || 'Check In'}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{presentCount}</p>
                  <p className="text-xs text-muted-foreground">{t('presentNow') || 'Present Now'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <LogOut className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{checkedOutCount}</p>
                  <p className="text-xs text-muted-foreground">{t('checkedOut') || 'Checked Out'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                  <UserX className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{Math.max(0, staff.length - presentCount - checkedOutCount)}</p>
                  <p className="text-xs text-muted-foreground">{t('notCheckedIn') || 'Not Checked In'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{staff.length}</p>
                  <p className="text-xs text-muted-foreground">{t('totalStaff') || 'Total Staff'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Attendance Table */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {t('todayAttendance') || 'Today\'s Attendance'} - {format(new Date(), 'MMMM d, yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-12 bg-secondary/50 rounded" />
                ))}
              </div>
            ) : attendance.length === 0 ? (
              <div className="text-center py-8">
                <Fingerprint className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No attendance records for today</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Records will appear automatically when staff scan their biometric
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff Member</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance.map(record => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.staff?.name}</TableCell>
                        <TableCell>{record.staff?.role || '-'}</TableCell>
                        <TableCell>{format(new Date(record.check_in), 'HH:mm')}</TableCell>
                        <TableCell>
                          {record.check_out ? format(new Date(record.check_out), 'HH:mm') : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {record.biometric_type?.replace('_', ' ') || 'Manual'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(record.status)}>
                            {record.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {!record.check_out && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCheckOut(record.id)}
                            >
                              <LogOut className="h-4 w-4 mr-2" /> Check Out
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Check In Dialog */}
        <Dialog open={showCheckInDialog} onOpenChange={setShowCheckInDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Fingerprint className="h-5 w-5" />
                Staff Check In
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Select Staff *</Label>
                <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} {s.role ? `(${s.role})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Biometric Method</Label>
                <Select value={biometricType} onValueChange={setBiometricType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BIOMETRIC_TYPES.map(type => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Biometric ID (optional)</Label>
                <Input
                  value={biometricId}
                  onChange={e => setBiometricId(e.target.value)}
                  placeholder="Fingerprint/Card ID..."
                />
              </div>

              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-center">
                <Scan className="h-12 w-12 mx-auto mb-2 text-primary animate-pulse" />
                <p className="text-sm text-muted-foreground">
                  Place finger on scanner or scan ID card
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCheckInDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCheckIn} disabled={submitting || !selectedStaff}>
                {submitting ? 'Recording...' : 'Confirm Check In'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Staff Dialog */}
        <Dialog open={showAddStaffDialog} onOpenChange={setShowAddStaffDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Staff Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input
                  value={newStaffName}
                  onChange={e => setNewStaffName(e.target.value)}
                  placeholder="Enter staff name"
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Input
                  value={newStaffRole}
                  onChange={e => setNewStaffRole(e.target.value)}
                  placeholder="e.g., Farm Worker, Veterinarian"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  value={newStaffPhone}
                  onChange={e => setNewStaffPhone(e.target.value)}
                  placeholder="Phone number"
                />
              </div>
              <div className="space-y-2">
                <Label>Biometric Type</Label>
                <Select value={newStaffBiometricType} onValueChange={setNewStaffBiometricType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BIOMETRIC_TYPES.map(type => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Biometric ID</Label>
                <Input
                  value={newStaffBiometricId}
                  onChange={e => setNewStaffBiometricId(e.target.value)}
                  placeholder="Fingerprint/Card ID"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddStaffDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddStaff} disabled={submitting || !newStaffName}>
                {submitting ? 'Adding...' : 'Add Staff'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}