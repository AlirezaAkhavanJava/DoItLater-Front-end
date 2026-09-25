const API_URL = "http://localhost:8080/api/v1/tasks";

let tasks = [];

const taskForm = document.getElementById("taskForm");
const titleInput = document.getElementById("title");
const descriptionInput = document.getElementById("description");
const dueDateInput = document.getElementById("dueDate");
const priorityInput = document.getElementById("priority");
const formMessage = document.getElementById("formMessage");

const tasksList = document.getElementById("tasksList");
const loadingMessage = document.getElementById("loadingMessage");
const filterSelect = document.getElementById("filterSelect");
const refreshButton = document.getElementById("refreshButton");
const toast = document.getElementById("toast");

const editModal = document.getElementById("editModal");
const editTaskForm = document.getElementById("editTaskForm");
const editTaskId = document.getElementById("editTaskId");
const editTitle = document.getElementById("editTitle");
const editDescription = document.getElementById("editDescription");
const editDueDate = document.getElementById("editDueDate");
const editPriority = document.getElementById("editPriority");
const editStatus = document.getElementById("editStatus");
const editFormMessage = document.getElementById("editFormMessage");
const saveEditButton = document.getElementById("saveEditButton");

const deleteModal = document.getElementById("deleteModal");
const deleteTaskId = document.getElementById("deleteTaskId");
const deleteTaskTitle = document.getElementById("deleteTaskTitle");
const confirmDeleteButton = document.getElementById("confirmDeleteButton");

document.addEventListener("DOMContentLoaded", () => {
    setTodayLabel();
    loadTasks();
});

taskForm.addEventListener("submit", createTask);
editTaskForm.addEventListener("submit", updateTask);
filterSelect.addEventListener("change", renderTasks);
refreshButton.addEventListener("click", loadTasks);
confirmDeleteButton.addEventListener("click", deleteTask);

document.querySelectorAll("[data-close-edit]").forEach(button => {
    button.addEventListener("click", closeEditModal);
});

document.querySelectorAll("[data-close-delete]").forEach(button => {
    button.addEventListener("click", closeDeleteModal);
});

async function loadTasks() {
    if (loadingMessage) {
        loadingMessage.style.display = "block";
        loadingMessage.textContent = "Loading tasks...";
    }

    if (tasksList) {
        tasksList.innerHTML = "";
    }

    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Could not load tasks.");
        }

        tasks = await response.json();
        renderTasks();
        updateSummary();
    } catch (error) {
        if (loadingMessage) {
            loadingMessage.textContent =
                "Could not connect to the backend. Make sure Spring Boot is running.";
        }
        showToast(error.message, true);
    }
}

async function createTask(event) {
    event.preventDefault();

    const taskData = {
        title: titleInput.value.trim(),
        description: descriptionInput.value.trim() || null,
        dueDate: dueDateInput.value || null,
        priority: priorityInput.value
    };

    try {
        const response = await fetch(`${API_URL}/createTask`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(taskData)
        });

        const result = await readResponse(response);

        if (!response.ok) {
            throw new Error(result.message || "Could not create task.");
        }

        taskForm.reset();
        priorityInput.value = "MEDIUM";
        formMessage.textContent = "";
        showToast("Task created successfully.");
        await loadTasks();
    } catch (error) {
        formMessage.textContent = error.message;
    }
}

function renderTasks() {
    const filter = filterSelect.value;

    const filteredTasks = tasks.filter(task => {
        return filter === "ALL" || task.status === filter;
    });

    tasksList.innerHTML = "";

    if (filteredTasks.length === 0) {
        loadingMessage.style.display = "block";
        loadingMessage.textContent =
            filter === "ALL"
                ? "No tasks yet. Create your first task."
                : "No matching tasks.";

        return;
    }

    loadingMessage.style.display = "none";

    filteredTasks.forEach(task => {
        tasksList.appendChild(createTaskCard(task));
    });
}

