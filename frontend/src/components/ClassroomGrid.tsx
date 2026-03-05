import React, { useState, useEffect } from 'react';
import { Classroom, Teacher, Subject, classroomApi, teacherApi, subjectApi } from '../api/api';

interface ClassroomGridProps {
  onClassroomCreated: () => void;
}

const ClassroomGrid: React.FC<ClassroomGridProps> = ({ onClassroomCreated }) => {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    start_year: new Date().getFullYear(),
    class_teacher_id: 0,
    room: '',
    active: true,
    subject_ids: [] as number[]
  });

  const fetchClassrooms = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await classroomApi.getAll();
      setClassrooms(data);
    } catch (err: any) {
      setError('Fejl ved hentning af klasser');
      console.error('Error fetching classrooms:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const data = await teacherApi.getAll();
      setTeachers(data);
    } catch (err: any) {
      console.error('Error fetching teachers:', err);
    }
  };

  const fetchSubjects = async () => {
    try {
      const data = await subjectApi.getAll();
      setSubjects(data);
    } catch (err: any) {
      console.error('Error fetching subjects:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Er du sikker på, at du vil slette denne klasse?')) {
      return;
    }
    
    try {
      await classroomApi.delete(id);
      setClassrooms(classrooms.filter(classroom => classroom.id !== id));
    } catch (err: any) {
      setError('Fejl ved sletning af klasse');
      console.error('Error deleting classroom:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await classroomApi.create(formData);
      setFormData({
        name: '',
        start_year: new Date().getFullYear(),
        class_teacher_id: 0,
        room: '',
        active: true,
        subject_ids: []
      });
      setShowForm(false);
      fetchClassrooms();
      onClassroomCreated();
    } catch (err: any) {
      setError('Fejl ved oprettelse af klasse');
      console.error('Error creating classroom:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassrooms();
    fetchTeachers();
    fetchSubjects();
  }, []);

  const calculateCurrentGrade = (startYear: number) => {
    const currentYear = new Date().getFullYear();
    const yearsInSchool = currentYear - startYear;
    return `${yearsInSchool}. klasse`;
  };

  const getTeacherName = (teacherId: number | undefined) => {
    if (!teacherId) return 'Ikke tildelt';
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher ? `${teacher.fornavn} ${teacher.efternavn}` : 'Ukendt lærer';
  };

  if (loading) return <div className="loading">Henter klasser...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="classroom-grid-container">
      <div className="classroom-header">
        <h2>Klasser ({classrooms.length})</h2>
        <button 
          className="add-classroom-btn"
          onClick={() => setShowForm(!showForm)}
        >
          + Tilføj klasse
        </button>
      </div>

      {showForm && (
        <div className="classroom-form">
          <h3>Opret ny klasse</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <input 
                type="text" 
                placeholder="Klassenavn (f.eks. 3.A)" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
              <input 
                type="number" 
                placeholder="Startår (f.eks. 2020)" 
                value={formData.start_year}
                onChange={(e) => setFormData({...formData, start_year: parseInt(e.target.value)})}
                required
              />
            </div>
            <div className="form-row">
              <input 
                type="text" 
                placeholder="Klasselokale (f.eks. Rum 101)" 
                value={formData.room}
                onChange={(e) => setFormData({...formData, room: e.target.value})}
              />
              <select 
                value={formData.class_teacher_id}
                onChange={(e) => setFormData({...formData, class_teacher_id: parseInt(e.target.value)})}
              >
                <option value="0">Ingen klasselærer</option>
                {teachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.fornavn} {teacher.efternavn}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Fag:</label>
              <div className="checkbox-group">
                {subjects.map(subject => (
                  <label key={subject.id} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.subject_ids.includes(subject.id)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        if (checked) {
                          setFormData({...formData, subject_ids: [...formData.subject_ids, subject.id]});
                        } else {
                          setFormData({...formData, subject_ids: formData.subject_ids.filter(id => id !== subject.id)});
                        }
                      }}
                    />
                    <span>{subject.navn} ({subject.kort_navn})</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>
                Annuller
              </button>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Opretter...' : 'Opret klasse'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="classroom-grid">
        {classrooms.map((classroom) => (
          <div key={classroom.id} className={`classroom-card ${!classroom.active ? 'inactive' : ''}`}>
            <div className="classroom-header-info">
              <h3>{classroom.name}</h3>
              <button 
                className="delete-classroom-btn"
                onClick={() => handleDelete(classroom.id)}
                title="Slet klasse"
              >
                ×
              </button>
            </div>
            <div className="classroom-details">
              <p><strong>Klasse:</strong> {calculateCurrentGrade(classroom.start_year)}</p>
              <p><strong>Startår:</strong> {classroom.start_year}</p>
              <p><strong>Klasselærer:</strong> {getTeacherName(classroom.class_teacher_id)}</p>
              {classroom.room && <p><strong>Lokale:</strong> {classroom.room}</p>}
              <p><strong>Status:</strong> {classroom.active ? 'Aktiv' : 'Inaktiv'}</p>
              {classroom.subject_ids && classroom.subject_ids.length > 0 && (
                <div className="classroom-subjects">
                  <p><strong>Fag:</strong></p>
                  <div className="subject-tags">
                    {classroom.subject_ids.map(subjectId => {
                      const subject = subjects.find(s => s.id === subjectId);
                      return subject ? (
                        <span key={subjectId} className="subject-tag" style={{ backgroundColor: subject.farve }}>
                          {subject.kort_navn}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {classrooms.length === 0 && (
          <div className="no-classrooms">
            <p>Ingen klasser fundet</p>
            <p>Klik på "+ Tilføj klasse" for at oprette den første klasse</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassroomGrid;
