/* ========================================
TODO App
======================================== */

"use strict";

/* ========================================
상태
======================================== */

let todos = [];

let currentFilter = "all";
let currentSort = "created-desc";

let draggedTodoId = null;

let confirmCallback = null;

/* ========================================
DOM
======================================== */

const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todo-input");
const todoList = document.getElementById("todo-list");
const todoCount = document.getElementById("todo-count");
const emptyState = document.getElementById("empty-state");

const searchInput = document.getElementById("search-input");
const clearSearch = document.getElementById("clear-search");

const filterButtons = document.querySelectorAll(".filter-btn");
const sortSelect = document.getElementById("sort-select");

const completeAllButton = document.getElementById("complete-all");
const uncompleteAllButton = document.getElementById("uncomplete-all");
const deleteCompletedButton = document.getElementById("delete-completed");
const deleteAllButton = document.getElementById("delete-all");

const exportButton = document.getElementById("export-data");
const importInput = document.getElementById("import-data");
const resetButton = document.getElementById("reset-data");

const themeToggle = document.getElementById("theme-toggle");

const statusMessage = document.getElementById("status-message");

const confirmModal = document.getElementById("confirm-modal");
const confirmMessage = document.getElementById("confirm-message");
const confirmCancel = document.getElementById("confirm-cancel");
const confirmOk = document.getElementById("confirm-ok");

/* ========================================
초기화
======================================== */

document.addEventListener("DOMContentLoaded", () => {
loadTodos();
loadTheme();
renderTodos();

todoInput.focus();

});

/* ========================================
LocalStorage
======================================== */

const STORAGE_KEY = "todo-app-data";
const THEME_KEY = "todo-app-theme";

