import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
  navn: string;
  aargang: string;
  skoleaar: string;
  laerer_id: number;
  kapacitet: number;
  lokale?: string;
  aktiv: boolean;
  oprettet_dato: string;
}

export const classroomApi = {
  getAll: async (): Promise<Classroom[]> => {
    const response = await api.get('/classrooms/');
    return response.data;
  },
};
