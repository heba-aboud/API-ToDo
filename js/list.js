const API_URL = 'https://dummyjson.com/todos';
let tasks = [];
let currentFilter = 'all';

const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const emptyState = document.getElementById('emptyState');
const activeCount = document.getElementById('activeCount');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');
const filterBtns = document.querySelectorAll('.filter-btn');

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}
async function fetchTasks() {
    try {
        taskList.innerHTML = '<li class="loading">جارِ تحميل المهام...</li>';
        const res = await fetch(`${API_URL}?limit=10`);
        if (!res.ok) throw new Error('فشل الاتصال بالـ API');

        const data = await res.json();
        tasks = data.todos.map(t => ({
            id: t.id,
            text: t.todo,
            completed: t.completed
        }));

        renderTasks();
    } catch (err) {
        console.error(err);
        taskList.innerHTML = '<li class="error">تعذر تحميل المهام، حاول مرة ثانية.</li>';
    }
}


function renderTasks() {
    taskList.innerHTML = '';

    const filtered = tasks.filter(task => {
        if (currentFilter === 'active') return !task.completed;
        if (currentFilter === 'completed') return task.completed;
        return true;
    });

    if (filtered.length === 0) {
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
        filtered.forEach(task => {
            const li = createTaskElement(task);
            taskList.appendChild(li);
        });
    }

    updateCounter();
}

function createTaskElement(task) {
    const li = document.createElement('li');
    li.className = `task-item ${task.completed ? 'completed' : ''}`;
    li.dataset.id = task.id;

    li.innerHTML = `
        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
        <span class="task-text">${escapeHTML(task.text)}</span>
        <button class="edit-btn" title="Edit">✏️</button>
        <button class="delete-btn" title="Delete">🗑️</button>
    `;

    li.querySelector('.task-checkbox').addEventListener('change', () => toggleTask(task.id));

    li.querySelector('.delete-btn').addEventListener('click', () => deleteTask(task.id));

    li.querySelector('.edit-btn').addEventListener('click', () => startEdit(task.id, li));

    return li;
}

function addTask() {
    const text = taskInput.value.trim();
    if (!text) return;

    const newTask = {
        id: Date.now(),
        text,
        completed: false,
        createdAt: new Date().toISOString()
    };

    tasks.unshift(newTask);
    saveTasks();
    renderTasks();
    taskInput.value = '';
    taskInput.focus();
}

function toggleTask(id) {
    tasks = tasks.map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
    );
    saveTasks();
    renderTasks();
}

function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderTasks();
}

function startEdit(id, li) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const textSpan = li.querySelector('.task-text');
    const editBtn = li.querySelector('.edit-btn');

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'edit-input';
    input.value = task.text;

    textSpan.replaceWith(input);
    editBtn.textContent = '✅';
    input.focus();

    const saveEdit = () => {
        const newText = input.value.trim();
        if (newText) {
            tasks = tasks.map(t =>
                t.id === id ? { ...t, text: newText } : t
            );
            saveTasks();
        }
        renderTasks();
    };

    editBtn.onclick = saveEdit;
    input.addEventListener('keydown', e => {
        if (e.key === 'Enter') saveEdit();
        if (e.key === 'Escape') renderTasks();
    });
}

function clearCompleted() {
    tasks = tasks.filter(task => !task.completed);
    saveTasks();
    renderTasks();
}

function updateCounter() {
    const remaining = tasks.filter(t => !t.completed).length;
    activeCount.textContent = remaining;
}

function escapeHTML(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

addBtn.addEventListener('click', addTask);

taskInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') addTask();
});

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderTasks();
    });
});

clearCompletedBtn.addEventListener('click', clearCompleted);
async function init() {
    const saved = localStorage.getItem('tasks');
    if (saved) {
        tasks = JSON.parse(saved);
        renderTasks();
    } else {
        await fetchTasks();
        saveTasks();
    }
}

init();