function saveTodos() {
localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function loadTodos() {
try {
const savedData = localStorage.getItem(STORAGE_KEY);

    if (!savedData) {
        todos = [];
        return;
    }

    const parsedData = JSON.parse(savedData);

    if (!Array.isArray(parsedData)) {
        todos = [];
        return;
    }

    todos = parsedData.filter(todo => {
        return (
            todo &&
            typeof todo.id === "string" &&
            typeof todo.text === "string" &&
            typeof todo.completed === "boolean"
        );
    });

} catch (error) {
    console.error("TODO 데이터를 불러오는 중 오류:", error);
    todos = [];
    showStatus("저장된 데이터를 불러오지 못했습니다.");
}

}

/* ========================================
TODO 추가
======================================== */

todoForm.addEventListener("submit", event => {
event.preventDefault();

const text = todoInput.value.trim();

if (!text) {
    showStatus("할 일을 입력해주세요.");
    todoInput.focus();
    return;
}

addTodo(text);

});

function addTodo(text) {
const newTodo = {
id: generateId(),
text: text,
completed: false,
createdAt: Date.now(),
updatedAt: Date.now(),
order: todos.length
};

todos.push(newTodo);

saveTodos();
renderTodos();

todoInput.value = "";
todoInput.focus();

showStatus("TODO가 추가되었습니다.");

}

/* ========================================
ID 생성
======================================== */

function generateId() {
return (
Date.now().toString(36) +
Math.random().toString(36).substring(2, 9)
);
}

/* ========================================
TODO 완료 / 해제
======================================== */

function toggleTodo(id) {
const todo = todos.find(todo => todo.id === id);

if (!todo) {
    return;
}

todo.completed = !todo.completed;
todo.updatedAt = Date.now();

saveTodos();
renderTodos();

showStatus(
    todo.completed
        ? "TODO를 완료했습니다."
        : "TODO를 완료 해제했습니다."
);

}

/* ========================================
TODO 수정
======================================== */

function startEditTodo(id) {
const item = document.querySelector(
`.todo-item[data-id="${CSS.escape(id)}"]`
);

const todo = todos.find(todo => todo.id === id);

if (!item || !todo) {
    return;
}

const content = item.querySelector(".todo-content");

const input = document.createElement("input");

input.type = "text";
input.className = "todo-edit-input";
input.value = todo.text;
input.maxLength = 200;

content.replaceWith(input);

input.focus();
input.select();


function finishEdit(save) {

    if (!item.contains(input)) {
        return;
    }

    if (save) {
        const newText = input.value.trim();

        if (!newText) {
            showStatus("TODO 내용은 비워둘 수 없습니다.");
            input.focus();
            return;
        }

        todo.text = newText;
        todo.updatedAt = Date.now();

        saveTodos();

        showStatus("TODO가 수정되었습니다.");
    }

    renderTodos();
}


input.addEventListener("keydown", event => {

    if (event.key === "Enter") {
        event.preventDefault();
        finishEdit(true);
    }

    if (event.key === "Escape") {
        event.preventDefault();
        finishEdit(false);
    }
});


input.addEventListener("blur", () => {
    finishEdit(true);
});

}

/* ========================================
TODO 삭제
======================================== */

function deleteTodo(id) {

const todo = todos.find(todo => todo.id === id);

if (!todo) {
    return;
}

openConfirmModal(
    `"${todo.text}"을(를) 삭제하시겠습니까?`,
    () => {

        todos = todos.filter(todo => todo.id !== id);

        normalizeOrder();

        saveTodos();
        renderTodos();

        showStatus("TODO가 삭제되었습니다.");
    }
);

}

/* ========================================
전체 완료
======================================== */

completeAllButton.addEventListener("click", () => {

if (todos.length === 0) {
    showStatus("완료할 TODO가 없습니다.");
    return;
}

todos.forEach(todo => {
    todo.completed = true;
    todo.updatedAt = Date.now();
});

saveTodos();
renderTodos();

showStatus("모든 TODO를 완료했습니다.");

});

/* ========================================
전체 완료 해제
======================================== */

uncompleteAllButton.addEventListener("click", () => {

if (todos.length === 0) {
    showStatus("TODO가 없습니다.");
    return;
}

todos.forEach(todo => {
    todo.completed = false;
    todo.updatedAt = Date.now();
});

saveTodos();
renderTodos();

showStatus("모든 TODO의 완료 상태를 해제했습니다.");

});

/* ========================================
완료 항목 삭제
======================================== */

deleteCompletedButton.addEventListener("click", () => {

const completedCount = todos.filter(
    todo => todo.completed
).length;

if (completedCount === 0) {
    showStatus("삭제할 완료 항목이 없습니다.");
    return;
}

openConfirmModal(
    `완료된 TODO ${completedCount}개를 삭제하시겠습니까?`,
    () => {

        todos = todos.filter(
            todo => !todo.completed
        );

        normalizeOrder();

        saveTodos();
        renderTodos();

        showStatus(
            `완료된 TODO ${completedCount}개를 삭제했습니다.`
        );
    }
);

});

/* ========================================
전체 삭제
======================================== */

deleteAllButton.addEventListener("click", () => {

if (todos.length === 0) {
    showStatus("삭제할 TODO가 없습니다.");
    return;
}

openConfirmModal(
    `모든 TODO ${todos.length}개를 삭제하시겠습니까?`,
    () => {

        todos = [];

        saveTodos();
        renderTodos();

        showStatus("모든 TODO를 삭제했습니다.");
    }
);

});

/* ========================================
검색
======================================== */

searchInput.addEventListener("input", () => {
renderTodos();
});

clearSearch.addEventListener("click", () => {

searchInput.value = "";

renderTodos();

searchInput.focus();

});

/* ========================================
필터
======================================== */

filterButtons.forEach(button => {

button.addEventListener("click", () => {

    currentFilter = button.dataset.filter;

    filterButtons.forEach(btn => {
        btn.classList.remove("active");
    });

    button.classList.add("active");

    renderTodos();
});

});

/* ========================================
정렬
======================================== */

sortSelect.addEventListener("change", () => {

currentSort = sortSelect.value;

renderTodos();

});

/* ========================================
TODO 목록 렌더링
======================================== */

function renderTodos() {

let filteredTodos = getFilteredTodos();

filteredTodos = sortTodos(filteredTodos);

todoList.innerHTML = "";

filteredTodos.forEach(todo => {

    const item = createTodoElement(todo);

    todoList.appendChild(item);

});

updateCount(filteredTodos);
updateEmptyState(filteredTodos);

}

/* ========================================
필터링
======================================== */

function getFilteredTodos() {

let result = [...todos];

const searchTerm = searchInput.value
    .trim()
    .toLowerCase();


// 상태 필터
if (currentFilter === "active") {

    result = result.filter(
        todo => !todo.completed
    );

} else if (currentFilter === "completed") {

    result = result.filter(
        todo => todo.completed
    );
}


// 검색
if (searchTerm) {

    result = result.filter(todo =>
        todo.text
            .toLowerCase()
            .includes(searchTerm)
    );
}


return result;

}

/* ========================================
정렬
======================================== */

function sortTodos(list) {

const sorted = [...list];

switch (currentSort) {

    case "created-desc":

        sorted.sort(
            (a, b) => b.createdAt - a.createdAt
        );

        break;


    case "created-asc":

        sorted.sort(
            (a, b) => a.createdAt - b.createdAt
        );

        break;


    case "completed":

        sorted.sort((a, b) => {

            if (a.completed === b.completed) {
                return a.createdAt - b.createdAt;
            }

            return a.completed ? -1 : 1;

        });

        break;


    case "active":

        sorted.sort((a, b) => {

            if (a.completed === b.completed) {
                return a.createdAt - b.createdAt;
            }

            return a.completed ? 1 : -1;

        });

        break;


    case "manual":

        sorted.sort(
            (a, b) => a.order - b.order
        );

        break;
}

return sorted;

}

/* ========================================
TODO DOM 생성
======================================== */

function createTodoElement(todo) {

const item = document.createElement("article");

item.className = "todo-item";

if (todo.completed) {
    item.classList.add("completed");
}

item.dataset.id = todo.id;

item.draggable = currentSort === "manual";


/* 체크박스 */

const checkbox = document.createElement("input");

checkbox.type = "checkbox";
checkbox.className = "todo-checkbox";
checkbox.checked = todo.completed;

checkbox.setAttribute(
    "aria-label",
    `${todo.text} 완료`
);

checkbox.addEventListener("change", () => {
    toggleTodo(todo.id);
});


/* 내용 */

const content = document.createElement("div");

content.className = "todo-content";
content.textContent = todo.text;


/* 액션 */

const actions = document.createElement("div");

actions.className = "todo-actions";


/* 수정 */

const editButton = document.createElement("button");

editButton.type = "button";
editButton.className = "edit-btn";
editButton.textContent = "✎";
editButton.title = "수정";
editButton.setAttribute("aria-label", "수정");

editButton.addEventListener("click", () => {
    startEditTodo(todo.id);
});


/* 삭제 */

const deleteButton = document.createElement("button");

deleteButton.type = "button";
deleteButton.className = "delete-btn";
deleteButton.textContent = "×";
deleteButton.title = "삭제";
deleteButton.setAttribute("aria-label", "삭제");

deleteButton.addEventListener("click", () => {
    deleteTodo(todo.id);
});


actions.appendChild(editButton);
actions.appendChild(deleteButton);


item.appendChild(checkbox);
item.appendChild(content);
item.appendChild(actions);


/* 드래그 이벤트 */

if (currentSort === "manual") {

    item.addEventListener("dragstart", event => {

        draggedTodoId = todo.id;

        item.classList.add("dragging");

        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData(
            "text/plain",
            todo.id
        );
    });


    item.addEventListener("dragend", () => {

        item.classList.remove("dragging");

        document
            .querySelectorAll(".todo-item")
            .forEach(element => {
                element.classList.remove("drag-over");
            });

        draggedTodoId = null;
    });


    item.addEventListener("dragover", event => {

        event.preventDefault();

        if (draggedTodoId === todo.id) {
            return;
        }

        item.classList.add("drag-over");

        event.dataTransfer.dropEffect = "move";
    });


    item.addEventListener("dragleave", () => {
        item.classList.remove("drag-over");
    });


    item.addEventListener("drop", event => {

        event.preventDefault();

        item.classList.remove("drag-over");

        const targetId = todo.id;

        if (!draggedTodoId) {
            return;
        }

        if (draggedTodoId === targetId) {
            return;
        }

        moveTodo(draggedTodoId, targetId);
    });
}


return item;

}

/* ========================================
드래그 순서 변경
======================================== */

function moveTodo(draggedId, targetId) {

const draggedIndex = todos.findIndex(
    todo => todo.id === draggedId
);

const targetIndex = todos.findIndex(
    todo => todo.id === targetId
);


if (
    draggedIndex === -1 ||
    targetIndex === -1
) {
    return;
}


const [draggedTodo] = todos.splice(
    draggedIndex,
    1
);

todos.splice(
    targetIndex,
    0,
    draggedTodo
);


normalizeOrder();

saveTodos();
renderTodos();

showStatus("TODO 순서를 변경했습니다.");

}

/* ========================================
순서 번호 정리
======================================== */

function normalizeOrder() {

todos.forEach((todo, index) => {
    todo.order = index;
});

}

/* ========================================
개수 표시
======================================== */

function updateCount(filteredTodos) {

const activeCount = todos.filter(
    todo => !todo.completed
).length;

todoCount.textContent = activeCount;


if (filteredTodos.length !== todos.length) {

    todoCount.title =
        `현재 표시 ${filteredTodos.length}개 / 미완료 ${activeCount}개`;

} else {

    todoCount.title =
        `미완료 ${activeCount}개`;
}

}

/* ========================================
빈 상태
======================================== */

function updateEmptyState(filteredTodos) {

if (filteredTodos.length === 0) {

    emptyState.hidden = false;

    if (todos.length === 0) {

        emptyState.querySelector("h2").textContent =
            "할 일이 없습니다";

        emptyState.querySelector("p").textContent =
            "새로운 TODO를 추가해보세요.";

    } else if (searchInput.value.trim()) {

        emptyState.querySelector("h2").textContent =
            "검색 결과가 없습니다";

        emptyState.querySelector("p").textContent =
            "다른 검색어를 입력해보세요.";

    } else {

        emptyState.querySelector("h2").textContent =
            "표시할 TODO가 없습니다";

        emptyState.querySelector("p").textContent =
            "다른 필터를 선택해보세요.";
    }

} else {

    emptyState.hidden = true;
}

}

/* ========================================
확인 모달
======================================== */

function openConfirmModal(message, callback) {

confirmMessage.textContent = message;

confirmCallback = callback;

confirmModal.hidden = false;

confirmOk.focus();

}

function closeConfirmModal() {

confirmModal.hidden = true;

confirmCallback = null;

}

confirmCancel.addEventListener("click", () => {
closeConfirmModal();
});

confirmOk.addEventListener("click", () => {

if (typeof confirmCallback === "function") {
    confirmCallback();
}

closeConfirmModal();

});

confirmModal.addEventListener("click", event => {

if (event.target === confirmModal) {
    closeConfirmModal();
}

});

document.addEventListener("keydown", event => {

if (
    event.key === "Escape" &&
    !confirmModal.hidden
) {
    closeConfirmModal();
}

});

/* ========================================
데이터 내보내기
======================================== */

exportButton.addEventListener("click", () => {

if (todos.length === 0) {
    showStatus("내보낼 TODO가 없습니다.");
    return;
}


const exportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    todos: todos
};


const json = JSON.stringify(
    exportData,
    null,
    2
);


const blob = new Blob(
    [json],
    { type: "application/json" }
);


const url = URL.createObjectURL(blob);

const link = document.createElement("a");

const date = new Date()
    .toISOString()
    .slice(0, 10);


link.href = url;
link.download = `todo-backup-${date}.json`;

document.body.appendChild(link);

link.click();

link.remove();

URL.revokeObjectURL(url);

showStatus("TODO 데이터를 내보냈습니다.");

});

