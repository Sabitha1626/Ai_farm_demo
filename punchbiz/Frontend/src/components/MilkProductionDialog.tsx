import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Plus, Milk, Calendar, TrendingUp } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MilkRecord {
  _id: string;
  recordedAt: string;
  quantityLiters: number;
  qualityGrade: string | null;
  fatPercentage: number | null;
  proteinPercentage: number | null;
  sensorId: string | null;
  isAutomatic: boolean;
}

interface MilkProductionDialogProps {
  cowId: string;
  cowName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MilkProductionDialog({ cowId, cowName, open, onOpenChange }: MilkProductionDialogProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [records, setRecords] = useState<MilkRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    quantityLiters: '',
    qualityGrade: 'A',
    fatPercentage: '',
    proteinPercentage: '',
  });

  useEffect(() => {
    if (open && cowId) {
      fetchRecords();
    }
  }, [open, cowId]);

  async function fetchRecords() {
    setLoading(true);
    try {
      const { data } = await api.get(`/milk?cowId=${cowId}`);
      setRecords(data || []);
    } catch (error) {
      console.error('Failed to load milk records:', error);
      toast.error(t('failedLoadMilk'));
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    try {
      const payload = {
        userId: user.id,
        cowId: cowId,
        quantityLiters: parseFloat(formData.quantityLiters),
        qualityGrade: formData.qualityGrade,
        fatPercentage: formData.fatPercentage ? parseFloat(formData.fatPercentage) : null,
        proteinPercentage: formData.proteinPercentage ? parseFloat(formData.proteinPercentage) : null,
        isAutomatic: false,
      };

      await api.post('/milk', payload);
      toast.success(t('milkRecordAdded'));
      setShowForm(false);
      resetForm();
      fetchRecords();
    } catch (error) {
      console.error('Failed to add milk record:', error);
      toast.error(t('failedAddMilk'));
    }
  }

  function resetForm() {
    setFormData({
      quantityLiters: '',
      qualityGrade: 'A',
      fatPercentage: '',
      proteinPercentage: '',
    });
  }

  // Calculate statistics
  const totalLiters = records.reduce((sum, r) => sum + Number(r.quantityLiters), 0);
  const avgLiters = records.length > 0 ? totalLiters / records.length : 0;
  const todayRecords = records.filter(r => {
    const recordDate = new Date(r.recordedAt);
    return recordDate >= startOfDay(new Date()) && recordDate <= endOfDay(new Date());
  });
  const todayTotal = todayRecords.reduce((sum, r) => sum + Number(r.quantityLiters), 0);

  // Prepare chart data
  const chartData = [...records]
    .reverse()
    .slice(-14)
    .map(r => ({
      date: format(new Date(r.recordedAt), 'MMM d'),
      liters: Number(r.quantityLiters),
    }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Milk className="h-5 w-5" />
            {t('milkProductionTitle')} - {cowName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-blue-500/10 text-center">
              <p className="text-2xl font-bold text-blue-500">{todayTotal.toFixed(1)}L</p>
              <p className="text-xs text-muted-foreground">{t('today')}</p>
            </div>
            <div className="p-4 rounded-lg bg-green-500/10 text-center">
              <p className="text-2xl font-bold text-green-500">{avgLiters.toFixed(1)}L</p>
              <p className="text-xs text-muted-foreground">{t('avgSession')}</p>
            </div>
            <div className="p-4 rounded-lg bg-purple-500/10 text-center">
              <p className="text-2xl font-bold text-purple-500">{totalLiters.toFixed(1)}L</p>
              <p className="text-xs text-muted-foreground">{t('thirtyDayTotalLabel')}</p>
            </div>
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <div className="h-48 p-4 border rounded-lg">
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                {t('productionTrend')}
              </p>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="liters" stroke="hsl(220, 80%, 60%)" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {!showForm && (
            <Button onClick={() => setShowForm(true)} variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              {t('recordManualEntry')}
            </Button>
          )}

          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-secondary/20">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('quantityLiters')} *</Label>
                  <Input
                    type="number"
                    step="0.1"
                    required
                    value={formData.quantityLiters}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantityLiters: e.target.value }))}
                    placeholder="e.g., 25.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('qualityGrade')}</Label>
                  <Input
                    value={formData.qualityGrade}
                    onChange={(e) => setFormData(prev => ({ ...prev, qualityGrade: e.target.value }))}
                    placeholder="A, B, C"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('fatPercentage')}</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.fatPercentage}
                    onChange={(e) => setFormData(prev => ({ ...prev, fatPercentage: e.target.value }))}
                    placeholder="e.g., 3.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('proteinPercentage')}</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.proteinPercentage}
                    onChange={(e) => setFormData(prev => ({ ...prev, proteinPercentage: e.target.value }))}
                    placeholder="e.g., 3.2"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">{t('saveRecord')}</Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>
                  {t('cancel')}
                </Button>
              </div>
            </form>
          )}

          <ScrollArea className="h-[200px]">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse h-12 bg-secondary/50 rounded" />
                ))}
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Milk className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t('noMilkRecords')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {records.map(record => (
                  <div key={record._id} className="p-3 border rounded-lg bg-card flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Milk className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-medium">{Number(record.quantityLiters).toFixed(1)} {t('liters')}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(record.recordedAt), 'MMM d, HH:mm')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {record.qualityGrade && (
                        <Badge variant="outline">{t('grade')} {record.qualityGrade}</Badge>
                      )}
                      {record.isAutomatic && (
                        <Badge className="bg-green-500">{t('auto')}</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}