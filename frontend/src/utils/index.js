function isLogin() {
  return true;
}

function isAdmin() {
  return true;
}

// set/retrieve from localstorage
const getStore = (key) => localStorage.getItem(key);
const setStore = (key, val) => localStorage.setItem(key, val);
const removeStore = (key) => localStorage.removeItem(key);

export { isLogin, isAdmin, getStore, setStore, removeStore };
