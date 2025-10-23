import {Component, effect, inject, output} from '@angular/core';
import {CommonModule} from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SettingsService } from '../service/settings.service';
import { ProjectModel } from '../models/project.model';
import { TaskModel } from '../models/task.model';
import {TaskService} from "../service/task.service";
import {ProjectService} from "../service/project.service";

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})

export class Settings {

  private settingsService = inject(SettingsService);
  private taskService = inject(TaskService);
  private projectService = inject(ProjectService);

  settings = this.settingsService.userSettings;
  projects = this.projectService.projects;
  tasksByProject = this.taskService.tasksByProject;

  noProjects = output<boolean>();
  noTasksProject = output<boolean>();

  constructor() {
    effect(() => {
      const list = this.projects();
      this.noProjects.emit(list.length === 0);
    });
    effect(() => {
      const map = this.tasksByProject() as Record<number, TaskModel[]>;
      const anyEmpty = this.projects().some(p => (map[p.id] ?? []).length === 0);
      this.noTasksProject.emit(anyEmpty.valueOf());
    })
  }

  get activeProject(): ProjectModel | null {
    const settings = this.settings();
    if (!settings?.activeProjectId) return null;
    return this.projects().find((p) => p.id === settings.activeProjectId) ?? null;
  }

  get activeTask(): TaskModel | null {
    const settings = this.settings();
    const project = this.activeProject;
    if (!settings?.activeTaskId || !project) return null;
    return this.tasksByProject()[project.id]?.find((t) => t.id === settings.activeTaskId) ?? null;
  }

  async setActiveProject(projectId: number | null) {

    this.settings.update(s => s ? { ...s, activeProjectId: projectId, activeTaskId: null } : s);

    await this.settingsService.setActiveProject(projectId ?? null);
    await this.settingsService.reloadSettings();
    await this.settingsService.loadData();
  }

  async setActiveTask(taskId: number | null) {

    this.settings.update(s => s ? { ...s, activeTaskId: taskId } : s);
    await this.settingsService.setActiveTask(taskId ?? null);
    await this.settingsService.reloadSettings();
    await this.settingsService.loadData();
  }

}
