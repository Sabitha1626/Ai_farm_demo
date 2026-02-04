import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Search, Beef, Edit, Trash2, Activity, Milk, Stethoscope, Scale } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { CowPhotoUpload } from '@/components/CowPhotoUpload';
import { MilkProductionDialog } from '@/components/MilkProductionDialog';
import { HealthRecordsDialog } from '@/components/HealthRecordsDialog';

interface Cow {
  id: string;
  name: string;
  tag_number: string;
  breed: string | null;
  date_of_birth: string | null;
  weight: number | null;
  status: string;
  notes: string | null;
  image_url: string | null;
}

interface HeatRecord {
  id: string;
  cow_id: string;
  detected_at: string;
  intensity: string | null;
  sensor_type: string | null;
  sensor_reading: number | null;
  ai_confidence: number | null;
  symptoms: string[] | null;
}

interface MilkProduction {
  cow_id: string;
  total_liters: number;
  today_liters: number;
}

interface CowWithSensorData extends Cow {
  latestHeatRecord?: HeatRecord;
  milkProduction?: MilkProduction;
  latestWeight?: number;
}

const statusColors: Record<string, string> = {
  healthy: 'bg-status-healthy text-white',
  pregnant: 'bg-status-pregnant text-white',
  sick: 'bg-status-sick text-white',
  in_heat: 'bg-status-heat text-white',
};

