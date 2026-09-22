import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
});

export const createProfile    = (data) => api.post('/users/profile', data);
export const getProfile       = (id) => api.get(`/users/${id}/profile`);

export const getFoods         = (diet_type) => api.get('/foods/list', { params: diet_type ? { diet_type } : {} });
export const logFood          = (data) => api.post('/food/log', data);
export const getTodayFoodLog  = (userId) => api.get(`/food/log/${userId}/today`);
export const deleteFoodLog    = (logId) => api.delete(`/food/log/${logId}`);

export const getWorkouts      = () => api.get('/workouts/list');
export const logWorkout       = (data) => api.post('/workout/log', data);
export const getTodayWorkout  = (userId) => api.get(`/workout/log/${userId}/today`);
export const deleteWorkoutLog = (logId) => api.delete(`/workout/log/${logId}`);

export const computeAssessment   = (data) => api.post('/assessment/dos-donts', data);
export const getLatestAssessment = (userId) => api.get(`/assessment/${userId}/latest`);
export const getAssessmentHistory = (userId) => api.get(`/assessment/${userId}/history`);
export const generateReport      = (data) => api.post('/report/generate', data);

export default api;


