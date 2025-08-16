// ============================
// To-Do App (cleaned version)
// - English comments
// - Darker green via CSS var
// - Google Material Symbols for Edit/Delete buttons
// - LocalStorage persistence
// ============================

// ---- DOM references ----
const taskInput = document.getElementById("task-input");
const newTaskBtn = document.getElementById("newTask");
const taskList  = document.querySelector(".task-list");
const progress  = document.getElementById("progress");
const numbers   = document.getElementById("numbers");

// ---- State (persisted in localStorage) ----
const LS_KEY = "tasks__v3";
let tasks = JSON.parse(localStorage.getItem(LS_KEY) || "[]");

// Generate a safe unique id
const uid = () =>
  (window.crypto?.randomUUID?.() ?? `t_${Math.random().toString(36).slice(2,10)}`);

// Escape text to avoid injecting HTML into task titles
const escapeHTML = (str) => {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
};

// Persist state
const save = () => localStorage.setItem(LS_KEY, JSON.stringify(tasks));

// Update progress bar + numbers
function updateProgressUI(){
  const done = tasks.filter(t => t.completed).length;
  const total = tasks.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  progress.style.width = pct + "%";
  numbers.textContent = `${done}/${total}`;
}

// Build a single <li> item
function makeTaskItem(task){
  const li = document.createElement("li");
  li.className = "task-item" + (task.completed ? " completed" : "");
  li.dataset.id = task.id;

  li.innerHTML = `
    <button class="check" data-action="toggle"
      aria-label="${task.completed ? "Unmark as done" : "Mark as done"}"
      title="${task.completed ? "Unmark as done" : "Mark as done"}"></button>

    <span class="task-text" contenteditable="false">${escapeHTML(task.text)}</span>

    <div class="task-actions">
      <button class="icon-btn edit" data-action="edit" aria-label="Edit" title="Edit">
        <span class="material-symbols-outlined">edit</span>
      </button>
      <button class="icon-btn del" data-action="delete" aria-label="Delete" title="Delete">
        <span class="material-symbols-outlined">delete</span>
      </button>
    </div>
  `;
  return li;
}

// Render entire list
function render(){
  taskList.innerHTML = "";
  tasks.forEach(task => taskList.appendChild(makeTaskItem(task)));
  updateProgressUI();
}

// Add new task
function addTask(text){
  tasks.push({ id: uid(), text, completed:false });
  save(); render();
}

// ---- Events ----
// Add via "+" button
newTaskBtn.addEventListener("click", (e) => {
  e.preventDefault();
  const text = taskInput.value.trim();
  if(!text) return;
  addTask(text);
  taskInput.value = "";
  taskInput.focus();
});

// Add via Enter in input
taskInput.addEventListener("keydown", (e) => {
  if(e.key === "Enter"){
    e.preventDefault();
    newTaskBtn.click();
  }
});

// Delegated events for toggle/edit/delete
taskList.addEventListener("click", (e) => {
  const action = e.target.closest("button")?.dataset?.action;
  if(!action) return;

  const li  = e.target.closest("li.task-item");
  if(!li) return;
  const id  = li.dataset.id;
  const idx = tasks.findIndex(t => t.id === id);
  if(idx === -1) return;

  if(action === "toggle"){
    tasks[idx].completed = !tasks[idx].completed;
    save(); render();
    return;
  }

  if(action === "delete"){
    // optional confirm:
    // if(!confirm("Delete this task?")) return;
    tasks.splice(idx, 1);
    save(); render();
    return;
  }

  if(action === "edit"){
    const span = li.querySelector(".task-text");
    const original = tasks[idx].text;

    // enable inline editing
    span.setAttribute("contenteditable", "true");
    span.classList.add("editing");
    span.focus();

    // place caret at end
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(span); range.collapse(false);
    sel.removeAllRanges(); sel.addRange(range);

    // commit on Enter / blur, cancel on Escape
    function onKey(ev){
      if(ev.key === "Enter"){ ev.preventDefault(); span.blur(); }
      if(ev.key === "Escape"){ span.textContent = original; span.blur(); }
    }
    function onBlur(){
      const next = span.textContent.trim();
      tasks[idx].text = next || original;
      span.removeAttribute("contenteditable");
      span.classList.remove("editing");
      span.removeEventListener("keydown", onKey);
      span.removeEventListener("blur", onBlur);
      save(); render();
    }

    span.addEventListener("keydown", onKey);
    span.addEventListener("blur", onBlur);
  }
});

// ---- Init ----
render();


