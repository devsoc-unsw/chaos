function isLogin() {
  return true;
}

function isAdmin() {
  return true;
}

function isLoggedIn() {
  return true;
}

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const dateToString = (date) => (
  `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
);

const fileToDataUrl = (file) => {
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

// set/retrieve from localstorage
const getStore = (key) => localStorage.getItem(key);
const setStore = (key, val) => localStorage.setItem(key, val);
const removeStore = (key) => localStorage.removeItem(key);

export { isLogin, isAdmin, fileToDataUrl, getStore, setStore, removeStore, isLoggedIn, dateToString };
