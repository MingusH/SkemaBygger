import React, { useState, useEffect, useMemo } from 'react';
import { Teacher, teacherAvailabilityApi, TimeSlot, TeacherAvailability, TeacherAvailabilityCreate, timeslotApi } from '../api/api';
import SpecialDaysTab from './SpecialDaysTab';

interface TeacherAvailabilityModalProps {
  teacher: Teacher;
  onClose: () => void;
}

type TabType = 'schedule' | 'dates' | 'special';

const TeacherAvailabilityModal: React.FC<TeacherAvailabilityModalProps> = ({ teacher, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('schedule');
  
  // Schedule tab state
  const [timeslots, setTimeslots] = useState<TimeSlot[]>([]);
  const [availability, setAvailability] = useState<TeacherAvailability[]>([]);
  const [unavailableTimeslots, setUnavailableTimeslots] = useState<Set<number>>(new Set());
  const [loadingTimeslots, setLoadingTimeslots] = useState<Set<number>>(new Set());
  
  // Dates tab state
  const [specificDates, setSpecificDates] = useState<TeacherAvailability[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [reason, setReason] = useState('');
  const [addingDate, setAddingDate] = useState(false);
  
  const [error, setError] = useState('');

  const DAYS = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag'];

  // Group timeslots by time for grid display
  const groupedTimeslots = useMemo(() => {
    const grouped: { [key: string]: { [day: number]: TimeSlot } } = {};
    
    timeslots.forEach(ts => {
      const timeKey = `${ts.start_time}-${ts.end_time}`;
      if (!grouped[timeKey]) {
        grouped[timeKey] = {} as { [day: number]: TimeSlot };
      }
      grouped[timeKey][ts.day_of_week] = ts;
    });
    
    return grouped;
  }, [timeslots]);

  const sortedTimeKeys = useMemo(() => {
    return Object.keys(groupedTimeslots).sort();
  }, [groupedTimeslots]);

  useEffect(() => {
    fetchTimeSlots();
    fetchAvailability();
  }, [teacher.id]);

  const fetchTimeSlots = async () => {
    try {
      const data = await timeslotApi.getAll();
      setTimeslots(data);
    } catch (err: any) {
      setError('Fejl ved hentning af tidsintervaller');
      console.error('Error fetching timeslots:', err);
    }
  };

  const fetchAvailability = async () => {
    try {
      const data = await teacherAvailabilityApi.getByTeacher(teacher.id);
      setAvailability(data);
      
      // Separate recurring and specific date unavailabilities
      const unavailableIds = new Set(
        data
          .filter(a => !a.available && a.date === null)
          .map(a => a.timeslot_id)
      );
      setUnavailableTimeslots(unavailableIds);
      
      // Filter specific date unavailabilities
      const dates = data.filter(a => a.date !== null && !a.available);
      setSpecificDates(dates);
    } catch (err: any) {
      setError('Fejl ved hentning af tilgængelighed');
      console.error('Error fetching availability:', err);
    }
  };

  const toggleAvailability = async (timeslotId: number) => {
    if (loadingTimeslots.has(timeslotId)) return;
    
    const isCurrentlyUnavailable = unavailableTimeslots.has(timeslotId);
    
    setLoadingTimeslots(prev => new Set(prev).add(timeslotId));
    
    try {
      if (isCurrentlyUnavailable) {
        const existingRecord = availability.find(a => a.timeslot_id === timeslotId && !a.available && a.date === null);
        if (existingRecord) {
          await teacherAvailabilityApi.delete(existingRecord.id);
          setUnavailableTimeslots(prev => {
            const newSet = new Set(prev);
            newSet.delete(timeslotId);
            return newSet;
          });
          setAvailability(prev => prev.filter(a => a.id !== existingRecord.id));
        }
      } else {
        const timeslot = timeslots.find(ts => ts.id === timeslotId);
        if (timeslot) {
          const newAvailability: TeacherAvailabilityCreate = {
            teacher_id: teacher.id,
            timeslot_id: timeslotId,
            day_of_week: timeslot.day_of_week,
            date: undefined,
            available: false,
            reason: 'Utilgængelig'
          };
          
          const created = await teacherAvailabilityApi.create(newAvailability);
          setUnavailableTimeslots(prev => new Set(prev).add(timeslotId));
          setAvailability(prev => [...prev, created]);
        }
      }
    } catch (err: any) {
      setError('Fejl ved opdatering af tilgængelighed');
      console.error('Error updating availability:', err);
    } finally {
      setLoadingTimeslots(prev => {
        const newSet = new Set(prev);
        newSet.delete(timeslotId);
        return newSet;
      });
    }
  };

  const handleAddSpecificDate = async () => {
    if (!selectedDate) {
      setError('Vælg venligst en dato');
      return;
    }

    setAddingDate(true);
    setError('');

    try {
      const newAvailability: TeacherAvailabilityCreate = {
        teacher_id: teacher.id,
        timeslot_id: undefined,
        day_of_week: undefined,
        date: selectedDate,
        available: false,
        reason: reason || 'Fravær'
      };

      const created = await teacherAvailabilityApi.create(newAvailability);
      setSpecificDates(prev => [...prev, created]);
      setAvailability(prev => [...prev, created]);
      
      // Reset form
      setSelectedDate('');
      setReason('');
    } catch (err: any) {
      setError('Fejl ved tilføjelse af fraværsdato');
      console.error('Error adding specific date:', err);
    } finally {
      setAddingDate(false);
    }
  };

  const handleDeleteSpecificDate = async (id: number) => {
    try {
      await teacherAvailabilityApi.delete(id);
      setSpecificDates(prev => prev.filter(d => d.id !== id));
      setAvailability(prev => prev.filter(a => a.id !== id));
    } catch (err: any) {
      setError('Fejl ved sletning af fraværsdato');
      console.error('Error deleting specific date:', err);
    }
  };

  const getGridCellClass = (timeslotId: number) => {
    return unavailableTimeslots.has(timeslotId) ? 'unavailable-cell' : 'available-cell';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('da-DK', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="availability-overlay" onClick={onClose}>
      <div className="availability-modal" onClick={(e) => e.stopPropagation()}>
        <div className="availability-header">
          <h2>Tilgængelighed for {teacher.fornavn} {teacher.efternavn}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="availability-tabs">
          <button 
            className={`tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
            onClick={() => setActiveTab('schedule')}
          >
            Fast skema
          </button>
          <button 
            className={`tab-btn ${activeTab === 'dates' ? 'active' : ''}`}
            onClick={() => setActiveTab('dates')}
          >
            Specifikke datoer
          </button>
          <button 
            className={`tab-btn ${activeTab === 'special' ? 'active' : ''}`}
            onClick={() => setActiveTab('special')}
          >
            Specielle dage
          </button>
        </div>

        <div className="availability-content">
          {activeTab === 'schedule' && (
            <>
              <h3>Markér utilgængelige tider (klik for at skifte)</h3>
              
              <div className="schedule-grid">
                <div className="grid-header">
                  <div className="time-header">Tid</div>
                  {DAYS.map(day => (
                    <div key={day} className="day-header">{day}</div>
                  ))}
                </div>

                {sortedTimeKeys.map(timeKey => {
                  const [startTime, endTime] = timeKey.split('-');
                  return (
                    <div key={timeKey} className="grid-row">
                      <div className="time-cell">
                        {startTime.slice(0, 5)} - {endTime.slice(0, 5)}
                      </div>
                      {DAYS.map((day, dayIndex) => {
                        const dayTimeslot = groupedTimeslots[timeKey]?.[dayIndex];
                        const isLoading = dayTimeslot && loadingTimeslots.has(dayTimeslot.id);
                        const isUnavailable = dayTimeslot && unavailableTimeslots.has(dayTimeslot.id);
                        return (
                          <div 
                            key={`${timeKey}-${dayIndex}`}
                            className={`grid-cell ${dayTimeslot ? (isUnavailable ? 'unavailable-cell' : 'available-cell') : 'empty-cell'} ${isLoading ? 'loading-cell' : ''}`}
                            onClick={() => dayTimeslot && !isLoading && toggleAvailability(dayTimeslot.id)}
                            title={dayTimeslot ? `${day} ${startTime}-${endTime}` : `${day} - Ingen modul`}
                          >
                            {isLoading ? '⏳' : (dayTimeslot ? (isUnavailable ? '×' : '') : '-')}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              <div className="grid-legend">
                <div className="legend-item">
                  <div className="legend-cell available-cell"></div>
                  <span>Tilgængelig</span>
                </div>
                <div className="legend-item">
                  <div className="legend-cell unavailable-cell"></div>
                  <span>Utilgængelig</span>
                </div>
              </div>
            </>
          )}

          {activeTab === 'dates' && (
            <div className="dates-tab">
              <h3>Tilføj fraværsdato</h3>
              
              <div className="date-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Dato:</label>
                    <input 
                      type="date" 
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="form-group form-group-large">
                    <label>Årsag (valgfri):</label>
                    <input 
                      type="text" 
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="f.eks. Sygdom, Ferie, Kursus..."
                    />
                  </div>
                </div>
                <button 
                  className="add-date-btn"
                  onClick={handleAddSpecificDate}
                  disabled={addingDate || !selectedDate}
                >
                  {addingDate ? 'Tilføjer...' : 'Tilføj fravær'}
                </button>
              </div>

              <h3>Registreret fravær</h3>
              
              {specificDates.length === 0 ? (
                <p className="no-dates">Ingen specifikke fraværsdatoer registreret.</p>
              ) : (
                <div className="dates-list">
                  {specificDates
                    .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime())
                    .map(dateEntry => (
                      <div key={dateEntry.id} className="date-item">
                        <div className="date-info">
                          <span className="date-value">{formatDate(dateEntry.date!)}</span>
                          {dateEntry.reason && (
                            <span className="date-reason"> - {dateEntry.reason}</span>
                          )}
                        </div>
                        <button 
                          className="delete-date-btn"
                          onClick={() => handleDeleteSpecificDate(dateEntry.id)}
                          title="Slet fraværsdato"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'special' && (
            <SpecialDaysTab />
          )}

          <div className="grid-actions">
            <button 
              type="button" 
              className="grid-action-btn"
              onClick={onClose}
            >
              Luk
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherAvailabilityModal;
