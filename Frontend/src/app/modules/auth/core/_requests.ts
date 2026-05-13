import axios, { AxiosResponse } from "axios";
import { AuthModel, UserModel } from "./_models";
import { ID } from "../../../../_metronic/helpers";

const API_URL = import.meta.env.VITE_APP_API_URL;

export const GET_USER_BY_ACCESSTOKEN_URL = `${API_URL}/verifyToken`;
export const REGISTER_URL = `${API_URL}/register`; 
export const LOGIN_URL = `${API_URL}/login`;
export const REQUEST_PASSWORD_URL = `${API_URL}/forgot_password`;
export const UPDATE_PROFILE_URL = `${API_URL}/updateProfile`; 

export function login(email: string, password: string) {
  return axios.post<AuthModel>(LOGIN_URL, {
    email,
    password,
  });
}



export function register(email: string, first_name: string, last_name: string, password: string) {
  return axios.post(REGISTER_URL, {
    email,
    first_name: first_name,
    last_name: last_name,   
    password,
  })
}

export function requestPassword(email: string,newPassword:string) {
  return axios.post<{ result: boolean }>(REQUEST_PASSWORD_URL, {
    email,
    newPassword,
  });
}


export function getUserByToken(token: string) {
  return axios.post<UserModel>(GET_USER_BY_ACCESSTOKEN_URL, { api_token: token }, {
    headers: { Authorization: `Bearer ${token}` },
  });
}


export const UpdateUser = (
  userId: ID, 
  formData: FormData, 
  token: string
): Promise<UserModel | undefined> => {
  return axios
    .post<UserModel>(`${UPDATE_PROFILE_URL}/${userId}`, formData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        // 🌟 ບອກ Axios ວ່າມີການສົ່ງໄຟລ໌
        'Content-Type': 'multipart/form-data',
      },
    })  
    .then((response: AxiosResponse<UserModel>) => {
      return response.data; 
    })
    .catch((error: unknown) => {
      console.error("Update Error:", error);
      return undefined;
    });
};