function createTaskCard(task) {
    const card = document.createElement("article");
    card.className = `task-card ${task.status === "COMPLETE" ? "completed" : ""}`;

    const main = document.createElement("div");
    main.className = "task-main";

    const title = document.createElement("h4");
    title.className = "task-title";
    title.textContent = task.title;

    const description = document.createElement("p");
    description.className = "task-description";
    description.textContent = task.description || "No description provided.";

    const meta = document.createElement("div");
    meta.className = "task-meta";

    const priorityBadge = document.createElement("span");
    priorityBadge.className = `badge badge-${String(task.priority).toLowerCase()}`;
    priorityBadge.textContent = `${capitalize(task.priority)} priority`;

    const statusBadge = document.createElement("span");
    statusBadge.className = "badge badge-status";
    statusBadge.textContent = task.status === "COMPLETE" ? "Completed" : "Open";

    meta.appendChild(priorityBadge);
    meta.appendChild(statusBadge);

    if (task.dueDate) {
        const dueDate = document.createElement("span");
        dueDate.className = "due-date";
        dueDate.textContent = `Due ${formatDate(task.dueDate)}`;
        meta.appendChild(dueDate);
    }

    main.appendChild(title);
    main.appendChild(description);
    main.appendChild(meta);

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "task-action";
    editButton.textContent = "Edit";
    editButton.addEventListener("click", () => openEditModal(task));

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "task-action delete";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => openDeleteModal(task));

    actions.appendChild(editButton);
    actions.appendChild(deleteButton);

    card.appendChild(main);
    card.appendChild(actions);

    return card;
}

function openEditModal(task) {
    editTaskId.value = task.id;
    editTitle.value = task.title || "";
    editDescription.value = task.description || "";
    editDueDate.value = task.dueDate || "";
    editPriority.value = task.priority || "MEDIUM";
    editStatus.value = task.status || "OPEN";
    editFormMessage.textContent = "";

    editModal.classList.remove("hidden");
    document.body.classList.add("modal-open");
    setTimeout(() => editTitle.focus(), 100);
}

function closeEditModal() {
    editModal.classList.add("hidden");

    if (deleteModal.classList.contains("hidden")) {
        document.body.classList.remove("modal-open");
    }
}

async function updateTask(event) {
    event.preventDefault();

    const id = editTaskId.value;

    const taskData = {
        title: editTitle.value.trim(),
        description: editDescription.value.trim() || null,
        dueDate: editDueDate.value || null,
        priority: editPriority.value,
        status: editStatus.value
    };

    saveEditButton.disabled = true;
    saveEditButton.textContent = "Saving...";
    editFormMessage.textContent = "";

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(taskData)
        });

        const result = await readResponse(response);

        if (!response.ok) {
            throw new Error(result.message || "Could not update task.");
        }

        closeEditModal();
        showToast("Task updated successfully.");
        await loadTasks();
    } catch (error) {
        editFormMessage.textContent = error.message;
    } finally {
        saveEditButton.disabled = false;
        saveEditButton.textContent = "Save changes";
    }
}

function openDeleteModal(task) {
    deleteTaskId.value = task.id;
    deleteTaskTitle.textContent = task.title;

    deleteModal.classList.remove("hidden");
    document.body.classList.add("modal-open");
}

function closeDeleteModal() {
    deleteModal.classList.add("hidden");

    if (editModal.classList.contains("hidden")) {
        document.body.classList.remove("modal-open");
    }
}

async function deleteTask() {
    const id = deleteTaskId.value;

    confirmDeleteButton.disabled = true;
    confirmDeleteButton.textContent = "Deleting...";

    try {
        const response = await fetch(`${API_URL}/delete/${id}`, {
            method: "DELETE"
        });

        const result = await readResponse(response);

        if (!response.ok) {
            throw new Error(result.message || "Could not delete task.");
        }

        closeDeleteModal();
        showToast("Task deleted successfully.");
        await loadTasks();
    } catch (error) {
        showToast(error.message, true);
    } finally {
        confirmDeleteButton.disabled = false;
        confirmDeleteButton.textContent = "Delete task";
    }
}

function updateSummary() {
    const completed = tasks.filter(task => task.status === "COMPLETE").length;
    const open = tasks.filter(task => task.status === "OPEN").length;

    document.getElementById("totalTasks").textContent = tasks.length;
    document.getElementById("openTasks").textContent = open;
    document.getElementById("completedTasks").textContent = completed;
}

async function readResponse(response) {
    const text = await response.text();

    if (!text) {
        return {};
    }

    try {
        return JSON.parse(text);
    } catch {
        return { message: text };
    }
}

function formatDate(dateString) {
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    }).format(new Date(`${dateString}T00:00:00`));
}

function capitalize(value) {
    const text = String(value || "").toLowerCase();
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function setTodayLabel() {
    const todayLabel = document.getElementById("todayLabel");

    if (todayLabel) {
        todayLabel.textContent = new Intl.DateTimeFormat("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric"
        }).format(new Date());
    }
}

function showToast(message, isError = false) {
    toast.textContent = message;
    toast.className = `toast show ${isError ? "error" : ""}`;

    setTimeout(() => {
        toast.className = "toast";
    }, 3500);
}