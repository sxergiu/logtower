import {Component, inject, signal} from '@angular/core';
import { Router } from '@angular/router';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SettingsService } from '../service/settings.service';
import { Project } from '../models/project.model';
import { Task } from '../models/task.model';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, NgOptimizedImage],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})

export class Settings {

  router = inject(Router);
  private settingsService = inject(SettingsService);

  // signals for state
  settings = this.settingsService.userSettings;
  projects = this.settingsService.projects;
  tasksByProject = this.settingsService.tasksByProject;

  // form inputs
  newProjectName = signal('');
  newTaskName = signal('');

  get activeProject(): Project | null {
    const settings = this.settings();
    if (!settings?.activeProjectId) return null;
    return this.projects().find((p) => p.id === settings.activeProjectId) ?? null;
  }

  get activeTask(): Task | null {
    const settings = this.settings();
    const project = this.activeProject;
    if (!settings?.activeTaskId || !project) return null;
    return this.tasksByProject()[project.id]?.find((t) => t.id === settings.activeTaskId) ?? null;
  }

  async setActiveProject(projectId: number | null) {
    // Update local settings immediately
    this.settings.update(s => s ? { ...s, activeProjectId: projectId, activeTaskId: null } : s);

    // Optionally fetch tasks if not already loaded
    if (projectId && !this.tasksByProject()[projectId]?.length) {
      const tasks = await this.settingsService.getTasksForProject(projectId);
      this.tasksByProject.update(map => ({ ...map, [projectId]: tasks }));
    }

    // Persist on backend
    await this.settingsService.setActiveProject(projectId ?? null);
    await this.settingsService.loadData();
  }

  async setActiveTask(taskId: number | null) {
    this.settings.update(s => s ? { ...s, activeTaskId: taskId } : s);
    await this.settingsService.setActiveTask(taskId ?? null);
  }

  async addProject() {
    const name = this.newProjectName().trim();
    if (!name) return;
    await this.settingsService.addProject(name);
    this.newProjectName.set('');
  }

  async addTask(projectId: number) {
    const name = this.newTaskName().trim();
    if (!name) return;
    await this.settingsService.addTask(projectId, name);
    this.newTaskName.set('');
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

}
