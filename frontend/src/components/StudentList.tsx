import React, { useState, useEffect } from 'react';
import { Student, studentApi } from '../api/api';

interface StudentListProps {
  refreshKey: number;
}

const StudentList: React.FC<StudentListProps> = ({ refreshKey }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchStudents = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await studentApi.getAll();
      setStudents(data);
    } catch (err: any) {
      setError('Fejl ved hentning af elever');
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    
    if (!window.confirm('Er du sikker på, at du vil slette denne elev?')) {
      return;
    }
    
    try {
      await studentApi.delete(id);
      setStudents(students.filter(student => student.id !== id));
    } catch (err: any) {
      setError('Fejl ved sletning af elev');
      console.error('Error deleting student:', err);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [refreshKey]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('da-DK');
  };

  if (loading) return <div className="loading">Henter elever...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="list-container">
      <h3>Elever ({students.length})</h3>
      
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Navn</th>
            <th>Email</th>
            <th>Fødselsdato</th>
            <th>Elevnummer</th>
            <th>Klasse</th>
            <th>Aktiv</th>
            <th>Handlinger</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id}>
              <td>{student.id}</td>
              <td>{student.fornavn} {student.efternavn}</td>
              <td>{student.email}</td>
              <td>{formatDate(student.foedselsdato)}</td>
              <td>{student.elevnummer}</td>
              <td>{student.klasse_id}</td>
              <td>{student.aktiv ? 'Ja' : 'Nej'}</td>
              <td>
                <button 
                  onClick={() => handleDelete(student.id)}
                  className="delete-button"
                  title="Slet elev"
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {students.length === 0 && (
        <div className="no-data">Ingen elever fundet</div>
      )}
    </div>
  );
};

export default StudentList;
