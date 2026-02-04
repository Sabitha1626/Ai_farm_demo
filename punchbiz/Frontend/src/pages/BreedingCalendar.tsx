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
import { Calendar } from '@/components/ui/calendar';
import {
  CalendarDays,
  Plus,
  Thermometer,
  Baby,
  Syringe,
  Clock,
  ChevronLeft,
  ChevronRight,
  Bell
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  addDays
} from 'date-fns';

interface Cow {
  id: string;
  name: string;
  tag_number: string;
}

interface BreedingEvent {
  id: string;
  cow_id: string;
  event_type: string;
  event_date: string;
  title: string;
  description: string | null;
  status: string;
  cows?: {
    name: string;
    tag_number: string;
  };
}

interface HeatRecord {
  id: string;
  cow_id: string;
  detected_at: string;
  intensity: string;
  cows?: {
    name: string;
    tag_number: string;
  };
}

const getEventTypes = (t: (key: string) => string) => [
  { id: 'heat_detected', name: t('heatDetected') || 'Heat Detected', icon: Thermometer, color: 'bg-red-500' },
  { id: 'insemination', name: t('insemination') || 'Insemination', icon: Syringe, color: 'bg-blue-500' },
  { id: 'pregnancy_check', name: t('pregnancyCheckEvent') || 'Pregnancy Check', icon: Clock, color: 'bg-purple-500' },
  { id: 'expected_calving', name: t('expectedCalving') || 'Expected Calving', icon: Baby, color: 'bg-green-500' },
  { id: 'actual_calving', name: t('actualCalving') || 'Actual Calving', icon: Baby, color: 'bg-emerald-500' },
];

