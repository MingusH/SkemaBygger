import React, { useState } from 'react';
import StudentForm from './StudentForm';
import TeacherForm from './TeacherForm';
import StudentList from './StudentList';
import TeacherList from './TeacherList';
import ClassroomGrid from './ClassroomGrid';
import SubjectGrid from './SubjectGrid';
import TimeSlotGrid from './TimeSlotGrid';

type TabType = 'students' | 'teachers' | 'classrooms' | 'subjects' | 'timeslots';

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('students');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleStudentCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleTeacherCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleClassroomCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleSubjectCreated = () => {
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
        <button
          className={`tab-btn ${activeTab === 'subjects' ? 'active' : ''}`}
          onClick={() => setActiveTab('subjects')}
        >
          Fag
        </button>
        <button
          className={`tab-btn ${activeTab === 'classrooms' ? 'active' : ''}`}
          onClick={() => setActiveTab('classrooms')}
        >
          Klasser
        </button>
        <button
          className={`tab-btn ${activeTab === 'timeslots' ? 'active' : ''}`}
          onClick={() => setActiveTab('timeslots')}
        >
          Tidsintervaller
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
                <StudentList key={`students-${refreshKey}`} refreshKey={refreshKey} />
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
                <TeacherList key={`teachers-${refreshKey}`} refreshKey={refreshKey} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'classrooms' && (
          <div className="tab-pane">
            <ClassroomGrid key={`classrooms-${refreshKey}`} onClassroomCreated={handleClassroomCreated} />
          </div>
        )}

        {activeTab === 'subjects' && (
          <div className="tab-pane">
            <SubjectGrid key={`subjects-${refreshKey}`} onSubjectCreated={handleSubjectCreated} />
          </div>
        )}

        {activeTab === 'timeslots' && (
          <div className="tab-pane">
            <TimeSlotGrid key={`timeslots-${refreshKey}`} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
