import React, { useState } from 'react';
import { StudentCreate, studentApi } from '../api/api';

interface StudentFormProps {
  onStudentCreated: () => void;
}

const StudentForm: React.FC<StudentFormProps> = ({ onStudentCreated }) => {
  const [formData, setFormData] = useState<StudentCreate>({
    fornavn: '',
    efternavn: '',
    email: '',
    foedselsdato: '', // Date input giver YYYY-MM-DD string
    elevnummer: '',
    klasse_id: 1,
    aktiv: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Konverter YYYY-MM-DD til ISO string for backend
    const formDataToSend = {
      ...formData,
      foedselsdato: formData.foedselsdato ? new Date(formData.foedselsdato + 'T12:00:00').toISOString() : '',
    };

    try {
      await studentApi.create(formDataToSend);
      setFormData({
        fornavn: '',
        efternavn: '',
        email: '',
        foedselsdato: '',
        elevnummer: '',
        klasse_id: 1,
        aktiv: true,
      });
      onStudentCreated();
    } catch (err: any) {
      console.error('Error creating student:', err);
      setError(`Fejl ved oprettelse af elev: ${err.response?.data?.detail || err.message || 'Ukendt fejl'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h3>Opret Ny Elev</h3>
      {error && <div className="error">{error}</div>}
      
      <form onSubmit={handleSubmit} className="student-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="fornavn">Fornavn:</label>
            <input
              type="text"
              id="fornavn"
              name="fornavn"
              value={formData.fornavn}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="efternavn">Efternavn:</label>
            <input
              type="text"
              id="efternavn"
              name="efternavn"
              value={formData.efternavn}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="elevnummer">Elevnummer:</label>
            <input
              type="text"
              id="elevnummer"
              name="elevnummer"
              value={formData.elevnummer}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="foedselsdato">Fødselsdato:</label>
            <input
              type="date"
              id="foedselsdato"
              name="foedselsdato"
              value={formData.foedselsdato}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="klasse_id">Klasse:</label>
            <select
              id="klasse_id"
              name="klasse_id"
              value={formData.klasse_id}
              onChange={handleChange}
            >
              <option value={1}>3.A</option>
              <option value={2}>3.B</option>
              <option value={3}>5.A</option>
            </select>
          </div>
        </div>

        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              name="aktiv"
              checked={formData.aktiv}
              onChange={handleChange}
            />
            Aktiv elev
          </label>
        </div>

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? 'Opretter...' : 'Opret Elev'}
        </button>
      </form>
    </div>
  );
};

export default StudentForm;