export default function CowManagement() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [cows, setCows] = useState<CowWithSensorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCow, setEditingCow] = useState<Cow | null>(null);
  const [selectedCowForMilk, setSelectedCowForMilk] = useState<CowWithSensorData | null>(null);
  const [selectedCowForHealth, setSelectedCowForHealth] = useState<CowWithSensorData | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    tag_number: '',
    breed: '',
    date_of_birth: '',
    weight: '',
    status: 'healthy',
    notes: '',
  });

  useEffect(() => {
    if (user) {
      fetchCows();
    }
  }, [user]);

  async function fetchCows() {
    if (!user) return;

    try {
      // Fetch data from backend
      const [cowsRes, heatRes, milkRes] = await Promise.all([
        api.get('/cows'),
        api.get('/events/heat'),
        api.get('/milk'),
      ]);

      const cowsData = cowsRes.data;
      const heatRecords = heatRes.data;
      const milkData = milkRes.data;

      // Map data to cows
      const cowsWithSensorData: CowWithSensorData[] = (cowsData || []).map((cow: any) => {
        // Find latest heat record
        const cowHeatRecords = heatRecords?.filter((r: any) => r.cowId === cow._id) || [];
        const latestHeatRecord = cowHeatRecords.sort((a: any, b: any) =>
          new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime()
        )[0];

        // Calculate milk production
        const cowMilkRecords = milkData?.filter((m: any) => m.cowId === cow._id) || [];
        const totalLiters = cowMilkRecords.reduce((sum: number, r: any) => sum + Number(r.quantityLiters), 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayRecords = cowMilkRecords.filter((r: any) => new Date(r.recordedAt) >= today);
        const todayLiters = todayRecords.reduce((sum: number, r: any) => sum + Number(r.quantityLiters), 0);

        return {
          id: cow._id, // Map MongoDB _id to id
          name: cow.name,
          tag_number: cow.tagNumber,
          breed: cow.breed,
          date_of_birth: cow.dateOfBirth,
          weight: cow.weight,
          status: cow.status.toLowerCase().replace(' ', '_'), // Normalize status
          notes: cow.notes,
          image_url: cow.imageUrl,
          latestHeatRecord: latestHeatRecord ? {
            id: latestHeatRecord._id,
            cow_id: latestHeatRecord.cowId,
            detected_at: latestHeatRecord.detectedAt,
            intensity: latestHeatRecord.intensity,
            sensor_type: 'collars', // Default for now
            sensor_reading: latestHeatRecord.sensorReading,
            ai_confidence: latestHeatRecord.aiConfidence,
            symptoms: []
          } : undefined,
          milkProduction: {
            cow_id: cow._id,
            total_liters: totalLiters,
            today_liters: todayLiters,
          },
          latestWeight: cow.weight, // Update when sensor endpoint ready
        };
      });

      setCows(cowsWithSensorData);
    } catch (error) {
      console.error('Error fetching cows:', error);
      toast.error('Failed to load cows from backend');
    } finally {
      setLoading(false);
    }
  }

  function formatStatusForBackend(status: string): string {
    switch (status) {
      case 'in_heat':
        return 'In Heat';
      case 'healthy':
        return 'Healthy';
      case 'sick':
        return 'Sick';
      case 'pregnant':
        return 'Pregnant';
      case 'dry':
        return 'Dry';
      case 'lactating':
        return 'Lactating';
      default:
        return 'Healthy';
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    const cowData = {
      userId: user.id, // Mongoose expects userId
      name: formData.name,
      tagNumber: formData.tag_number,
      breed: formData.breed || undefined,
      dateOfBirth: formData.date_of_birth || undefined,
      weight: formData.weight ? parseFloat(formData.weight) : undefined,
      status: formatStatusForBackend(formData.status), // Correctly format enum
      notes: formData.notes || undefined,
    };

    try {
      if (editingCow) {
        await api.put(`/cows/${editingCow.id}`, cowData);
        toast.success('Cow updated successfully');
      } else {
        await api.post('/cows', cowData);
        toast.success('Cow added successfully');
      }

      setDialogOpen(false);
      resetForm();
      fetchCows();
    } catch (error) {
      console.error('Error saving cow:', error);
      toast.error('Failed to save cow');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t('confirmDelete'))) return;

    try {
      await api.delete(`/cows/${id}`);
      toast.success('Cow deleted');
      fetchCows();
    } catch (error) {
      console.error('Error deleting cow:', error);
      toast.error('Failed to delete cow');
    }
  }

  function resetForm() {
    setFormData({
      name: '',
      tag_number: '',
      breed: '',
      date_of_birth: '',
      weight: '',
      status: 'healthy',
      notes: '',
    });
    setEditingCow(null);
  }

  function openEditDialog(cow: Cow) {
    setEditingCow(cow);
    setFormData({
      name: cow.name,
      tag_number: cow.tag_number,
      breed: cow.breed || '',
      date_of_birth: cow.date_of_birth ? new Date(cow.date_of_birth).toISOString().split('T')[0] : '',
      weight: cow.weight?.toString() || '',
      status: cow.status,
      notes: cow.notes || '',
    });
    setDialogOpen(true);
  }

  const filteredCows = cows.filter(cow =>
    cow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cow.tag_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">{t('cowManagement')}</h1>
            <p className="text-muted-foreground">{t('cowManagementDesc')}</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button variant="hero">
                <Plus className="h-4 w-4" />
                {t('addCow')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh]">
              <DialogHeader>
                <DialogTitle className="font-display">
                  {editingCow ? t('editCow') : t('addNewCow')}
                </DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-[70vh] pr-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {editingCow && (
                    <CowPhotoUpload
                      cowId={editingCow.id}
                      currentImageUrl={editingCow.image_url}
                      onUploadComplete={(url) => {
                        setEditingCow(prev => prev ? { ...prev, image_url: url } : null);
                        fetchCows();
                      }}
                    />
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('cowName')} *</Label>
                      <Input
                        required
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Bessie"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('tagNumber')} *</Label>
                      <Input
                        required
                        value={formData.tag_number}
                        onChange={(e) => setFormData(prev => ({ ...prev, tag_number: e.target.value }))}
                        placeholder="COW-001"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('breed')}</Label>
                      <Input
                        value={formData.breed}
                        onChange={(e) => setFormData(prev => ({ ...prev, breed: e.target.value }))}
                        placeholder="Holstein"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('weight')} (kg)</Label>
                      <Input
                        type="number"
                        value={formData.weight}
                        onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                        placeholder="500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('dateOfBirth')}</Label>
                      <Input
                        type="date"
                        value={formData.date_of_birth}
                        onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('status')}</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="healthy">{t('healthy')}</SelectItem>
                          <SelectItem value="pregnant">{t('pregnant')}</SelectItem>
                          <SelectItem value="sick">{t('sick')}</SelectItem>
                          <SelectItem value="in_heat">{t('inHeat')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('notes')}</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional notes..."
                      rows={3}
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    {editingCow ? t('updateCow') : t('addCow')}
                  </Button>
                </form>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('searchByNameOrTag')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Cows Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6 h-48" />
              </Card>
            ))}
          </div>
        ) : filteredCows.length === 0 ? (
          <Card className="shadow-soft">
            <CardContent className="p-12 text-center">
              <Beef className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                {searchTerm ? t('noCowsFound') : t('noCowsYet')}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? t('tryDifferentSearch') : t('addFirstCowDesc')}
              </p>
              {!searchTerm && (
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('addFirstCow')}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCows.map(cow => (
              <Card key={cow.id} className="shadow-soft hover:shadow-medium transition-shadow group">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {cow.image_url ? (
                        <img
                          src={cow.image_url}
                          alt={cow.name}
                          className="h-12 w-12 rounded-xl object-cover"
                          onError={(e) => {
                            e.currentTarget.src = ''; // Clear source on error
                            e.currentTarget.style.display = 'none'; // Hide broken image
                            e.currentTarget.nextElementSibling?.classList.remove('hidden'); // Show placeholder
                          }}
                        />
                      ) : null}
                      {(!cow.image_url) && (
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Beef className="h-6 w-6 text-primary" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-display font-semibold text-foreground">{cow.name}</h3>
                        <p className="text-sm text-muted-foreground">{cow.tag_number}</p>
                      </div>
                    </div>
                    <Badge className={statusColors[cow.status]}>
                      {cow.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    {cow.breed && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('breed')}</span>
                        <span className="text-foreground">{cow.breed}</span>
                      </div>
                    )}
                    {(cow.latestWeight || cow.weight) && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Scale className="h-3 w-3" />
                          {t('weight')}
                        </span>
                        <span className="text-foreground">{cow.latestWeight || cow.weight} kg</span>
                      </div>
                    )}
                    {cow.date_of_birth && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('born')}</span>
                        <span className="text-foreground">
                          {new Date(cow.date_of_birth).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Milk Production Section */}
                  {cow.milkProduction && (cow.milkProduction.total_liters > 0 || cow.milkProduction.today_liters > 0) && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                        <Milk className="h-4 w-4 text-blue-500" />
                        {t('milkProduction')}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="p-2 rounded bg-blue-500/10 text-center">
                          <p className="font-bold text-blue-500">{cow.milkProduction.today_liters.toFixed(1)}L</p>
                          <p className="text-xs text-muted-foreground">{t('today')}</p>
                        </div>
                        <div className="p-2 rounded bg-purple-500/10 text-center">
                          <p className="font-bold text-purple-500">{cow.milkProduction.total_liters.toFixed(1)}L</p>
                          <p className="text-xs text-muted-foreground">{t('total')}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sensor Data Section */}
                  {cow.latestHeatRecord && (
                    <div className="mt-4 pt-4 border-t border-border space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Activity className="h-4 w-4 text-primary" />
                        {t('latestSensorData')}
                      </div>
                      <div className="space-y-1 text-sm">
                        {cow.latestHeatRecord.sensor_type && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('sensor')}</span>
                            <span className="text-foreground capitalize">{cow.latestHeatRecord.sensor_type.replace('_', ' ')}</span>
                          </div>
                        )}
                        {cow.latestHeatRecord.sensor_reading !== null && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('reading')}</span>
                            <span className="text-foreground">{cow.latestHeatRecord.sensor_reading}</span>
                          </div>
                        )}
                        {cow.latestHeatRecord.intensity && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('heatIntensity')}</span>
                            <Badge variant={
                              cow.latestHeatRecord.intensity === 'high' ? 'destructive' :
                                cow.latestHeatRecord.intensity === 'medium' ? 'default' : 'secondary'
                            } className="text-xs">
                              {cow.latestHeatRecord.intensity}
                            </Badge>
                          </div>
                        )}
                        {cow.latestHeatRecord.ai_confidence !== null && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('aiConfidence')}</span>
                            <span className="text-foreground">{Math.round(cow.latestHeatRecord.ai_confidence * 100)}%</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('detected')}</span>
                          <span className="text-foreground text-xs">
                            {new Date(cow.latestHeatRecord.detected_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedCowForMilk(cow)}
                    >
                      <Milk className="h-4 w-4" />
                      {t('milk')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedCowForHealth(cow)}
                    >
                      <Stethoscope className="h-4 w-4" />
                      {t('health')}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditDialog(cow)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(cow.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Milk Production Dialog */}
      <MilkProductionDialog
        cowId={selectedCowForMilk?.id || ''}
        cowName={selectedCowForMilk?.name || ''}
        open={!!selectedCowForMilk}
        onOpenChange={(open) => !open && setSelectedCowForMilk(null)}
      />

      {/* Health Records Dialog */}
      <HealthRecordsDialog
        cowId={selectedCowForHealth?.id || ''}
        cowName={selectedCowForHealth?.name || ''}
        open={!!selectedCowForHealth}
        onOpenChange={(open) => !open && setSelectedCowForHealth(null)}
      />
    </DashboardLayout>
  );
}