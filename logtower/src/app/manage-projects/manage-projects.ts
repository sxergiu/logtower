import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgOptimizedImage } from '@angular/common';
import { ProjectService } from '../service/project.service';
import { TaskService } from '../service/task.service';
import { SettingsDrawer } from '../settings-drawer/settings-drawer';

@Component({
  selector: 'app-manage-projects',
  imports: [FormsModule, NgOptimizedImage, SettingsDrawer],
  templateUrl: './manage-projects.html',
  styleUrl: './manage-projects.css'
})
export class ManageProjects {
  router = inject(Router);
  projectService = inject(ProjectService);
  taskService = inject(TaskService);

  projects = this.projectService.projects;
  tasksByProject = this.taskService.tasksByProject;

  newProjectName = signal('');
  searchQuery = signal('');
  newTaskNames: { [key: number]: string } = {};

  editingProject: number | null = null;
  editingTask: { projectId: number; taskId: number } | null = null;
  editProjectValue = '';
  editTaskValue = '';

  showEditButtons: number | null = null;
  expandedProject: number | null = null;

  filteredProjects = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    return q ? this.projects().filter(p => p.name.toLowerCase().includes(q)) : this.projects();
  });

  isAddProjectToggled = false;
  toggleAddProject() {
    this.isAddProjectToggled = !this.isAddProjectToggled;
  }

  private clearProjectEdit() {
    this.editingProject = null;
    this.editProjectValue = '';
  }
  private clearTaskEdit() {
    this.editingTask = null;
    this.editTaskValue = '';
  }
  private toggleId(current: number | null, id: number) {
    return current === id ? null : id;
  }

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
    const name = this.editProjectValue.trim();
    if (name) {
      this.projects.set(this.projects().map(p => (p.id === projectId ? { ...p, name } : p)));
    }
    this.projectService.renameProject(projectId, this.editProjectValue);
    this.clearProjectEdit();
  }

  cancelProjectEdit(): void {
    this.clearProjectEdit();
  }

  startEditProject(project: any): void {
    this.expandedProject = project.id;
    this.editingProject = project.id;
    this.editProjectValue = project.name;
  }

  toggleEditButtons(projectId: number): void {
    this.editingProject = null;
    this.editingTask = null;
    this.showEditButtons = this.toggleId(this.showEditButtons, projectId);
  }

  toggleProject(projectId: number): void {
    this.editingProject = null;
    this.editingTask = null;
    const willCollapse = this.expandedProject === projectId;
    this.expandedProject = willCollapse ? null : projectId;
    this.showEditButtons = null;
  }

  addTask(projectId: number): void {
    const name = this.newTaskNames[projectId]?.trim();
    if (!name) return;
    this.taskService.addTask(projectId, name);
    this.newTaskNames[projectId] = '';
  }

  deleteTask(projectId: number, taskId: number): void {
    this.taskService.deleteTask(taskId);
    const tasks = this.tasksByProject();
    this.tasksByProject.set({ ...tasks, [projectId]: tasks[projectId].filter(t => t.id !== taskId) });
  }

  startEditTask(projectId: number, task: any): void {
    this.editingTask = { projectId, taskId: task.id };
    this.editTaskValue = task.name;
  }

  saveTaskEdit(projectId: number, taskId: number): void {
    const name = this.editTaskValue.trim();
    if (name) {
      const tasks = this.tasksByProject();
      this.tasksByProject.set({
        ...tasks,
        [projectId]: tasks[projectId].map(t => (t.id === taskId ? { ...t, name } : t))
      });
    }
    this.taskService.renameTask(taskId, this.editTaskValue);
    this.clearTaskEdit();
  }

  cancelTaskEdit(): void {
    this.clearTaskEdit();
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}