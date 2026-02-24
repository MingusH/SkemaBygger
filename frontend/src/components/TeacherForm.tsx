import React, { useState } from 'react';
import { TeacherCreate, teacherApi } from '../api/api';

interface TeacherFormProps {
  onTeacherCreated: () => void;
}

const TeacherForm: React.FC<TeacherFormProps> = ({ onTeacherCreated }) => {
  const [formData, setFormData] = useState<TeacherCreate>({
    fornavn: '',
    efternavn: '',
    email: '',
    initialer: '',
    telefon: '',
    ansat_dato: '', // Date input giver YYYY-MM-DD string
    stilling: 'Lærer',
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
      ansat_dato: formData.ansat_dato ? new Date(formData.ansat_dato + 'T09:00:00').toISOString() : '',
    };

    try {
      await teacherApi.create(formDataToSend);
      setFormData({
        fornavn: '',
        efternavn: '',
        email: '',
        initialer: '',
        telefon: '',
        ansat_dato: '',
        stilling: 'Lærer',
        aktiv: true,
      });
      onTeacherCreated();
    } catch (err: any) {
      console.error('Error creating teacher:', err);
      console.error('Error response:', err.response);
      console.error('Error data:', err.response?.data);
      
      let errorMessage = 'Ukendt fejl';
      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.message) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setError(`Fejl ved oprettelse af lærer: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h3>Opret Ny Lærer</h3>
      {error && <div className="error">{error}</div>}
      
      <form onSubmit={handleSubmit} className="teacher-form">
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
            <label htmlFor="initialer">Initialer:</label>
            <input
              type="text"
              id="initialer"
              name="initialer"
              value={formData.initialer}
              onChange={handleChange}
              required
              maxLength={5}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="telefon">Telefon:</label>
            <input
              type="tel"
              id="telefon"
              name="telefon"
              value={formData.telefon}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="ansat_dato">Ansættelsesdato:</label>
            <input
              type="date"
              id="ansat_dato"
              name="ansat_dato"
              value={formData.ansat_dato}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="stilling">Stilling:</label>
            <select
              id="stilling"
              name="stilling"
              value={formData.stilling}
              onChange={handleChange}
            >
              <option value="Lærer">Lærer</option>
              <option value="Viceinspektør">Viceinspektør</option>
              <option value="Inspektør">Inspektør</option>
              <option value="Pædagog">Pædagog</option>
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
            Aktiv lærer
          </label>
        </div>

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? 'Opretter...' : 'Opret Lærer'}
        </button>
      </form>
    </div>
  );
};

export default TeacherForm;