export default function BreedingCalendar() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const EVENT_TYPES = getEventTypes(t);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<BreedingEvent[]>([]);
  const [heatRecords, setHeatRecords] = useState<HeatRecord[]>([]);
  const [cows, setCows] = useState<Cow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [selectedCow, setSelectedCow] = useState('');
  const [eventType, setEventType] = useState('insemination');
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const monthStart = startOfMonth(currentMonth).toISOString();
      const monthEnd = endOfMonth(currentMonth).toISOString();

      const [eventsResult, heatResult, cowsResult] = await Promise.all([
        api.get(`/events/breeding?startDate=${monthStart}&endDate=${monthEnd}`),
        api.get(`/events/heat?startDate=${monthStart}&endDate=${monthEnd}`),
        api.get('/cows'),
      ]);

      setEvents(eventsResult.data.map((e: any) => ({
        id: e._id,
        cow_id: e.cowId?._id || e.cowId,
        event_type: e.type,
        event_date: e.date,
        title: e.notes || 'Breeding Event', // Use notes as title if missing
        description: e.notes,
        status: e.status,
        cows: e.cowId ? {
          name: e.cowId.name,
          tag_number: e.cowId.tagNumber
        } : undefined
      })));

      setHeatRecords(heatResult.data.map((h: any) => ({
        id: h._id,
        cow_id: h.cowId?._id || h.cowId,
        detected_at: h.detectedAt,
        intensity: h.intensity || 'Normal',
        cows: h.cowId ? {
          name: h.cowId.name,
          tag_number: h.cowId.tagNumber
        } : undefined
      })));

      setCows(cowsResult.data.map((c: any) => ({
        id: c._id,
        name: c.name,
        tag_number: c.tagNumber
      })));
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, currentMonth]);

  const handleAddEvent = async () => {
    if (!user || !selectedCow || !selectedDate) {
      toast.error('Please fill in required fields');
      return;
    }

    setSubmitting(true);

    try {
      const typeInfo = EVENT_TYPES.find(e => e.id === eventType);
      const cowInfo = cows.find(c => c.id === selectedCow);

      const payload = {
        cowId: selectedCow,
        type: eventType === 'heat_detected' ? 'Heat Detection' :
          eventType === 'insemination' ? 'Insemination' :
            eventType === 'pregnancy_check' ? 'Pregnancy Check' :
              eventType === 'expected_calving' ? 'Calving' : 'Calving',
        date: selectedDate.toISOString(),
        notes: eventTitle || `${typeInfo?.name} - ${cowInfo?.name}`,
        status: 'Scheduled'
      };

      if (eventType === 'heat_detected') {
        await api.post('/events/heat', {
          cowId: selectedCow,
          detectedAt: selectedDate.toISOString(),
          intensity: 'Normal'
        });
      } else {
        await api.post('/events/breeding', payload);
      }

      toast.success('Event added successfully');
      setShowAddDialog(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error('Failed to add event');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedCow('');
    setEventType('insemination');
    setEventTitle('');
    setEventDescription('');
  };

  const getEventsForDate = (date: Date) => {
    const dayEvents = events.filter(e => isSameDay(new Date(e.event_date), date));
    const dayHeatRecords = heatRecords.filter(h => h.detected_at && isSameDay(new Date(h.detected_at), date));
    return { events: dayEvents, heatRecords: dayHeatRecords };
  };

  const getEventTypeInfo = (type: string) => {
    // Map backend type names back to local IDs if needed
    const mappedType = type === 'Heat Detection' ? 'heat_detected' :
      type === 'Insemination' ? 'insemination' :
        type === 'Pregnancy Check' ? 'pregnancy_check' :
          type === 'Calving' ? 'actual_calving' : type;

    return EVENT_TYPES.find(e => e.id === mappedType) || EVENT_TYPES[0];
  };

  const calculateOptimalBreeding = (heatDate: Date) => {
    return {
      start: addDays(heatDate, 0),
      end: addDays(heatDate, 1),
    };
  };

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : { events: [], heatRecords: [] };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              {t('breedingCalendar') || 'Breeding Calendar'}
            </h1>
            <p className="text-muted-foreground">
              {t('breedingCalendarDesc') || 'Track breeding events and optimal timing'}
            </p>
          </div>
          <Button variant="hero" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" /> {t('addEvent') || 'Add Event'}
          </Button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3">
          {EVENT_TYPES.map(type => (
            <div key={type.id} className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${type.color}`} />
              <span className="text-sm text-muted-foreground">{type.name}</span>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-2 shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                {format(currentMonth, 'MMMM yyyy')}
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse h-96 bg-secondary/50 rounded" />
              ) : (
                <div className="grid grid-cols-7 gap-1">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                      {day}
                    </div>
                  ))}
                  {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
                    <div key={`empty-${i}`} className="p-2" />
                  ))}
                  {daysInMonth.map(day => {
                    const { events: dayEvents, heatRecords: dayHeat } = getEventsForDate(day);
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isTodayLocal = isSameDay(day, new Date());

                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => setSelectedDate(day)}
                        className={`p-2 min-h-[80px] rounded-lg border transition-all text-left align-top ${isSelected
                          ? 'border-primary bg-primary/10'
                          : 'border-transparent hover:border-border hover:bg-secondary/50'
                          } ${isTodayLocal ? 'ring-2 ring-primary/30' : ''}`}
                      >
                        <div className={`text-sm font-medium ${isTodayLocal ? 'text-primary' : ''}`}>
                          {format(day, 'd')}
                        </div>
                        <div className="mt-1 space-y-0.5">
                          {dayHeat.slice(0, 2).map(heat => (
                            <div
                              key={heat.id}
                              className="text-[10px] px-1 py-0.5 rounded bg-red-500 text-white truncate"
                            >
                              🔥 {heat.cows?.name}
                            </div>
                          ))}
                          {dayEvents.slice(0, 2).map(event => {
                            const typeInfo = getEventTypeInfo(event.event_type);
                            return (
                              <div
                                key={event.id}
                                className={`text-[10px] px-1 py-0.5 rounded ${typeInfo.color} text-white truncate`}
                              >
                                {event.title}
                              </div>
                            );
                          })}
                          {(dayEvents.length + dayHeat.length) > 2 && (
                            <div className="text-[10px] text-muted-foreground">
                              +{dayEvents.length + dayHeat.length - 2} more
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Selected Date Details */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : t('selectADate')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedDateEvents.heatRecords.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                    {t('heatDetections') || 'Heat Detections'}
                  </h4>
                  {selectedDateEvents.heatRecords.map(heat => {
                    const optimal = calculateOptimalBreeding(new Date(heat.detected_at));
                    return (
                      <div key={heat.id} className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-2">
                        <div className="flex items-center gap-2">
                          <Thermometer className="h-4 w-4 text-red-500" />
                          <span className="font-medium text-sm">{heat.cows?.name}</span>
                          <Badge className="bg-red-500 text-[10px]">{heat.intensity}</Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {t('detected') || 'Detected'}: {format(new Date(heat.detected_at), 'h:mm a')}
                        </p>
                        <div className="mt-2 p-2 rounded bg-green-500/10 border border-green-500/20">
                          <p className="text-[10px] font-medium text-green-600">
                            {t('optimalBreedingWindow') || 'Optimal Breeding Window'}:
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {format(optimal.start, 'MMM d, h:mm a')} - {format(optimal.end, 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedDateEvents.events.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                    {t('scheduledEvents') || 'Scheduled Events'}
                  </h4>
                  {selectedDateEvents.events.map(event => {
                    const typeInfo = getEventTypeInfo(event.event_type);
                    const Icon = typeInfo.icon;
                    return (
                      <div key={event.id} className="p-3 rounded-lg bg-secondary/50 mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`h-6 w-6 rounded ${typeInfo.color} flex items-center justify-center`}>
                            <Icon className="h-3 w-3 text-white" />
                          </div>
                          <span className="font-medium text-sm">{event.title}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {event.cows?.name} ({event.cows?.tag_number})
                        </p>
                        {event.description && (
                          <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{event.description}</p>
                        )}
                        <Badge variant="outline" className="mt-2 capitalize text-[10px]">{event.status}</Badge>
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedDateEvents.events.length === 0 && selectedDateEvents.heatRecords.length === 0 && (
                <div className="text-center py-8">
                  <CalendarDays className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground text-sm">{t('noEventsOnDate') || 'No events on this date'}</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => setShowAddDialog(true)}>
                    <Plus className="h-3 w-3 mr-2" /> {t('addEvent') || 'Add Event'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Add Event Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('addBreedingEvent') || 'Add Breeding Event'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{t('selectCow') || 'Select Cow'} *</Label>
                <Select value={selectedCow} onValueChange={setSelectedCow}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('chooseCow') || 'Choose cow'} />
                  </SelectTrigger>
                  <SelectContent>
                    {cows.map(cow => (
                      <SelectItem key={cow.id} value={cow.id}>
                        {cow.name} ({cow.tag_number})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('eventType') || 'Event Type'}</Label>
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map(type => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('date') || 'Date'}</Label>
                <div className="border rounded-lg p-2 flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border shadow"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('title') || 'Title'} ({t('optional') || 'Optional'})</Label>
                <Input
                  value={eventTitle}
                  onChange={e => setEventTitle(e.target.value)}
                  placeholder={t('autoGeneratedIfEmpty') || 'Auto-generated if empty'}
                />
              </div>

              <div className="space-y-2">
                <Label>{t('description') || 'Description'} ({t('optional') || 'Optional'})</Label>
                <Textarea
                  value={eventDescription}
                  onChange={e => setEventDescription(e.target.value)}
                  placeholder={t('additionalNotes') || 'Additional notes'}
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                {t('cancel') || 'Cancel'}
              </Button>
              <Button onClick={handleAddEvent} disabled={submitting || !selectedCow || !selectedDate}>
                {submitting ? t('adding') || 'Adding...' : t('addEvent') || 'Add Event'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}