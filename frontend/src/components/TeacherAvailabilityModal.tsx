import React, { useState, useEffect, useMemo } from 'react';
import { Teacher, teacherAvailabilityApi, TimeSlot, TeacherAvailability, TeacherAvailabilityCreate, timeslotApi } from '../api/api';

interface TeacherAvailabilityModalProps {
  teacher: Teacher;
  onClose: () => void;
}

const TeacherAvailabilityModal: React.FC<TeacherAvailabilityModalProps> = ({ teacher, onClose }) => {
  const [timeslots, setTimeslots] = useState<TimeSlot[]>([]);
  const [availability, setAvailability] = useState<TeacherAvailability[]>([]);
  const [unavailableTimeslots, setUnavailableTimeslots] = useState<Set<number>>(new Set());
  const [loadingTimeslots, setLoadingTimeslots] = useState<Set<number>>(new Set());
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
      
      // Set unavailable timeslots (only recurring ones with date = null)
      const unavailableIds = new Set(
        data
          .filter(a => !a.available && a.date === null)
          .map(a => a.timeslot_id)
      );
      setUnavailableTimeslots(unavailableIds);
    } catch (err: any) {
      setError('Fejl ved hentning af tilgængelighed');
      console.error('Error fetching availability:', err);
    }
  };

  const toggleAvailability = async (timeslotId: number) => {
    // Forhindre dobbelt-klik
    if (loadingTimeslots.has(timeslotId)) return;
    
    const isCurrentlyUnavailable = unavailableTimeslots.has(timeslotId);
    
    // Sæt loading state
    setLoadingTimeslots(prev => new Set(prev).add(timeslotId));
    
    try {
      if (isCurrentlyUnavailable) {
        // Remove unavailability
        const existingRecord = availability.find(a => a.timeslot_id === timeslotId && !a.available);
        if (existingRecord) {
          await teacherAvailabilityApi.delete(existingRecord.id);
          setUnavailableTimeslots(prev => {
            const newSet = new Set(prev);
            newSet.delete(timeslotId);
            return newSet;
          });
          // Opdater availability state
          setAvailability(prev => prev.filter(a => a.id !== existingRecord.id));
        }
      } else {
        // Add unavailability
        const timeslot = timeslots.find(ts => ts.id === timeslotId);
        if (timeslot) {
          const newAvailability: TeacherAvailabilityCreate = {
            teacher_id: teacher.id,
            timeslot_id: timeslotId,
            day_of_week: timeslot.day_of_week,
            date: undefined, // recurring
            available: false,
            reason: 'Utilgængelig'
          };
          
          const created = await teacherAvailabilityApi.create(newAvailability);
          setUnavailableTimeslots(prev => new Set(prev).add(timeslotId));
          // Tilføj til availability state
          setAvailability(prev => [...prev, created]);
        }
      }
    } catch (err: any) {
      setError('Fejl ved opdatering af tilgængelighed');
      console.error('Error updating availability:', err);
    } finally {
      // Fjern loading state
      setLoadingTimeslots(prev => {
        const newSet = new Set(prev);
        newSet.delete(timeslotId);
        return newSet;
      });
    }
  };

  const getGridCellClass = (timeslotId: number) => {
    return unavailableTimeslots.has(timeslotId) ? 'unavailable-cell' : 'available-cell';
  };

  return (
    <div className="availability-overlay" onClick={onClose}>
      <div className="availability-modal" onClick={(e) => e.stopPropagation()}>
        <div className="availability-header">
          <h2>Tilgængelighed for {teacher.fornavn} {teacher.efternavn}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="availability-content">
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
