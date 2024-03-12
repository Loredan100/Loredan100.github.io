document.addEventListener("DOMContentLoaded", function () {
  loadTasksFromLocalStorage();

  fetchTasksFromServer();

  const listItems = document.querySelectorAll(".todoList li");
  listItems.forEach(function (item) {
    addEventsDragAndDrop(item);
  });
});

function loadTasksFromLocalStorage() {
  const storedTasks = localStorage.getItem("tasks");
  if (storedTasks) {
    const tasks = JSON.parse(storedTasks);
    updateTaskList(tasks);
  }
}

let taskCount = 0;

function pending() {
  const pendingTasks = document.getElementById("pendingTasks");
  taskCount++;
  pendingTasks.textContent = taskCount;
  console.log(taskCount);
}

function addTask() {
  const taskInput = document.getElementById("myTask");
  const text = taskInput.value.trim();

  if (text !== "") {
    taskInput.value = "";

    const taskList = document.getElementById("todos");
    pending();
    const li = document.createElement("li");
    addEventsDragAndDrop(li);
    const currentDate = new Date();

    const taskId = "_" + Math.random().toString(36).substr(2, 9);

    li.setAttribute("data-id", taskId);
    li.setAttribute("data-creation-time", currentDate.toLocaleString());
    li.innerHTML =
      '<span id="checkbtn" onclick="checked(this)">&#10004</span>' +
      '<span class="task-text">' +
      text +
      "</span>" +
      '<span id="removebtn" onclick="removeTask(this)">&#x2718</span>';
    taskList.appendChild(li);

    li.addEventListener("mouseenter", function (event) {
      showPopup(event, li.getAttribute("data-creation-time"));
    });

    li.addEventListener("mouseleave", function () {
      removePopup();
    });
    sendDataToServer({
      text,
      creationTime: currentDate.toLocaleString(),
      id: taskId,
    });
  }
  saveTasksToLocalStorage();

  fetchTasksFromServer();
}

function saveTasksToLocalStorage() {
  const taskList = document.getElementById("todos");
  if (taskList) {
    const tasks = [];

    taskList.querySelectorAll("li").forEach(function (item) {
      const taskId = item.getAttribute("data-id");
      const textElement = item.querySelector(".task-text");

      const text = textElement ? textElement.textContent : "";

      const creationTime = item.getAttribute("data-creation-time");
      const status =
        textElement && textElement.style.textDecoration === "line-through"
          ? "done"
          : "undone";

      tasks.push({ id: taskId, text, creationTime, status });
    });

    localStorage.setItem("tasks", JSON.stringify(tasks));
  }
}

function fetchTasksFromServer() {
  fetch("http://localhost:3000/tasks")
    .then((response) => response.json())
    .then((data) => {
      updateTaskList(data);
    })
    .catch((error) => {
      console.error("Error fetching tasks:", error);
    });
}

function updateTaskList(tasks) {
  const taskList = document.getElementById("todos");

  const existingTaskIds = Array.from(taskList.children).map((item) =>
    item.getAttribute("data-id")
  );

  tasks.forEach((task) => {
    const existingLi = taskList.querySelector(`[data-id="${task.id}"]`);

    if (existingLi) {
      const taskText = existingLi.querySelector(".task-text");
      taskText.textContent = task.text;

      if (task.status === "done") {
        taskText.style.textDecoration = "line-through";
        existingLi.style.backgroundColor = "#a1e7a1";
      } else {
        taskText.style.textDecoration = "none";
        existingLi.style.backgroundColor = "";
      }
    } else {
      const li = document.createElement("li");
      li.setAttribute("data-id", task.id);
      li.setAttribute("data-creation-time", task.creationTime);
      addEventsDragAndDrop(li);

      li.innerHTML =
        '<span id="checkbtn" onclick="checked(this)">&#10004</span>' +
        '<span class="task-text">' +
        task.text +
        "</span>" +
        '<span id="removebtn" onclick="removeTask(this)">&#x2718</span>';

      taskList.appendChild(li);
    }

    const index = existingTaskIds.indexOf(task.id);
    if (index !== -1) {
      existingTaskIds.splice(index, 1);
    }
  });

  existingTaskIds.forEach((taskId) => {
    const taskToRemove = taskList.querySelector(`[data-id="${taskId}"]`);
    if (taskToRemove) {
      taskList.removeChild(taskToRemove);
    }
  });

  updatePendingTasksCount();
}

function updatePendingTasksCount() {
  const pendingTasks = document.getElementById("pendingTasks");
  const undoneTasksCount = document.querySelectorAll(
    ".task-text:not([style*='line-through'])"
  ).length;
  pendingTasks.textContent = undoneTasksCount;
}

