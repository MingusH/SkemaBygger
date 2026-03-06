import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 sekunder timeout
});

// Add response interceptor for debugging
api.interceptors.response.use(
  response => {
    console.log('API Response:', response.config.url, response.status);
    return response;
  },
  error => {
    console.error('API Error:', error.config?.url, error.message);
    return Promise.reject(error);
  }
);

// Add request interceptor for debugging
api.interceptors.request.use(
  config => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  error => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Student API
export interface Student {
  id: number;
  fornavn: string;
  efternavn: string;
  email: string;
  foedselsdato: string; // ISO string from backend
  elevnummer: string;
  klasse_id: number;
  aktiv: boolean;
  oprettet_dato: string; // ISO string from backend
}

export interface StudentCreate {
  fornavn: string;
  efternavn: string;
  email: string;
  foedselsdato: string; // YYYY-MM-DD string from date input
  elevnummer: string;
  klasse_id: number;
  aktiv: boolean;
}

export const studentApi = {
  getAll: async (): Promise<Student[]> => {
    const response = await api.get('/students/');
    return response.data;
  },
  
  getById: async (id: number): Promise<Student> => {
    const response = await api.get(`/students/${id}`);
    return response.data;
  },
  
  create: async (student: StudentCreate): Promise<Student> => {
    const response = await api.post('/students/', student);
    return response.data;
  },
  
  delete: async (id: number): Promise<void> => {
    await api.delete(`/students/${id}`);
  }
};

// Teacher API
export interface Teacher {
  id: number;
  fornavn: string;
  efternavn: string;
  email: string;
  initialer: string;
  telefon?: string;
  ansat_dato: string; // ISO string from backend
  stilling: string;
  aktiv: boolean;
  oprettet_dato: string; // ISO string from backend
}

export interface TeacherCreate {
  fornavn: string;
  efternavn: string;
  email: string;
  initialer: string;
  telefon?: string;
  ansat_dato: string; // YYYY-MM-DD string from date input
  stilling: string;
  aktiv: boolean;
}

export const teacherApi = {
  getAll: async (): Promise<Teacher[]> => {
    const response = await api.get('/teachers/');
    return response.data;
  },
  
  getById: async (id: number): Promise<Teacher> => {
    const response = await api.get(`/teachers/${id}`);
    return response.data;
  },
  
  create: async (teacher: TeacherCreate): Promise<Teacher> => {
    const response = await api.post('/teachers/', teacher);
    return response.data;
  },
  
  delete: async (id: number): Promise<void> => {
    await api.delete(`/teachers/${id}`);
  }
};

// Classroom API
export interface Classroom {
  id: number;
  name: string;
  start_year: number;
  class_teacher_id?: number;
  room?: string;
  active: boolean;
  subject_ids: number[];  // List of subject IDs for many-to-many
  created_at: string;
}

export interface ClassroomCreate {
  name: string;
  start_year: number;
  class_teacher_id?: number;
  room?: string;
  active: boolean;
  subject_ids: number[];  // List of subject IDs for many-to-many
}

export const classroomApi = {
  getAll: async (): Promise<Classroom[]> => {
    const response = await api.get('/classrooms/');
    return response.data;
  },
  
  create: async (classroom: ClassroomCreate): Promise<Classroom> => {
    const response = await api.post('/classrooms/', classroom);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/classrooms/${id}`);
  }
};

// Subject API
export interface Subject {
  id: number;
  navn: string;
  kort_navn: string;
  farve: string;
  aktiv: boolean;
  teacher_ids: number[];
  room_id?: number;
  created_at: string;
  room?: Room;
}

export interface SubjectCreate {
  navn: string;
  kort_navn: string;
  farve: string;
  aktiv: boolean;
  teacher_ids: number[];
  room_id?: number;
}

export const subjectApi = {
  getAll: async (): Promise<Subject[]> => {
    const response = await api.get('/subjects/');
    return response.data;
  },
  
  create: async (subject: SubjectCreate): Promise<Subject> => {
    const response = await api.post('/subjects/', subject);
    return response.data;
  },
  
  delete: async (id: number): Promise<void> => {
    await api.delete(`/subjects/${id}`);
  }
};

// Room API
export interface Room {
  id: number;
  name: string;
  room_type: string;
  capacity: number;
  equipment?: string;
  active: boolean;
  created_at: string;
}

export interface RoomCreate {
  name: string;
  room_type: string;
  capacity: number;
  equipment?: string;
  active: boolean;
}

export interface RoomAssignment {
  id: number;
  room_id: number;
  subject_id: number;
  classroom_id: number;
  timeslot_id: number;
  date: string;
  created_at: string;
  room: Room;
  subject: Subject;
  classroom: Classroom;
  timeslot: TimeSlot;
}

export interface RoomAssignmentCreate {
  room_id: number;
  subject_id: number;
  classroom_id: number;
  timeslot_id: number;
  date: string;
}

export const roomApi = {
  getAll: async (): Promise<Room[]> => {
    const response = await api.get('/rooms/');
    return response.data;
  },
  
  create: async (room: RoomCreate): Promise<Room> => {
    const response = await api.post('/rooms/', room);
    return response.data;
  },
  
  delete: async (id: number): Promise<void> => {
    await api.delete(`/rooms/${id}`);
  },
  
  getAvailable: async (date: string, timeslotId: number): Promise<Room[]> => {
    const response = await api.get(`/rooms/available/${date}/${timeslotId}`);
    return response.data;
  }
};

export const roomAssignmentApi = {
  getAll: async (): Promise<RoomAssignment[]> => {
    const response = await api.get('/room-assignments/');
    return response.data;
  },
  
  create: async (assignment: RoomAssignmentCreate): Promise<RoomAssignment> => {
    const response = await api.post('/room-assignments/', assignment);
    return response.data;
  }
};

// TimeSlot interfaces
export interface TimeSlot {
  id: number;
  start_time: string;  // "08:00"
  end_time: string;    // "08:45"
  day_of_week: number; // 0-6 (Mandag-Søndag)
  slot_number: number; // 1, 2, 3...
  is_break: boolean;
  break_type: string | null;  // "frokost", "lille_pause"
  active: boolean;
}

export interface TimeSlotCreate {
  start_time: string;  // "08:00"
  end_time: string;    // "08:45"
  day_of_week: number; // 0-6 (Mandag-Søndag)
  slot_number: number; // 1, 2, 3...
  is_break: boolean;
  break_type: string | null;
  active: boolean;
}

export const timeslotApi = {
  getAll: async (): Promise<TimeSlot[]> => {
    const response = await api.get('/timeslots/');
    return response.data;
  },
  
  create: async (data: TimeSlotCreate): Promise<TimeSlot> => {
    const response = await api.post('/timeslots/', data);
    return response.data;
  },
  
  delete: async (id: number): Promise<void> => {
    await api.delete(`/timeslots/${id}`);
  }
};
