class TodoApp {
    constructor() {
        this.todos = JSON.parse(localStorage.getItem('todos')) || [];
        this.currentFilter = 'all';
        this.searchQuery = '';
        
        this.dom = {
            taskInput: document.querySelector('.task-input'),
            dateInput: document.querySelector('.date-input'),
            prioritySelect: document.querySelector('.priority-select'),
            addBtn: document.querySelector('.add-btn'),
            todosList: document.querySelector('.todos-list'),
            filterBtns: document.querySelectorAll('.filter-btn'),
            searchInput: document.querySelector('.search-input'),
            alertMessage: document.querySelector('.alert-message'),
            stats: {
                total: document.getElementById('total-tasks'),
                completed: document.getElementById('completed-tasks'),
                pending: document.getElementById('pending-tasks'),
                overdue: document.getElementById('overdue-tasks')
            },
            noTasksRow: document.querySelector('.no-tasks-row')
        };
        this.init();
    }
    
    init() {
        this.dom.addBtn.addEventListener('click', () => this.addTodo());
        this.dom.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });
        
        this.dom.filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.dom.filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = btn.dataset.filter;
                this.renderTodos();
            });
        });
        
        this.dom.searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.renderTodos();
        });
        this.updateStats();
        this.renderTodos();
    }
    
    addTodo() {
        const task = this.dom.taskInput.value.trim();
        const dueDate = this.dom.dateInput.value;
        const priority = this.dom.prioritySelect.value;
        
        if (!task) {
            this.showAlert('Please enter a task description', 'error');
            return;
        }
        
        const newTodo = {
            id: Date.now().toString(),
            task,
            dueDate,
            priority: priority || 'medium',
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        this.todos.unshift(newTodo);
        this.saveToLocalStorage();
        this.updateStats();
        this.renderTodos();
        this.showAlert('Task added successfully', 'success');
        this.dom.taskInput.value = '';
        this.dom.dateInput.value = '';
        this.dom.prioritySelect.value = '';
        this.dom.taskInput.focus();
    }
    
    renderTodos() {
        this.dom.todosList.innerHTML = '';
        
        let filteredTodos = this.filterTodos();
        filteredTodos = this.searchTodos(filteredTodos);
        
        if (filteredTodos.length === 0) {
            this.dom.noTasksRow.style.display = '';
            return;
        }
        
        this.dom.noTasksRow.style.display = 'none';
        
        filteredTodos.forEach(todo => {
            const isOverdue = this.checkIfOverdue(todo.dueDate);
            const todoRow = document.createElement('tr');
            
            todoRow.innerHTML = `
                <td>
                    <div class="todo-task">
                        <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} 
                            data-id="${todo.id}">
                        <span class="todo-text ${todo.completed ? 'completed' : ''}">${todo.task}</span>
                    </div>
                </td>
                <td>
                    <span class="priority-badge priority-${todo.priority}">
                        ${todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}
                    </span>
                </td>
                <td>
                    <span class="due-date ${isOverdue && !todo.completed ? 'overdue' : ''}">
                        ${todo.dueDate ? new Date(todo.dueDate).toLocaleDateString() : 'No date'}
                        ${isOverdue && !todo.completed ? ' (Overdue)' : ''}
                    </span>
                </td>
                <td>
                    <button class="action-btn edit-btn" data-id="${todo.id}">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="action-btn delete-btn" data-id="${todo.id}">
                        <i class="bi bi-trash"></i>
                    </button>
                    <button class="action-btn" data-id="${todo.id}">
                        <i class="bi bi-flag"></i>
                    </button>
                </td>
            `;
            
            this.dom.todosList.appendChild(todoRow);
        });
        
        document.querySelectorAll('.todo-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.toggleTodoStatus(e.target.dataset.id);
            });
        });
        
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.editTodo(e.target.closest('button').dataset.id);
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.deleteTodo(e.target.closest('button').dataset.id);
            });
        });
    }
    
    filterTodos() {
        const today = new Date().toISOString().split('T')[0];
        
        switch (this.currentFilter) {
            case 'all':
                return [...this.todos];
            case 'pending':
                return this.todos.filter(todo => !todo.completed);
            case 'completed':
                return this.todos.filter(todo => todo.completed);
            case 'overdue':
                return this.todos.filter(todo => 
                    !todo.completed && 
                    todo.dueDate && 
                    todo.dueDate < today
                );
            default:
                return [...this.todos];
        }
    }
    
    searchTodos(todos) {
        if (!this.searchQuery) return todos;
        
        return todos.filter(todo => 
            todo.task.toLowerCase().includes(this.searchQuery) ||
            (todo.dueDate && todo.dueDate.includes(this.searchQuery)) ||
            todo.priority.toLowerCase().includes(this.searchQuery)
        );
    }
    
    checkIfOverdue(dueDate) {
        if (!dueDate) return false;
        
        const today = new Date();
        const due = new Date(dueDate);
        return due < today;
    }
    
    toggleTodoStatus(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveToLocalStorage();
            this.updateStats();
            this.renderTodos();
            
            const status = todo.completed ? 'completed' : 'marked as pending';
            this.showAlert(`Task "${todo.task}" ${status}`, 'success');
        }
    }
    
    editTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (!todo) return;
        
        this.dom.taskInput.value = todo.task;
        this.dom.dateInput.value = todo.dueDate || '';
        this.dom.prioritySelect.value = todo.priority;
        
        this.dom.addBtn.innerHTML = '<i class="bi bi-check-lg"></i> Save Changes';
        
        const newAddBtn = this.dom.addBtn.cloneNode(true);
        this.dom.addBtn.parentNode.replaceChild(newAddBtn, this.dom.addBtn);
        this.dom.addBtn = newAddBtn;
        
        this.dom.addBtn.addEventListener('click', () => {
            const updatedTask = this.dom.taskInput.value.trim();
            const updatedDate = this.dom.dateInput.value;
            const updatedPriority = this.dom.prioritySelect.value;
            
            if (!updatedTask) {
                this.showAlert('Task cannot be empty', 'error');
                return;
            }
            
            todo.task = updatedTask;
            todo.dueDate = updatedDate;
            todo.priority = updatedPriority || 'medium';
            this.saveToLocalStorage();
            this.updateStats();
            this.renderTodos();
            this.showAlert('Task updated successfully', 'success');
            this.dom.taskInput.value = '';
            this.dom.dateInput.value = '';
            this.dom.prioritySelect.value = '';
            this.dom.addBtn.innerHTML = '<i class="bi bi-plus-lg"></i> Add Task';
            const originalAddBtn = this.dom.addBtn.cloneNode(true);
            this.dom.addBtn.parentNode.replaceChild(originalAddBtn, this.dom.addBtn);
            this.dom.addBtn = originalAddBtn;
            this.dom.addBtn.addEventListener('click', () => this.addTodo());
        });
    }
    deleteTodo(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.todos = this.todos.filter(todo => todo.id !== id);
            this.saveToLocalStorage();
            this.updateStats();
            this.renderTodos();
            this.showAlert('Task deleted successfully', 'success');
        }
    }
    updateStats() {
        const today = new Date().toISOString().split('T')[0];
        
        this.dom.stats.total.textContent = this.todos.length;
        this.dom.stats.completed.textContent = this.todos.filter(t => t.completed).length;
        this.dom.stats.pending.textContent = this.todos.filter(t => !t.completed).length;
        this.dom.stats.overdue.textContent = this.todos.filter(t => 
            !t.completed && t.dueDate && t.dueDate < today
        ).length;
    }
    
    saveToLocalStorage() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }
    
    showAlert(message, type) {
        this.dom.alertMessage.textContent = message;
        this.dom.alertMessage.className = `alert-message show alert-${type}`;
        
        setTimeout(() => {
            this.dom.alertMessage.className = 'alert-message hide';
        }, 3000);
    }
}
document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});