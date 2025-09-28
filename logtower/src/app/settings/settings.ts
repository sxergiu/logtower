import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SettingsService } from '../service/settings.service';
import { Project } from '../models/project.model';
import { Task } from '../models/task.model';
import { UserSettings } from '../models/user-settings.model';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings {
  router = inject(Router);
  private settingsService = inject(SettingsService);

  // signals for state
  settings = signal<UserSettings | null>(null);
  projects = signal<Project[]>([]);
  tasksByProject = signal<{ [projectId: number]: Task[] }>({});

  loading = signal(true);
  error = signal<string | null>(null);

  // form inputs
  newProjectName = signal('');
  newTaskName = signal('');

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.loading.set(true);
    this.error.set(null);

    try {
      const settings = await this.settingsService.getCurrentSettings().catch(() => ({
        id: 0,
        activeProjectId: null,
        activeTaskId: null,
      }));
      this.settings.set(settings);

      const projects = await this.settingsService.getAllProjects();
      this.projects.set(projects);

      const tasksMap: { [projectId: number]: Task[] } = {};
      for (const project of projects) {
        const tasks = await this.settingsService.getTasksForProject(project.id);
        tasksMap[project.id] = tasks;
      }
      this.tasksByProject.set(tasksMap);
    } catch (err: any) {
      this.error.set(err.message ?? 'Failed to load data');
    } finally {
      this.loading.set(false);
    }
  }

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
    await this.settingsService.setActiveProject(projectId ?? undefined);
    await this.loadData();
  }

  async setActiveTask(taskId: number | null) {
    await this.settingsService.setActiveTask(taskId ?? undefined);
    await this.loadData();
  }

  async addProject() {
    const name = this.newProjectName().trim();
    if (!name) return;
    await this.settingsService.addProject(name);
    this.newProjectName.set('');
    await this.loadData();
  }

  async addTask(projectId: number) {
    const name = this.newTaskName().trim();
    if (!name) return;
    await this.settingsService.addTask(projectId, name);
    this.newTaskName.set('');
    await this.loadData();
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
