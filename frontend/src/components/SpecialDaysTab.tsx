import React, { useState, useEffect } from 'react';
import { SpecialDay, SpecialDayCreate, Teacher, specialDayApi, teacherApi } from '../api/api';

const SpecialDaysTab: React.FC = () => {
  const [specialDays, setSpecialDays] = useState<SpecialDay[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTeachers, setSelectedTeachers] = useState<Set<number>>(new Set());

  const [formData, setFormData] = useState<SpecialDayCreate>({
    date: '',
    name: '',
    start_time: '',
    end_time: '',
    description: '',
    active: true
  });

  useEffect(() => {
    fetchSpecialDays();
    fetchTeachers();
  }, []);

  const fetchSpecialDays = async () => {
    try {
      setLoading(true);
      const data = await specialDayApi.getAll();
      setSpecialDays(data);
      setError('');
    } catch (err: any) {
      setError('Fejl ved hentning af specielle dage');
      console.error('Error fetching special days:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const data = await teacherApi.getAll();
      setTeachers(data.filter(t => t.aktiv));
    } catch (err: any) {
      console.error('Error fetching teachers:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const created = await specialDayApi.create(formData);
      
      // Add selected teachers to the special day
      for (const teacherId of Array.from(selectedTeachers)) {
        await specialDayApi.addTeacherToDay(created.id, teacherId);
      }
      
      // Reset form
      setFormData({
        date: '',
        name: '',
        start_time: '',
        end_time: '',
        description: '',
        active: true
      });
      setSelectedTeachers(new Set());
      setShowForm(false);
      
      // Refresh data
      fetchSpecialDays();
    } catch (err: any) {
      setError('Fejl ved oprettelse af speciel dag');
      console.error('Error creating special day:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Er du sikker på du vil slette denne specielle dag?')) {
      return;
    }

    try {
      await specialDayApi.delete(id);
      fetchSpecialDays();
    } catch (err: any) {
      setError('Fejl ved sletning af speciel dag');
      console.error('Error deleting special day:', err);
    }
  };

  const handleTeacherToggle = (teacherId: number) => {
    setSelectedTeachers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(teacherId)) {
        newSet.delete(teacherId);
      } else {
        newSet.add(teacherId);
      }
      return newSet;
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('da-DK', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    return timeStr.slice(0, 5);
  };

  if (loading && specialDays.length === 0) {
    return <div className="loading">Indlæser specielle dage...</div>;
  }

  return (
    <div className="special-days-container">
      <div className="special-days-header">
        <h2>Specielle Dage</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Skjul formular' : 'Opret speciel dag'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <div className="special-day-form">
          <h3>Opret ny speciel dag</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Dato:</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="form-group">
                <label>Navn:</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="f.eks. Forældremøde, Workshop, Eksamensdag"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Start tid:</label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Slut tid:</label>
                <input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Beskrivelse:</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Valgfri beskrivelse af dagen..."
                  rows={3}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Vælg lærere:</label>
                <div className="teacher-checkboxes">
                  {teachers.map(teacher => (
                    <label key={teacher.id} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={selectedTeachers.has(teacher.id)}
                        onChange={() => handleTeacherToggle(teacher.id)}
                      />
                      {teacher.fornavn} {teacher.efternavn}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Opretter...' : 'Opret speciel dag'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                Annuller
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="special-days-list">
        {specialDays.length === 0 ? (
          <div className="no-data">
            Ingen specielle dage oprettet endnu. Klik på "Opret speciel dag" for at komme i gang.
          </div>
        ) : (
          specialDays
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map(specialDay => (
              <div key={specialDay.id} className="special-day-item">
                <div className="special-day-info">
                  <h4>{specialDay.name}</h4>
                  <p className="special-day-date">{formatDate(specialDay.date)}</p>
                  {specialDay.start_time && specialDay.end_time && (
                    <p className="special-day-time">
                      {formatTime(specialDay.start_time)} - {formatTime(specialDay.end_time)}
                    </p>
                  )}
                  {specialDay.description && (
                    <p className="special-day-description">{specialDay.description}</p>
                  )}
                  <div className="special-day-teachers">
                    <strong>Lærere:</strong> {specialDay.teachers.map(t => `${t.fornavn} ${t.efternavn}`).join(', ') || 'Ingen valgt'}
                  </div>
                </div>
                <div className="special-day-actions">
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(specialDay.id)}
                    title="Slet speciel dag"
                  >
                    Slet
                  </button>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
};

export default SpecialDaysTab;