/* ========================================
데이터 가져오기
======================================== */

importInput.addEventListener("change", event => {

const file = event.target.files[0];

if (!file) {
    return;
}


const reader = new FileReader();


reader.onload = event => {

    try {

        const data = JSON.parse(
            event.target.result
        );


        let importedTodos;


        // 우리가 만든 백업 형식
        if (
            data &&
            Array.isArray(data.todos)
        ) {

            importedTodos = data.todos;

        // 배열 자체를 넣은 경우도 허용
        } else if (Array.isArray(data)) {

            importedTodos = data;

        } else {

            throw new Error(
                "올바른 TODO 데이터가 아닙니다."
            );
        }


        const validatedTodos =
            importedTodos
                .filter(todo => {
                    return (
                        todo &&
                        typeof todo.text === "string" &&
                        typeof todo.completed === "boolean"
                    );
                })
                .map(todo => {

                    return {
                        id:
                            typeof todo.id === "string"
                                ? todo.id
                                : generateId(),

                        text:
                            todo.text.trim(),

                        completed:
                            todo.completed,

                        createdAt:
                            Number(todo.createdAt) ||
                            Date.now(),

                        updatedAt:
                            Number(todo.updatedAt) ||
                            Date.now(),

                        order:
                            Number.isFinite(todo.order)
                                ? todo.order
                                : 0
                    };

                })
                .filter(todo => todo.text.length > 0);


        if (validatedTodos.length === 0) {

            throw new Error(
                "가져올 수 있는 TODO가 없습니다."
            );
        }


        openConfirmModal(
            `TODO ${validatedTodos.length}개를 가져오시겠습니까?`,
            () => {

                todos = validatedTodos;

                normalizeOrder();

                saveTodos();
                renderTodos();

                showStatus(
                    `${todos.length}개의 TODO를 가져왔습니다.`
                );
            }
        );


    } catch (error) {

        console.error(
            "가져오기 오류:",
            error
        );

        showStatus(
            "올바른 TODO JSON 파일이 아닙니다."
        );
    }

    // 같은 파일을 다시 선택할 수 있도록 초기화
    importInput.value = "";
};


reader.onerror = () => {

    showStatus(
        "파일을 읽는 중 오류가 발생했습니다."
    );

    importInput.value = "";
};


reader.readAsText(file);

});

