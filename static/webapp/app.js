const API_BASE = "https://a7eaf1ed0030.ngrok-free.app/api/";

let tasks = [];

/* =========================
   TOKEN HELPERS
========================= */

const getAccessToken = () => localStorage.getItem("access");
const getRefreshToken = () => localStorage.getItem("refresh");

const saveTokens = (access, refresh) => {
  console.log("Saving tokens");
  localStorage.setItem("access", access);
  localStorage.setItem("refresh", refresh);
};

const logout = () => {
  console.warn("LOGOUT");
  localStorage.clear();
  tasks = [];

  document.getElementById("app").style.display = "none";
  document.getElementById("auth-box").style.display = "block";
};

/* =========================
   REFRESH TOKEN
========================= */

const refreshAccessToken = async () => {
  const refresh = getRefreshToken();
  console.log("Trying refresh token:", refresh);

  if (!refresh) {
    logout();
    return null;
  }

  const res = await fetch(`${API_BASE}token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  const data = await res.json();
  console.log("Refresh response:", data);

  if (data.access) {
    localStorage.setItem("access", data.access);
    return data.access;
  }

  logout();
  return null;
};

/* =========================
   AUTH FETCH
========================= */

const authFetch = async (url, options = {}) => {
  let token = getAccessToken();
  console.log("authFetch:", url);
  console.log("Using token:", token);

  let res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  console.log("Response status:", res.status);

  if (res.status === 401) {
    console.warn("Access token expired, refreshing...");
    const newToken = await refreshAccessToken();

    if (!newToken) {
      console.error("Refresh failed");
      return null;
    }

    res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${newToken}`,
      },
    });
  }

  return res;
};

/* =========================
   AUTH
========================= */

const loginUser = async () => {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    alert("Username va password kiriting");
    return;
  }

  const res = await fetch(`${API_BASE}auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();
  console.log("Login response:", data);

  if (data.access) {
    saveTokens(data.access, data.refresh);
    startApp();
  } else {
    alert("Login yoki parol xato");
  }
};

const registerUser = async () => {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    alert("Username va password kiriting");
    return;
  }

  const res = await fetch(`${API_BASE}auth/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();
  console.log("Register response:", data);

  if (data.access) {
    saveTokens(data.access, data.refresh);
    startApp();
  } else {
    alert("Registration xatolik bilan tugadi");
  }
};

/* =========================
   API
========================= */

const loadTasks = async () => {
  console.log("LOAD TASKS");

  const res = await authFetch(`${API_BASE}tasks/`);
  if (!res) return;

  const text = await res.text();
  console.log("Raw tasks response:", text);

  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    console.error("JSON parse error:", e);
    return;
  }

  if (!Array.isArray(data)) {
    console.error("Tasks is not array:", data);
    return;
  }

  tasks = data;
  updateTasksList();
  updateStats();
};

const createTask = async (text) => {
  console.log("CREATE TASK:", text);

  const res = await authFetch(`${API_BASE}tasks/create/`, {
    method: "POST",
    body: JSON.stringify({ text, completed: false }),
  });

  const raw = await res.text();
  console.log("Create response:", raw);
};

const updateTaskAPI = async (id, data) => {
  const res = await authFetch(`${API_BASE}tasks/${id}/update/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

  const raw = await res.text();
  console.log("Update response:", raw);
};

const deleteTaskAPI = async (id) => {
  const res = await authFetch(`${API_BASE}tasks/${id}/delete/`, {
    method: "DELETE",
  });

  const raw = await res.text();
  console.log("Delete response:", raw);
};

/* =========================
   TASK LOGIC
========================= */

const addTask = async () => {
  const taskInput = document.getElementById("taskInput");
  const text = taskInput.value.trim();
  if (!text) return;

  await createTask(text);
  taskInput.value = "";
  loadTasks();
};

const toggleTaskComplete = async (index) => {
  const task = tasks[index];
  await updateTaskAPI(task.id, { completed: !task.completed });
  loadTasks();
};

const editTask = async (index) => {
  const task = tasks[index];

  const newText = prompt("Taskni tahrirlash:", task.text);
  if (!newText || newText.trim() === task.text) return;

  console.log("EDIT TASK:", task.id, newText);

  await updateTaskAPI(task.id, {
    text: newText.trim(),
    completed: task.completed,
  });

  loadTasks();
};

const deleteTask = async (index) => {
  const task = tasks[index];
  await deleteTaskAPI(task.id);
  loadTasks();
};

/* =========================
   UI
========================= */

const updateStats = () => {
  const completed = tasks.filter((t) => t.completed).length;
  const total = tasks.length;

  document.getElementById("numbers").innerText = `${completed} / ${total}`;
  document.getElementById("progress").style.width =
    total === 0 ? "0%" : `${(completed / total) * 100}%`;
};

const updateTasksList = () => {
  const taskList = document.getElementById("task-list");
  taskList.innerHTML = "";

  tasks.forEach((task, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="taskItem">
        <div class="task ${task.completed ? "completed" : ""}">
          <input type="checkbox" ${task.completed ? "checked" : ""}/>
          <p>${task.text}</p>
        </div>
        <div class="icons">
          <button onclick="editTask(${index})">✏️</button>
          <button onclick="deleteTask(${index})">🗑</button>
        </div>
      </div>
    `;

    li.querySelector("input").addEventListener("change", () => {
      toggleTaskComplete(index);
    });

    taskList.appendChild(li);
  });
};

/* =========================
   START
========================= */

const startApp = () => {
  console.log("START APP");
  document.getElementById("auth-box").style.display = "none";
  document.getElementById("app").style.display = "block";
  loadTasks();
};

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM Loaded");

  if (getAccessToken()) {
    startApp();
  } else {
    document.getElementById("auth-box").style.display = "block";
  }

  document.getElementById("newTask").addEventListener("click", (e) => {
    e.preventDefault();
    addTask();
  });
});
