import moment from "moment";

import PropTypes from "prop-types";

export function isLogin() {
  return true;
}

export function isAdmin() {
  return true;
}

export function isLoggedIn() {
  return true;
}

export const dateToString = (date) =>
  moment.utc(date).format("YYYY-MM-DD HH:mm:ss");

export const bytesToImage = (bytes) =>
  `data:image/png;base64,${btoa(
    new Uint8Array(bytes).reduce(
      (data, byte) => data + String.fromCharCode(byte),
      ""
    )
  )}`;

export const fileToDataUrl = (file) => {
  const validFileTypes = ["image/jpeg", "image/png", "image/jpg", "image/gif"];
  const valid = validFileTypes.find((type) => type === file.type);

  if (!valid) {
    throw Error("provided file is not an image");
  }

  const reader = new FileReader();
  const dataUrlPromise = new Promise((resolve, reject) => {
    reader.onerror = reject;
    reader.onload = () => resolve(reader.result);
  });

  reader.readAsDataURL(file);
  return dataUrlPromise;
};

export const base64ToBytes = (base64String) =>
  Array.from(atob(base64String), (c) => c.charCodeAt(0));

// set/retrieve from localstorage
export const getStore = (key) => localStorage.getItem(key);
export const setStore = (key, val) => localStorage.setItem(key, val);
export const removeStore = (key) => localStorage.removeItem(key);

// cringe function for PropTypes because PropTypes is cringe (typescript when)
// from https://stackoverflow.com/a/57496099
export const tuple = (...validators) =>
  PropTypes.arrayOf((_, index) => {
    const currentValidators = validators.filter((__, i) => i === index);
    if (currentValidators.length <= 0) return true;
    const [currentValidator] = currentValidators;

    return currentValidator;
  });
