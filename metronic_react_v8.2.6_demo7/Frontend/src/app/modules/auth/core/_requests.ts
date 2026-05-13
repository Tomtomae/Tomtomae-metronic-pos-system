import axios, { AxiosResponse } from "axios";
import { AuthModel, UserModel } from "./_models";
import { ID, Response } from "../../../../_metronic/helpers";

const API_URL = import.meta.env.VITE_APP_API_URL;
export const GET_USER_BY_ACCESSTOKEN_URL = `${API_URL}/verifyToken`;
export const REGISTER_URL = `${API_URL}/register`;
export const LOGIN_URL = `${API_URL}/login`;
export const REQUEST_PASSWORD_URL = `${API_URL}/forgot_password`;
export const UpdateProfile= `${API_URL}`;

//
export function login(email: string, password: string) {
  return axios.post<AuthModel>(LOGIN_URL, {
    email,
    password,
  });
}
export function register(
  email: string,
  firstname: string,
  lastname: string,
  password: string,
  password_confirmation: string
) {
  return axios.post(REGISTER_URL, {
    email,
    first_name: firstname,
    last_name: lastname,
    password,
    password_confirmation,
  });
}

// Server should return object => { result: boolean } (Is Email in DB)
export function requestPassword(email: string) {
  return axios.post<{ result: boolean }>(REQUEST_PASSWORD_URL, {
    email,
  });
}
//export function functionName(parameter:string){console.log("message",get parameter)}return axios form import .post("get form models") check token GET_USER_BY_ACCESSTOKEN_URL
export function getUserByToken(token: string) {
  console.log("Sending token to Backend:", token);
  return axios.post<UserModel>(
    GET_USER_BY_ACCESSTOKEN_URL, 
    { api_token: token }, // Body
    {
      headers: {
        Authorization: `Bearer ${token}`, // Header
      },
    }
  );
}


export const UpdateUser = (Users:ID,userData:Partial<UserModel>,token:string): Promise<UserModel|undefined> =>{
  return axios
  .put(`${UpdateProfile}/${Users}`, userData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })  
  .then((response: AxiosResponse<Response<UserModel>>) => response .data)
  .then((response:Response<UserModel>) => response.data)
};
