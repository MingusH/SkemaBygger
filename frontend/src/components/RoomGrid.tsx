import React, { useState, useEffect } from 'react';
import { Room, roomApi } from '../api/api';

interface RoomGridProps {
  onRoomCreated: () => void;
}

const RoomGrid: React.FC<RoomGridProps> = ({ onRoomCreated }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    room_type: 'special',
    capacity: 30,
    equipment: '',
    active: true
  });

  const fetchRooms = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await roomApi.getAll();
      setRooms(data);
    } catch (err: any) {
      setError('Fejl ved hentning af lokaler');
      console.error('Error fetching rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Er du sikker på, at du vil slette dette lokale?')) {
      return;
    }
    
    try {
      await roomApi.delete(id);
      setRooms(rooms.filter(room => room.id !== id));
    } catch (err: any) {
      setError('Fejl ved sletning af lokale');
      console.error('Error deleting room:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await roomApi.create(formData);
      setFormData({
        name: '',
        room_type: 'special',
        capacity: 30,
        equipment: '',
        active: true
      });
      setShowForm(false);
      fetchRooms();
      onRoomCreated();
    } catch (err: any) {
      setError('Fejl ved oprettelse af lokale');
      console.error('Error creating room:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  if (loading) return <div className="loading">Henter lokaler...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="room-grid-container">
      <div className="room-header">
        <h2>Lokaler ({rooms.length})</h2>
        <button 
          className="add-room-btn"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Annuller' : '+ Tilføj lokale'}
        </button>
      </div>

      {showForm && (
        <div className="room-form-overlay">
          <form className="room-form" onSubmit={handleSubmit}>
            <h3>Opret nyt lokale</h3>
            <div className="form-group">
              <label>Lokale navn:</label>
              <input 
                type="text" 
                placeholder="f.eks. Kemilab" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <input 
                type="hidden" 
                name="room_type"
                value="special"
              />
            </div>
            
            <div className="form-group">
              <label>Kapacitet:</label>
              <input 
                type="number" 
                placeholder="Antal elever" 
                value={formData.capacity}
                onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
                min="1"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Udstyr:</label>
              <textarea 
                placeholder="f.eks. Laboratorieudstyr, projektor, whiteboard" 
                value={formData.equipment}
                onChange={(e) => setFormData({...formData, equipment: e.target.value})}
                rows={3}
              />
            </div>
            
            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>
                Annuller
              </button>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Opretter...' : 'Opret lokale'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="room-grid">
        {rooms.map(room => (
          <div key={room.id} className={`room-card ${!room.active ? 'inactive' : ''}`}>
            <div className="room-header-info">
              <h3>{room.name}</h3>
              <button 
                className="delete-room-btn"
                onClick={() => handleDelete(room.id)}
                title="Slet lokale"
              >
                ×
              </button>
            </div>
            <div className="room-details">
              <p><strong>Kapacitet:</strong> {room.capacity} elever</p>
              {room.equipment && <p><strong>Udstyr:</strong> {room.equipment}</p>}
              <p><strong>Status:</strong> {room.active ? 'Aktiv' : 'Inaktiv'}</p>
            </div>
          </div>
        ))}
        
        {rooms.length === 0 && (
          <div className="no-rooms">
            <p>Ingen lokaler fundet</p>
            <p>Klik på "+ Tilføj lokale" for at oprette det første lokale</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomGrid;
