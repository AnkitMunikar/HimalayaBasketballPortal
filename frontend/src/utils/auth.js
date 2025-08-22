export const saveTokens = (access, refresh, role) => {
  localStorage.setItem("access", access);
  localStorage.setItem("refresh", refresh);
  localStorage.setItem("role", role);
};

export const getRole = () => localStorage.getItem("role");

export const logout = () => {
  localStorage.clear();
  window.location.href = "/login";
};
