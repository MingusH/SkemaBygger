import React, { useState } from 'react';
import StudentForm from './StudentForm';
import TeacherForm from './TeacherForm';
import StudentList from './StudentList';
import TeacherList from './TeacherList';

type TabType = 'students' | 'teachers';

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('students');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleStudentCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleTeacherCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>SkemaBygger - Administration</h1>
        <p>Administrer elever og lærere</p>
      </div>

      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          Elever
        </button>
        <button
          className={`tab-btn ${activeTab === 'teachers' ? 'active' : ''}`}
          onClick={() => setActiveTab('teachers')}
        >
          Lærere
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'students' && (
          <div className="tab-pane">
            <div className="content-grid">
              <div className="form-section">
                <StudentForm onStudentCreated={handleStudentCreated} />
              </div>
              <div className="list-section">
                <StudentList key={`students-${refreshKey}`} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'teachers' && (
          <div className="tab-pane">
            <div className="content-grid">
              <div className="form-section">
                <TeacherForm onTeacherCreated={handleTeacherCreated} />
              </div>
              <div className="list-section">
                <TeacherList key={`teachers-${refreshKey}`} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
