import moment from "moment";
import { toast } from "react-hot-toast";

import Toast from "components/Toast";

import type { ToastType } from "components/Toast";

import { jwtDecode } from "jwt-decode";


export function isLogin(): boolean {
  return true;
}

export function isAdmin(): boolean {
  return true;
}

// TODO
export const isLoggedIn = (): boolean => {
    const token = getStore("AUTH_TOKEN");
    return Boolean(token);
}

export const dateToStringForBackend = (dateObject: Date): string =>
  moment.utc(dateObject).format("YYYY-MM-DD HH:mm:ss");

export const dateToStringForCampaignGrid = (dateObject: Date): string =>
  moment(dateObject).format("H:MM a (D MMM)");

export const dateToDateString = (date: Date | string): string =>
  moment.utc(date).format("DD MMM YYYY");

export const fileToDataUrl = (file: File): Promise<string> => {
  const validFileTypes = ["image/jpeg", "image/png", "image/jpg", "image/gif"];
  const valid = validFileTypes.find((type) => type === file.type);

  if (!valid) {
    throw Error("provided file is not an image");
  }

  const reader = new FileReader();
  const dataUrlPromise: Promise<string> = new Promise((resolve, reject) => {
    reader.onerror = reject;
    reader.onload = () => resolve(reader.result as string);
  });

  reader.readAsDataURL(file);
  return dataUrlPromise;
};

export const base64ToBytes = (base64String: string): number[] =>
  Array.from(atob(base64String), (c) => c.charCodeAt(0));

// set/retrieve from localstorage
export const getStore = (key: string) => localStorage.getItem(key);
export const setStore = (key: string, val: string) =>
  localStorage.setItem(key, val);
export const removeStore = (key: string) => localStorage.removeItem(key);

export const pushToast = (
  title: string,
  description: string,
  type?: ToastType
) => {
  toast.custom((t) => (
    <Toast t={t} title={title} description={description} type={type} />
  ));
};
