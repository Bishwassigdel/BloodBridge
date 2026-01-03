const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';


export interface SignupData {
  name: string;
  email: string;
  password: string;
  bloodGroup: string;
  phone: string;
  location: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ApiResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: any;
}

export const signupUser = async (data: SignupData): Promise<ApiResponse> => {
  const res = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  return await res.json();
};

export const loginUser = async (data: LoginData): Promise<ApiResponse> => {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  return await res.json();
};
