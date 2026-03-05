import React, { useState, useEffect } from 'react';
import { timeslotApi, TimeSlot, TimeSlotCreate } from '../api/api';

const DAYS = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag'];

const TimeSlotGrid: React.FC = () => {
  const [timeslots, setTimeslots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState<TimeSlotCreate>({
    start_time: '08:00',
    end_time: '08:45',
    day_of_week: 0,
    slot_number: 1,
    is_break: false,
    break_type: '',
    active: true
  });

  const fetchTimeSlots = async () => {
    try {
      setLoading(true);
      const data = await timeslotApi.getAll();
      setTimeslots(data);
      setError('');
    } catch (err: any) {
      setError('Fejl ved hentning af tidsintervaller');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeSlots();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await timeslotApi.create(formData);
      setFormData({
        start_time: '08:00',
        end_time: '08:45',
        day_of_week: 0,
        slot_number: 1,
        is_break: false,
        break_type: '',
        active: true
      });
      setShowForm(false);
      fetchTimeSlots();
    } catch (err: any) {
      setError('Fejl ved oprettelse af tidsinterval');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await timeslotApi.delete(id);
      fetchTimeSlots();
    } catch (err: any) {
      setError('Fejl ved sletning af tidsinterval');
      console.error(err);
    }
  };

  // Group timeslots by time for grid display
  const getTimeSlotsByTime = () => {
    const grouped: { [key: string]: { [day: number]: TimeSlot } } = {};
    
    timeslots.forEach(timeslot => {
      const timeKey = `${timeslot.start_time}-${timeslot.end_time}`;
      if (!grouped[timeKey]) {
        grouped[timeKey] = {} as { [day: number]: TimeSlot };
      }
      grouped[timeKey][timeslot.day_of_week] = timeslot;
    });
    
    return grouped;
  };

  const timeSlotsByTime = getTimeSlotsByTime();
  const sortedTimes = Object.keys(timeSlotsByTime).sort();

  if (loading && timeslots.length === 0) {
    return <div className="loading">Indlæser tidsintervaller...</div>;
  }

  return (
    <div className="timeslot-container">
      <div className="timeslot-header">
        <h2>Tidsintervaller</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Skjul formular' : 'Tilføj tidsinterval'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <div className="timeslot-form">
          <h3>Opret nyt tidsinterval</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Start tid:</label>
                <input
                  type="time"
                  step="60"
                  value={formData.start_time}
                  onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Slut tid:</label>
                <input
                  type="time"
                  step="60"
                  value={formData.end_time}
                  onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Ugedag:</label>
                <select
                  value={formData.day_of_week}
                  onChange={(e) => setFormData({...formData, day_of_week: parseInt(e.target.value)})}
                >
                  {DAYS.map((day, index) => (
                    <option key={day} value={index}>{day}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Modul nr:</label>
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={formData.slot_number}
                  onChange={(e) => setFormData({...formData, slot_number: parseInt(e.target.value)})}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.is_break}
                    onChange={(e) => setFormData({...formData, is_break: e.target.checked})}
                  />
                  Pause
                </label>
              </div>
              
              {formData.is_break && (
                <div className="form-group">
                  <label>Pause type:</label>
                  <select
                    value={formData.break_type || ''}
                    onChange={(e) => setFormData({...formData, break_type: e.target.value})}
                  >
                    <option value="">Vælg type</option>
                    <option value="frokost">Frokost</option>
                    <option value="lille_pause">Lille pause</option>
                  </select>
                </div>
              )}
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Opretter...' : 'Opret tidsinterval'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                Annuller
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="timeslot-grid">
        <div className="grid-header">
          <div className="time-header">Tid</div>
          {DAYS.map(day => (
            <div key={day} className="day-header">{day}</div>
          ))}
        </div>

        {sortedTimes.map(timeKey => {
          const [startTime, endTime] = timeKey.split('-');
          return (
            <div key={timeKey} className="grid-row">
              <div className="time-cell">
                {startTime} - {endTime}
              </div>
              {DAYS.map((day, dayIndex) => {
                const timeslot = timeSlotsByTime[timeKey][dayIndex];
                return (
                  <div key={`${timeKey}-${dayIndex}`} className="slot-cell">
                    {timeslot ? (
                      <div className={`timeslot-item ${timeslot.is_break ? 'break' : 'lesson'}`}>
                        <span className="timeslot-info">
                          Modul {timeslot.slot_number}
                          {timeslot.is_break && timeslot.break_type && (
                            <span className="break-type"> ({timeslot.break_type})</span>
                          )}
                        </span>
                        <button 
                          className="delete-btn"
                          onClick={() => handleDelete(timeslot.id)}
                          title="Slet tidsinterval"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="empty-slot"></div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}

        {sortedTimes.length === 0 && (
          <div className="empty-grid">
            <div className="empty-message">
              Ingen tidsintervaller oprettet endnu. Klik på "Tilføj tidsinterval" for at komme i gang.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeSlotGrid;
