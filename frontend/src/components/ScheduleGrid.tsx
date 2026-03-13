import React, { useState, useEffect } from 'react';
import { scheduleApi, ScheduleData, Lesson, Classroom, TimeSlot } from '../api/api';

interface ScheduleGridProps {
  // Props can be empty now since we fetch data internally
}

const ScheduleGrid: React.FC<ScheduleGridProps> = () => {
  const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch schedule data from API
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        const data = await scheduleApi.generate();
        setScheduleData(data);
        
        // Auto-select first classroom if available
        if (data.classrooms && data.classrooms.length > 0) {
          setSelectedClassroom(data.classrooms[0]);
        }
      } catch (err: any) {
        setError('Fejl ved generering af skema: ' + (err.message || 'Ukendt fejl'));
        console.error('Error fetching schedule:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, []);

  // Group timeslots by day
  const days = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag'];
  
  // Get unique time slots for rows
  const uniqueTimes = scheduleData?.timeslots 
    ? Array.from(new Set(scheduleData.timeslots.map(ts => `${ts.start_time}-${ts.end_time}`)))
    : [];

  // Get lessons for selected classroom
  const classroomLessons = selectedClassroom && scheduleData?.lessons
    ? scheduleData.lessons.filter(l => l.classroom?.id === selectedClassroom.id)
    : [];

  // Find lesson for a specific day and time
  const getLesson = (dayIndex: number, timeSlot: string) => {
    if (!scheduleData?.timeslots) return null;
    
    const [startTime] = timeSlot.split('-');
    const timeslot = scheduleData.timeslots.find(ts => 
      ts.day_of_week === dayIndex && 
      ts.start_time === startTime
    );
    
    if (!timeslot) return null;
    
    return classroomLessons.find(l => l.timeslot?.id === timeslot.id);
  };

  if (loading) {
    return (
      <div className="schedule-grid-container">
        <div className="loading">Genererer skema...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="schedule-grid-container">
        <div className="error">{error}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="retry-button"
        >
          Prøv igen
        </button>
      </div>
    );
  }

  if (!scheduleData || !scheduleData.classrooms || scheduleData.classrooms.length === 0) {
    return (
      <div className="schedule-grid-container">
        <div className="no-data">
          <p>Ingen klasser tilgængelige</p>
          <p>Tilføj klasser først for at generere skema</p>
        </div>
      </div>
    );
  }

  return (
    <div className="schedule-grid-container">
      <div className="schedule-header">
        <h3>Skema</h3>
        <p className="schedule-info">
          Genereret {new Date(scheduleData.generated_at).toLocaleString('da-DK')} | 
          {scheduleData.total_lessons} lektioner
        </p>
      </div>

      <div className="classroom-selector">
        <h4>Vælg klasse:</h4>
        <div className="classroom-tabs">
          {scheduleData.classrooms.map(classroom => (
            <button
              key={classroom.id}
              className={`classroom-tab ${selectedClassroom?.id === classroom.id ? 'active' : ''}`}
              onClick={() => setSelectedClassroom(classroom)}
            >
              {classroom.name}
            </button>
          ))}
        </div>
      </div>

      {selectedClassroom && (
        <div className="schedule-table-wrapper">
          <h4>Skema for {selectedClassroom.name}</h4>
          <table className="schedule-table">
            <thead>
              <tr>
                <th className="time-header">Tid</th>
                {days.map(day => (
                  <th key={day} className="day-header">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {uniqueTimes.map(timeSlot => (
                <tr key={timeSlot}>
                  <td className="time-cell">{timeSlot.replace('-', ' - ')}</td>
                  {days.map((_, dayIndex) => {
                    const lesson = getLesson(dayIndex, timeSlot);
                    return (
                      <td key={dayIndex} className="lesson-cell">
                        {lesson ? (
                          <div 
                            className="lesson-content"
                            style={{ backgroundColor: lesson.subject?.farve || '#e3f2fd' }}
                          >
                            <div className="lesson-subject">{lesson.subject?.navn || '?'}</div>
                            <div className="lesson-teacher">
                              {lesson.teacher?.fornavn?.[0]}{lesson.teacher?.efternavn?.[0]}
                            </div>
                            <div className="lesson-room">{lesson.room?.name || '?'}</div>
                          </div>
                        ) : (
                          <div className="empty-lesson">-</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="schedule-legend">
        <h4>Forklaring:</h4>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#e3f2fd' }}></span>
            <span>Skema viser fag, lærer (initialer) og lokale</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleGrid;
