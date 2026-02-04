import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Thermometer, Plus, Calendar, Activity, Radio, Ear, Droplets, Milk } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

// Sensor types with descriptions
const SENSOR_TYPES = [
  { id: 'manual', name: 'Manual Observation', icon: Activity, description: 'Visual observation by farm staff' },
  { id: 'activity_sensor', name: 'Activity Sensor', icon: Activity, description: 'Monitors movement patterns and restlessness' },
  { id: 'pedometer', name: 'Pedometer (Leg Sensor)', icon: Activity, description: 'Tracks step count and walking patterns' },
  { id: 'neck_collar', name: 'Neck Collar Sensor', icon: Radio, description: 'Monitors activity and rumination via neck movement' },
  { id: 'ear_tag', name: 'Ear Tag Sensor', icon: Ear, description: 'Temperature and activity monitoring via ear' },
  { id: 'body_temp', name: 'Body Temperature Sensor', icon: Thermometer, description: 'External body temperature monitoring' },
  { id: 'vaginal_temp', name: 'Vaginal Temperature Sensor', icon: Thermometer, description: 'Internal temperature for precise heat detection' },
  { id: 'rumen_bolus', name: 'Rumen Bolus Sensor', icon: Thermometer, description: 'Internal rumen temperature and pH monitoring' },
  { id: 'mounting_pressure', name: 'Mounting Pressure Sensor', icon: Activity, description: 'Detects mounting activity from other cows' },
  { id: 'tail_head', name: 'Tail-Head Sensor', icon: Activity, description: 'Monitors tail movement and mounting attempts' },
  { id: 'heat_mount_patch', name: 'Heat-Mount Patch', icon: Droplets, description: 'Color-changing patch activated by mounting' },
  { id: 'rumination', name: 'Rumination Sensor', icon: Radio, description: 'Monitors chewing patterns (decreases during heat)' },
  { id: 'milk_progesterone', name: 'Milk Progesterone Sensor', icon: Milk, description: 'Hormone level analysis in milk' },
];

interface Cow {
  id: string;
  name: string;
  tagNumber: string;
}

interface HeatRecord {
  id: string;
  cowId: string;
  detectedAt: string;
  intensity: string;
  sensorType: string;
  sensorReading: number | null;
  symptoms: string[] | null;
  notes: string | null;
  aiConfidence: number | null;
  isInseminated: boolean;
  cowInfo: {
    name: string;
    tagNumber: string;
  } | null;
}

