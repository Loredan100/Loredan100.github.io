function addTask() {
  var task = document.getElementById("myTask");
  var todoDate = document.getElementById("todoDate");
  var date = todoDate.value;
  var text = task.value.trim();

  if (text !== "" && date !== "") {
    fetch("http://localhost:3000/todoapp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text,
        dueDate: date,
        completed: false,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to add task");
        }
        return response.json();
      })
      .then((data) => {
        return clearUIAndFetchTasks();
      })
      .catch((error) => {
        console.error("Error:", error);
        clearUIAndFetchTasks();
      });
    pending();
  } else {
    alert("Please write a task or add a date!");
  }
}

function removeTask(button) {
  var list = button.parentNode;
  var taskId = list.dataset.taskId;

  fetch("http://localhost:3000/todoapp/" + taskId, {
    method: "DELETE",
  })
    .then((response) => {
      if (response.ok) {
        list.parentNode.removeChild(list);
        pending();
      } else {
        console.error(
          "Error deleting task:",
          response.status,
          response.statusText
        );
      }
    })
    .catch((error) => console.error("Error:", error));
}

function clearAll() {
  fetch("http://localhost:3000/todoapp")
    .then((response) => response.json())
    .then((tasks) => {
      return Promise.all(
        tasks.map((task) => {
          return fetch(`http://localhost:3000/todoapp/${task.id}`, {
            method: "DELETE",
          });
        })
      );
    })
    .then((responses) => {
      const allDeleted = responses.every((response) => response.ok);

      if (allDeleted) {
        clearUIAndFetchTasks();
        pending();
      } else {
        console.error(
          "Error clearing all tasks: Not all tasks were deleted successfully"
        );
        clearUIAndFetchTasks();
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      clearUIAndFetchTasks();
    });
}

function clearUIAndFetchTasks() {
  var todos = document.getElementById("todos");

  if (todos) {
    todos.innerHTML = "";

    fetch("http://localhost:3000/todoapp")
      .then((response) => response.json())
      .then((tasks) => {
        var todos = document.getElementById("todos");

        if (todos) {
          tasks.forEach((task) => {
            var newTask = document.createElement("li");
            newTask.dataset.taskId = task.id;
            newTask.innerHTML =
              task.text +
              " " +
              "<span style='position: absolute; left: 200px'> (Due: " +
              task.dueDate +
              ")</span>" +
              '<span id="removebtn" onclick="removeTask(this)">&#128465</span>';
            todos.appendChild(newTask);
          });
        } else {
          console.error("Error: 'todos' element not found after fetch.");
        }
      })
      .catch((error) => console.error("Error fetching tasks:", error));
  }
}

function pending() {
  const pendingTasks = document.getElementById("pendingTasks");

  fetch("http://localhost:3000/todoapp")
    .then((response) => response.json())
    .then((data) => {
      const tasks = data.tasks || [];
      console.log("Fetched tasks:", tasks); // Add this line for debugging
      pendingTasks.textContent = tasks.length;
    })
    .catch((error) => console.error("Error fetching tasks:", error));
}

clearUIAndFetchTasks();
