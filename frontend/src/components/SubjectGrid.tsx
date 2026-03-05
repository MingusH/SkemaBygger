import React, { useState, useEffect } from 'react';
import { Subject, Teacher, subjectApi, teacherApi } from '../api/api';

interface SubjectGridProps {
  onSubjectCreated: () => void;
}

const SubjectGrid: React.FC<SubjectGridProps> = ({ onSubjectCreated }) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    navn: '',
    kort_navn: '',
    teacher_ids: [] as number[],
    farve: '#007bff',
    aktiv: true
  });

  const fetchSubjects = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await subjectApi.getAll();
      setSubjects(data);
    } catch (err: any) {
      setError('Fejl ved hentning af fag');
      console.error('Error fetching subjects:', err);
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

  const handleDelete = async (id: number) => {
    if (!window.confirm('Er du sikker på, at du vil slette dette fag?')) {
      return;
    }
    
    try {
      await subjectApi.delete(id);
      setSubjects(subjects.filter(subject => subject.id !== id));
    } catch (err: any) {
      setError('Fejl ved sletning af fag');
      console.error('Error deleting subject:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await subjectApi.create(formData);
      setFormData({
        navn: '',
        kort_navn: '',
        teacher_ids: [],
        farve: '#007bff',
        aktiv: true
      });
      setShowForm(false);
      fetchSubjects();
      onSubjectCreated();
    } catch (err: any) {
      setError('Fejl ved oprettelse af fag');
      console.error('Error creating subject:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
    fetchTeachers();
  }, []);

  const getTeacherNames = (teacherIds: number[]) => {
    if (teacherIds.length === 0) return 'Ingen lærere tildelt';
    const teacherNames = teacherIds.map(id => {
      const teacher = teachers.find(t => t.id === id);
      return teacher ? `${teacher.fornavn} ${teacher.efternavn}` : 'Ukendt lærer';
    });
    return teacherNames.join(', ');
  };

  if (loading) return <div className="loading">Henter fag...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="subject-grid-container">
      <div className="subject-header">
        <h2>Fag ({subjects.length})</h2>
        <button 
          className="add-subject-btn"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '−' : '+ Tilføj fag'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="subject-form">
          <div className="form-row">
            <input 
              type="text" 
              placeholder="Fag navn (f.eks. Matematik)" 
              value={formData.navn}
              onChange={(e) => setFormData({...formData, navn: e.target.value})}
              required
            />
            <input 
              type="text" 
              placeholder="Kort navn (f.eks. Mat)" 
              value={formData.kort_navn}
              onChange={(e) => setFormData({...formData, kort_navn: e.target.value})}
              required
            />
          </div>
          <div className="form-row">
            <div className="teacher-checkboxes">
              <label><strong>Lærere:</strong></label>
              <div className="checkbox-group">
                {teachers.map(teacher => (
                  <label key={teacher.id} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.teacher_ids.includes(teacher.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({...formData, teacher_ids: [...formData.teacher_ids, teacher.id]});
                        } else {
                          setFormData({...formData, teacher_ids: formData.teacher_ids.filter(id => id !== teacher.id)});
                        }
                      }}
                    />
                    {teacher.fornavn} {teacher.efternavn}
                  </label>
                ))}
              </div>
            </div>
            
            <input 
              type="color" 
              placeholder="Farve" 
              value={formData.farve}
              onChange={(e) => setFormData({...formData, farve: e.target.value})}
            />
          </div>
          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>
              Annuller
            </button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Opretter...' : 'Opret fag'}
            </button>
          </div>
        </form>
      )}
      
      <div className="subject-grid">
        {subjects.map(subject => (
          <div key={subject.id} className="subject-card" style={{borderLeftColor: subject.farve}}>
            <div className="subject-header-info">
              <h3>{subject.navn}</h3>
              <button 
                className="delete-subject-btn"
                onClick={() => handleDelete(subject.id)}
                title="Slet fag"
              >
                ×
              </button>
            </div>
            <div className="subject-details">
              <p><strong>Kort navn:</strong> {subject.kort_navn}</p>
              <p><strong>Lærer(e):</strong> {getTeacherNames(subject.teacher_ids)}</p>
              <p><strong>Status:</strong> {subject.aktiv ? 'Aktiv' : 'Inaktiv'}</p>
            </div>
          </div>
        ))}
        
        {subjects.length === 0 && (
          <div className="no-subjects">
            <p>Ingen fag fundet</p>
            <p>Klik på "+ Tilføj fag" for at oprette det første fag</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubjectGrid;