export default function HeatDetection() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [records, setRecords] = useState<HeatRecord[]>([]);
  const [cows, setCows] = useState<Cow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [selectedCow, setSelectedCow] = useState('');
  const [intensity, setIntensity] = useState('medium');
  const [sensorType, setSensorType] = useState('manual');
  const [sensorReading, setSensorReading] = useState('');
  const [notes, setNotes] = useState('');
  const [symptoms, setSymptoms] = useState<string[]>([]);

  const symptomOptions = [
    'Restlessness',
    'Mounting other cows',
    'Standing to be mounted',
    'Mucus discharge',
    'Bellowing',
    'Reduced appetite',
    'Tail raising',
    'Swollen vulva',
  ];

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    setLoading(true);

    try {
      // Fetch heat records and cows in parallel from backend
      const [recordsRes, cowsRes] = await Promise.all([
        api.get('/events/heat'),
        api.get('/cows'),
      ]);

      const recordsData = (recordsRes.data || []).map((r: any) => ({
        id: r._id,
        cowId: r.cowId?._id || r.cowId,
        detectedAt: r.detectedAt,
        intensity: r.intensity,
        sensorType: r.sensorType,
        sensorReading: r.sensorReading,
        symptoms: r.symptoms,
        notes: r.notes,
        aiConfidence: r.aiConfidence,
        isInseminated: r.isInseminated,
        cowInfo: r.cowId && typeof r.cowId === 'object' ? {
          name: r.cowId.name,
          tagNumber: r.cowId.tagNumber
        } : null
      }));

      const cowsData = (cowsRes.data || []).map((c: any) => ({
        id: c._id,
        name: c.name,
        tagNumber: c.tagNumber
      }));

      setRecords(recordsData);
      setCows(cowsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load records from backend');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecord = async () => {
    if (!user || !selectedCow) {
      toast.error('Please select a cow');
      return;
    }

    setSubmitting(true);

    try {
      // Use the detection endpoint for recording heat as it handles alerts and cow status
      await api.post('/detection/heat', {
        userId: user.id,
        cowId: selectedCow,
        intensity,
        sensorType,
        sensorReading: sensorReading ? parseFloat(sensorReading) : null,
        symptoms,
        notes,
        detectedAt: new Date().toISOString(),
      });

      toast.success('Heat detection recorded successfully');
      setShowAddDialog(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error('Failed to record heat detection');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedCow('');
    setIntensity('medium');
    setSensorType('manual');
    setSensorReading('');
    setNotes('');
    setSymptoms([]);
  };

  const toggleSymptom = (symptom: string) => {
    setSymptoms(prev =>
      prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const getSensorIcon = (type: string) => {
    const sensor = SENSOR_TYPES.find(s => s.id === type);
    return sensor?.icon || Activity;
  };

  const getSensorName = (type: string) => {
    const sensor = SENSOR_TYPES.find(s => s.id === type);
    return sensor?.name || 'Unknown';
  };

  const intensityColors: Record<string, string> = {
    low: 'bg-yellow-500',
    medium: 'bg-orange-500',
    high: 'bg-red-500',
    Low: 'bg-yellow-500',
    Medium: 'bg-orange-500',
    High: 'bg-red-500',
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">{t('heatDetection')}</h1>
            <p className="text-muted-foreground">{t('heatDetectionDesc') || 'Monitor and track heat cycles with sensor data'}</p>
          </div>
          <Button variant="hero" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4" /> Record Heat
          </Button>
        </div>

        {/* Sensor Types Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {SENSOR_TYPES.slice(0, 6).map(sensor => {
            const Icon = sensor.icon;
            return (
              <Card key={sensor.id} className="p-3 text-center hover:shadow-soft transition-shadow cursor-pointer">
                <div className="h-8 w-8 mx-auto rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <p className="text-xs font-medium text-foreground truncate">{sensor.name}</p>
              </Card>
            );
          })}
        </div>

        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => <Card key={i}><CardContent className="h-24" /></Card>)}
          </div>
        ) : records.length === 0 ? (
          <Card className="shadow-soft">
            <CardContent className="p-12 text-center">
              <Thermometer className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-display text-xl font-semibold mb-2">No heat records yet</h3>
              <p className="text-muted-foreground mb-4">Start tracking heat cycles by recording observations or connecting sensors.</p>
              <Button variant="hero" onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4" /> Record First Heat
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {records.map(record => {
              const SensorIcon = getSensorIcon(record.sensorType || 'manual');
              return (
                <Card key={record.id} className="shadow-soft hover:shadow-medium transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-status-heat/10 flex items-center justify-center">
                          <Thermometer className="h-6 w-6 text-status-heat" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{record.cowInfo?.name}</h3>
                          <p className="text-sm text-muted-foreground">{record.cowInfo?.tagNumber}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50">
                          <SensorIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">{getSensorName(record.sensorType || 'manual')}</span>
                        </div>
                        {record.sensorReading && (
                          <Badge variant="outline">{record.sensorReading}</Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        <Badge className={intensityColors[record.intensity || 'medium']}>{record.intensity}</Badge>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {new Date(record.detectedAt).toLocaleDateString()}
                          </div>
                          {record.isInseminated && (
                            <Badge variant="secondary" className="mt-1">Inseminated</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {record.symptoms && record.symptoms.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {record.symptoms.map(symptom => (
                          <Badge key={symptom} variant="outline" className="text-xs">
                            {symptom}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {record.notes && (
                      <p className="mt-3 text-sm text-muted-foreground">{record.notes}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Heat Record Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Heat Detection</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Cow Selection */}
            <div className="space-y-2">
              <Label>Select Cow *</Label>
              <Select value={selectedCow} onValueChange={setSelectedCow}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a cow" />
                </SelectTrigger>
                <SelectContent>
                  {cows.map(cow => (
                    <SelectItem key={cow.id} value={cow.id}>
                      {cow.name} ({cow.tagNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {cows.length === 0 && (
                <p className="text-xs text-muted-foreground">Add cows first in the Cows section</p>
              )}
            </div>

            {/* Sensor Type */}
            <div className="space-y-2">
              <Label>Detection Method</Label>
              <Select value={sensorType} onValueChange={setSensorType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SENSOR_TYPES.map(sensor => (
                    <SelectItem key={sensor.id} value={sensor.id}>
                      <div className="flex items-center gap-2">
                        <sensor.icon className="h-4 w-4" />
                        {sensor.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {SENSOR_TYPES.find(s => s.id === sensorType)?.description}
              </p>
            </div>

            {/* Sensor Reading */}
            {sensorType !== 'manual' && (
              <div className="space-y-2">
                <Label>Sensor Reading (optional)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={sensorReading}
                  onChange={e => setSensorReading(e.target.value)}
                  placeholder="e.g., 39.5 for temperature"
                />
              </div>
            )}

            {/* Intensity */}
            <div className="space-y-2">
              <Label>Heat Intensity</Label>
              <Select value={intensity} onValueChange={setIntensity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Symptoms */}
            <div className="space-y-2">
              <Label>Observed Symptoms</Label>
              <div className="flex flex-wrap gap-2">
                {symptomOptions.map(symptom => (
                  <Badge
                    key={symptom}
                    variant={symptoms.includes(symptom) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleSymptom(symptom)}
                  >
                    {symptom}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Additional observations..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRecord} disabled={submitting || !selectedCow}>
              {submitting ? 'Saving...' : 'Save Record'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}