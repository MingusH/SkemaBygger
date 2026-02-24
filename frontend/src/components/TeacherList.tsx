import React, { useState, useEffect } from 'react';
import { Teacher, teacherApi } from '../api/api';

interface TeacherListProps {
  refreshKey: number;
}

const TeacherList: React.FC<TeacherListProps> = ({ refreshKey }) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Navn</th>
            <th>Email</th>
            <th>Initialer</th>
            <th>Telefon</th>
            <th>Ansættelsesdato</th>
            <th>Stilling</th>
            <th>Aktiv</th>
            <th>Handlinger</th>
          </tr>
        </thead>
        <tbody>
          {teachers.map((teacher) => (
            <tr key={teacher.id}>
              <td>{teacher.id}</td>
              <td>{teacher.fornavn} {teacher.efternavn}</td>
              <td>{teacher.email}</td>
              <td>{teacher.initialer}</td>
              <td>{teacher.telefon || '-'}</td>
              <td>{formatDate(teacher.ansat_dato)}</td>
              <td>{teacher.stilling}</td>
              <td>{teacher.aktiv ? 'Ja' : 'Nej'}</td>
              <td>
                <button 
                  onClick={() => handleDelete(teacher.id)}
                  className="delete-button"
                  title="Slet lærer"
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {teachers.length === 0 && (
        <div className="no-data">Ingen lærere fundet</div>
      )}
    </div>
  );
};

export default TeacherList;