/* ========================================
데이터 초기화
======================================== */

resetButton.addEventListener("click", () => {

openConfirmModal(
    "모든 TODO 데이터를 완전히 초기화하시겠습니까?",
    () => {

        todos = [];

        localStorage.removeItem(STORAGE_KEY);

        renderTodos();

        showStatus("데이터를 초기화했습니다.");
    }
);

});

/* ========================================
테마
======================================== */

function loadTheme() {

const savedTheme =
    localStorage.getItem(THEME_KEY);


if (savedTheme === "dark") {
    enableDarkMode();
} else {
    disableDarkMode();
}

}

themeToggle.addEventListener("click", () => {

const isDark =
    document.body.classList.contains("dark-mode");


if (isDark) {

    disableDarkMode();

    localStorage.setItem(
        THEME_KEY,
        "light"
    );

} else {

    enableDarkMode();

    localStorage.setItem(
        THEME_KEY,
        "dark"
    );
}

});

function enableDarkMode() {

document.body.classList.add("dark-mode");

themeToggle.textContent = "☀️";
themeToggle.setAttribute(
    "aria-label",
    "라이트 모드"
);

}

function disableDarkMode() {

document.body.classList.remove("dark-mode");

themeToggle.textContent = "🌙";
themeToggle.setAttribute(
    "aria-label",
    "다크 모드"
);

}

/* ========================================
상태 메시지
======================================== */

let statusTimer = null;

function showStatus(message) {

statusMessage.textContent = message;


clearTimeout(statusTimer);


statusTimer = setTimeout(() => {

    statusMessage.textContent = "";

}, 2500);

}

/* ========================================
키보드 단축키
======================================== */

document.addEventListener("keydown", event => {

// Ctrl + /
// 검색창으로 이동
if (
    event.ctrlKey &&
    event.key === "/"
) {

    event.preventDefault();

    searchInput.focus();

    return;
}


// Ctrl + Enter
// TODO 입력창에서 추가
if (
    event.ctrlKey &&
    event.key === "Enter" &&
    document.activeElement === todoInput
) {

    event.preventDefault();

    todoForm.requestSubmit();

    return;
}

});

/* ========================================
페이지 이탈 방지용 정리
======================================== */

window.addEventListener("beforeunload", () => {
saveTodos();
});