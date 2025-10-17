import {Component, computed, inject, signal} from '@angular/core';
import {Router} from "@angular/router";
import {FormsModule} from "@angular/forms";
import {NgOptimizedImage} from "@angular/common";
import {ProjectService} from "../service/project.service";
import {TaskService} from "../service/task.service";
import {SettingsDrawer} from "../settings-drawer/settings-drawer";

@Component({
  selector: 'app-manage-projects',
  imports: [
    FormsModule,
    NgOptimizedImage,
    SettingsDrawer,
  ],
  templateUrl: './manage-projects.html',
  styleUrl: './manage-projects.css'
})
export class ManageProjects {

  router = inject(Router);

  projectService = inject(ProjectService);
  taskService = inject(TaskService);

  projects = this.projectService.projects;
  tasksByProject = this.taskService.tasksByProject;

  newProjectName = signal<string>('');
  searchQuery = signal<string>(''); // New signal for search
  newTaskNames: { [key: number]: string } = {};

  editingProject: number | null = null;
  editingTask: { projectId: number; taskId: number } | null = null;
  editProjectValue: string = '';
  editTaskValue: string = '';

  showEditButtons: number | null = null;
  expandedProject: number | null = null;

  // Computed signal for filtered projects
  filteredProjects = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) {
      return this.projects();
    }
    return this.projects().filter(project =>
        project.name.toLowerCase().includes(query)
    );
  });

  async addProject() {
    const name = this.newProjectName().trim();
    if (!name) return;
    await this.projectService.addProject(name);
    this.newProjectName.set('');
  }

  deleteProject(projectId: number): void {
    this.projectService.deleteProject(projectId).then(() => {
      this.projects.set(this.projects().filter(p => p.id !== projectId));
    });
  }

  saveProjectEdit(projectId: number): void {
    if (this.editProjectValue.trim()) {
      this.projects.set(
          this.projects().map(project =>
              project.id === projectId
                  ? { ...project, name: this.editProjectValue.trim() }
                  : project
          )
      );
    }
    this.projectService.renameProject(projectId, this.editProjectValue);
    this.editingProject = null;
    this.editProjectValue = '';
  }

  cancelProjectEdit(): void {
    this.editingProject = null;
    this.editProjectValue = '';
  }

  addTask(projectId: number): void {
    const taskName = this.newTaskNames[projectId];
    if (taskName && taskName.trim()) {
      this.taskService.addTask(projectId, taskName);
      this.newTaskNames[projectId] = '';
    }
  }

  deleteTask(projectId: number, taskId: number): void {
    this.taskService.deleteTask(taskId);
    const tasks = this.tasksByProject();
    this.tasksByProject.set({
      ...tasks,
      [projectId]: tasks[projectId].filter(t => t.id !== taskId)
    });
  }

  startEditTask(projectId: number, task: any): void {
    this.editingTask = { projectId, taskId: task.id };
    this.editTaskValue = task.name;
  }

  saveTaskEdit(projectId: number, taskId: number): void {
    if (this.editTaskValue.trim()) {
      const tasks = this.tasksByProject();
      this.tasksByProject.set({
        ...tasks,
        [projectId]: tasks[projectId].map(task =>
            task.id === taskId
                ? { ...task, name: this.editTaskValue.trim() }
                : task
        )
      });
    }
    this.taskService.renameTask(taskId, this.editTaskValue);
    this.editingTask = null;
    this.editTaskValue = '';
  }

  cancelTaskEdit(): void {
    this.editingTask = null;
    this.editTaskValue = '';
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  startEditProject(project: any): void {
    this.expandedProject = project.id;
    this.editingProject = project.id;
    this.editProjectValue = project.name;
  }

  toggleEditButtons(projectId: number): void {
    this.editingProject = null;
    this.editingTask = null;

    if (this.showEditButtons === projectId) {
      this.showEditButtons = null;
    } else {
      this.showEditButtons = projectId;
    }
  }

  toggleProject(projectId: number): void {
    this.editingProject = null;
    this.editingTask = null;

    if (this.expandedProject === projectId) {
      this.expandedProject = null;
      this.showEditButtons = null;
    } else {
      this.expandedProject = projectId;
      this.showEditButtons = null;
    }
  }

  isAddProjectToggled = false;
    toggleAddProject() {
        this.isAddProjectToggled = !this.isAddProjectToggled;
    }
}