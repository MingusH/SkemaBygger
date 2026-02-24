import React, { useState, useEffect } from 'react';
import { Student, studentApi } from '../api/api';

const StudentList: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const data = await studentApi.getAll();
      setStudents(data);
      setError('');
    } catch (err) {
      setError('Fejl ved hentning af elever');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('da-DK');
  };

  if (loading) return <div className="loading">Henter elever...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="list-container">
      <h3>Elever ({students.length})</h3>
      
      {students.length === 0 ? (
        <p className="no-data">Ingen elever fundet</p>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Navn</th>
                <th>Email</th>
                <th>Elevnummer</th>
                <th>Klasse ID</th>
                <th>Fødselsdato</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td>{`${student.fornavn} ${student.efternavn}`}</td>
                  <td>{student.email}</td>
                  <td>{student.elevnummer}</td>
                  <td>{student.klasse_id}</td>
                  <td>{formatDate(student.foedselsdato)}</td>
                  <td>
                    <span className={`status ${student.aktiv ? 'active' : 'inactive'}`}>
                      {student.aktiv ? 'Aktiv' : 'Inaktiv'}
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

export default StudentList;