function showPopup(event, time) {
  var popup = document.createElement("div");
  popup.className = "popup";
  popup.innerHTML = "Created: " + time;

  popup.style.top = event.clientY + "px";
  popup.style.left = event.clientX + 20 + "px";

  document.body.appendChild(popup);
}

function removePopup() {
  var popups = document.querySelectorAll(".popup");
  popups.forEach(function (popup) {
    popup.parentNode.removeChild(popup);
  });
}

function removeTask(button) {
  var listItem = button.parentNode;
  var list = document.getElementById("todos");

  var isChecked =
    listItem.querySelector(".task-text").style.textDecoration ===
    "line-through";

  list.removeChild(listItem);

  if (!isChecked) {
    taskCount--;
  }

  const pendingTasks = document.getElementById("pendingTasks");
  pendingTasks.textContent = taskCount;

  removePopup();
  const taskId = listItem.getAttribute("data-id");
  if (taskId) {
    removeDataFromServer(taskId);
  }
}

function sendDataToServer(data) {
  fetch("http://localhost:3000/tasks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((data) => console.log("Success:", data))
    .catch((error) => {
      console.error("Error:", error);
    });
}

function removeDataFromServer(taskId) {
  console.log("Removing task with id:", taskId);

  fetch(`http://localhost:3000/tasks/${taskId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      console.log("Server response status:", response.status);

      return response.json();
    })
    .then((data) => {
      console.log("Success:", data);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

function clearAll() {
  var list = document.getElementById("todos");

  list.querySelectorAll("li").forEach(function (item) {
    const taskId = item.getAttribute("data-id");
    if (taskId) {
      removeDataFromServer(taskId);
    }
  });

  list.innerHTML = "";

  const pendingTasks = document.getElementById("pendingTasks");
  pendingTasks.textContent = taskCount = 0;

  localStorage.removeItem("tasks");
}
function checked(span) {
  var listItem = span.parentNode;
  var text = span.nextSibling;

  if (text.style.textDecoration === "line-through") {
    text.style.textDecoration = "none";
    listItem.style.backgroundColor = "";
    updateTaskCount(1);
    updateTaskStatus(listItem, "undone");
  } else {
    text.style.textDecoration = "line-through";
    listItem.style.backgroundColor = "#a1e7a1";
    updateTaskCount(-1);
    updateTaskStatus(listItem, "done");
  }

  const pendingTasks = document.getElementById("pendingTasks");
  pendingTasks.textContent = taskCount;
}
function updateTaskCount(delta) {
  taskCount += delta;

  taskCount = Math.max(taskCount, 0);
}
function updateTaskStatus(listItem, status) {
  const taskId = listItem.getAttribute("data-id");
  if (taskId) {
    const data = { status };
    fetch(`http://localhost:3000/tasks/${taskId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((data) => console.log("Update Success:", data))
      .catch((error) => {
        console.error("Update Error:", error);
      });
  }
}

function edit(event) {
  var target = event.target;

  target.contentEditable = true;

  target.focus();

  target.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();

      target.contentEditable = false;
      const updatedText = target.textContent.trim();
      const taskId = target.parentNode.getAttribute("data-id");

      updateTaskOnServer(taskId, updatedText);
    }
  });
}
function updateTaskOnServer(taskId, updatedText) {
  const data = { text: updatedText };

  fetch(`http://localhost:3000/tasks/${taskId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((data) => console.log("Update Success:", data))
    .catch((error) => {
      console.error("Update Error:", error);
    });
}

let dragSrcEl = null;

function handleDragStart(e) {
  dragSrcEl = this;
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", "");
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  e.dataTransfer.dropEffect = "move";
  return false;
}

function handleDragEnter() {
  this.classList.add("over");
}

function handleDragLeave() {
  this.classList.remove("over");
}

function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }
  if (dragSrcEl !== this) {
    this.parentNode.insertBefore(dragSrcEl, this.nextSibling);
  }
  return false;
}

function handleDragEnd() {
  const listItems = document.querySelectorAll(".todoList li");
  listItems.forEach(function (item) {
    item.classList.remove("over");
  });
}

function addEventsDragAndDrop(el) {
  el.setAttribute("draggable", "true");
  el.addEventListener("dragstart", handleDragStart, false);
  el.addEventListener("dragenter", handleDragEnter, false);
  el.addEventListener("dragover", handleDragOver, false);
  el.addEventListener("dragleave", handleDragLeave, false);
  el.addEventListener("drop", handleDrop, false);
  el.addEventListener("dragend", handleDragEnd, false);
}

document.addEventListener("DOMContentLoaded", function () {
  const listItems = document.querySelectorAll(".todoList li");
  listItems.forEach(function (item) {
    addEventsDragAndDrop(item);
  });
});
