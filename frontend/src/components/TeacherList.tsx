import React, { useState, useEffect } from 'react';
import { Teacher, teacherApi } from '../api/api';
import TeacherAvailabilityModal from './TeacherAvailabilityModal';

interface TeacherListProps {
  refreshKey: number;
}

const TeacherList: React.FC<TeacherListProps> = ({ refreshKey }) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  const fetchTeachers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await teacherApi.getAll();
      setTeachers(data);
    } catch (err: any) {
      setError('Fejl ved hentning af lærere');
      console.error('Error fetching teachers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Er du sikker på, at du vil slette denne lærer?')) {
      return;
    }
    
    try {
      await teacherApi.delete(id);
      setTeachers(teachers.filter(teacher => teacher.id !== id));
    } catch (err: any) {
      setError('Fejl ved sletning af lærer');
      console.error('Error deleting teacher:', err);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, [refreshKey]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('da-DK');
  };

  if (loading) return <div className="loading">Henter lærere...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="list-container">
      <h3>Lærere ({teachers.length})</h3>
      
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{width: '20px'}}>ID</th>
              <th style={{width: '100px'}}>Navn</th>
              <th style={{width: '100px'}}>Email</th>
              <th style={{width: '50px'}}>Initialer</th>
              <th style={{width: '70px'}}>Telefon</th>
              <th style={{width: '70px'}}>Ans. dato</th>
              <th style={{width: '60px'}}>Stilling</th>
              <th style={{width: '40px'}}>Aktiv</th>
              <th style={{width: '120px'}}>Handlinger</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((teacher) => (
              <tr key={teacher.id}>
                <td>{teacher.id}</td>
                <td>
                  <div className="teacher-name">
                    {teacher.fornavn} {teacher.efternavn}
                  </div>
                </td>
                <td>
                  <div className="email-cell" title={teacher.email}>
                    {teacher.email}
                  </div>
                </td>
                <td>{teacher.initialer}</td>
                <td>{teacher.telefon || '-'}</td>
                <td>{formatDate(teacher.ansat_dato)}</td>
                <td>{teacher.stilling}</td>
                <td>{teacher.aktiv ? 'Ja' : 'Nej'}</td>
                <td>
                  <div className="action-buttons">
                    <button 
                      onClick={() => handleDelete(teacher.id)}
                      className="delete-button"
                      title="Slet lærer"
                    >
                      🗑️
                    </button>
                    <button 
                      onClick={() => setSelectedTeacher(teacher)}
                      className="availability-button"
                      title="Administrer tilgængelighed"
                    >
                      📅
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {teachers.length === 0 && (
        <div className="no-data">Ingen lærere fundet</div>
      )}
      
      {selectedTeacher && (
        <TeacherAvailabilityModal 
          teacher={selectedTeacher} 
          onClose={() => setSelectedTeacher(null)} 
        />
      )}
    </div>
  );
};

export default TeacherList;
