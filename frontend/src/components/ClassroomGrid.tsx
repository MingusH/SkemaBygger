import React, { useState, useEffect } from 'react';

interface Classroom {
  id: number;
  navn: string;
  aargang: string;
  skoleaar: string;
  laerer_id: number;
  kapacitet: number;
  lokale?: string;
  aktiv: boolean;
}

interface ClassroomGridProps {
  onClassroomCreated: () => void;
}

const ClassroomGrid: React.FC<ClassroomGridProps> = ({ onClassroomCreated }) => {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const fetchClassrooms = async () => {
    setLoading(true);
    setError('');
    try {
      // TODO: Implementer API kald
      // const data = await classroomApi.getAll();
      // setClassrooms(data);
      
      // Midlertidig mock data
      setClassrooms([
        { id: 1, navn: '3.A', aargang: '3. klasse', skoleaar: '2023/2024', laerer_id: 1, kapacitet: 28, lokale: 'Rum 101', aktiv: true },
        { id: 2, navn: '3.B', aargang: '3. klasse', skoleaar: '2023/2024', laerer_id: 2, kapacitet: 26, lokale: 'Rum 102', aktiv: true },
        { id: 3, navn: '5.A', aargang: '5. klasse', skoleaar: '2023/2024', laerer_id: 1, kapacitet: 30, lokale: 'Rum 201', aktiv: true },
        { id: 4, navn: '6.A', aargang: '6. klasse', skoleaar: '2023/2024', laerer_id: 3, kapacitet: 25, lokale: 'Rum 301', aktiv: true },
      ]);
    } catch (err: any) {
      setError('Fejl ved hentning af klasser');
      console.error('Error fetching classrooms:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Er du sikker på, at du vil slette denne klasse?')) {
      return;
    }
    
    try {
      // TODO: Implementer API kald
      // await classroomApi.delete(id);
      setClassrooms(classrooms.filter(classroom => classroom.id !== id));
    } catch (err: any) {
      setError('Fejl ved sletning af klasse');
      console.error('Error deleting classroom:', err);
    }
  };

  useEffect(() => {
    fetchClassrooms();
  }, []);

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
          <form>
            <div className="form-row">
              <input type="text" placeholder="Klassenavn (f.eks. 3.A)" />
              <input type="text" placeholder="Årgang (f.eks. 3. klasse)" />
            </div>
            <div className="form-row">
              <input type="text" placeholder="Skoleår (f.eks. 2023/2024)" />
              <input type="number" placeholder="Kapacitet" />
            </div>
            <div className="form-row">
              <input type="text" placeholder="Lokale (f.eks. Rum 101)" />
              <select>
                <option value="">Vælg lærer</option>
                <option value="1">Jens Hansen</option>
                <option value="2">Mette Nielsen</option>
                <option value="3">Søren Petersen</option>
              </select>
            </div>
            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>
                Annuller
              </button>
              <button type="submit" className="submit-btn">
                Opret klasse
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="classroom-grid">
        {classrooms.map((classroom) => (
          <div key={classroom.id} className={`classroom-card ${!classroom.aktiv ? 'inactive' : ''}`}>
            <div className="classroom-header-info">
              <h3>{classroom.navn}</h3>
              <button 
                className="delete-classroom-btn"
                onClick={() => handleDelete(classroom.id)}
                title="Slet klasse"
              >
                ×
              </button>
            </div>
            <div className="classroom-details">
              <p><strong>Årgang:</strong> {classroom.aargang}</p>
              <p><strong>Skoleår:</strong> {classroom.skoleaar}</p>
              <p><strong>Kapacitet:</strong> {classroom.kapacitet} elever</p>
              {classroom.lokale && <p><strong>Lokale:</strong> {classroom.lokale}</p>}
              <p><strong>Status:</strong> {classroom.aktiv ? 'Aktiv' : 'Inaktiv'}</p>
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
