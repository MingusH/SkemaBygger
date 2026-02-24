import React, { useState, useEffect } from 'react';
import { Teacher, teacherApi } from '../api/api';

const TeacherList: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const data = await teacherApi.getAll();
      setTeachers(data);
      setError('');
    } catch (err) {
      setError('Fejl ved hentning af lærere');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('da-DK');
  };

  if (loading) return <div className="loading">Henter lærere...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="list-container">
      <h3>Lærere ({teachers.length})</h3>
      
      {teachers.length === 0 ? (
        <p className="no-data">Ingen lærere fundet</p>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Navn</th>
                <th>Initialer</th>
                <th>Email</th>
                <th>Telefon</th>
                <th>Stilling</th>
                <th>Ansættelsesdato</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher) => (
                <tr key={teacher.id}>
                  <td>{`${teacher.fornavn} ${teacher.efternavn}`}</td>
                  <td>
                    <span className="initials">{teacher.initialer}</span>
                  </td>
                  <td>{teacher.email}</td>
                  <td>{teacher.telefon || '-'}</td>
                  <td>{teacher.stilling}</td>
                  <td>{formatDate(teacher.ansat_dato)}</td>
                  <td>
                    <span className={`status ${teacher.aktiv ? 'active' : 'inactive'}`}>
                      {teacher.aktiv ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TeacherList;
