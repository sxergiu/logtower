import {effect, inject, Injectable, signal} from '@angular/core';
import {TaskModel} from "../models/task.model";
import {invoke} from "@tauri-apps/api/core";
import {ProjectService} from "./project.service";
import {SettingsService} from "./settings.service";

@Injectable({
  providedIn: 'root'
})
export class TaskService {

  projectService = inject(ProjectService);
  settingsService = inject(SettingsService);

  projects = this.projectService.projects;
  tasksByProject = signal<{ [projectId: number]: TaskModel[] }>({});

  constructor() {
    effect(() => {
      const projects = this.projects();
      if (projects.length > 0) {
        this.fetchTasks();
      }
    });
  }
  async fetchTasks() {
    const tasksMap: { [projectId: number]: TaskModel[] } = {};
    for (const project of this.projects()) {
      tasksMap[project.id] = await this.getTasksForProject(project.id);
    }
    this.tasksByProject.set(tasksMap);
  }
  async getTasksForProject(projectId: number): Promise<TaskModel[]> {
    return await invoke<TaskModel[]>('get_tasks_for_project', { projectId });
  }
  async getTaskById(taskId: number): Promise<TaskModel | null> {
    return await invoke<TaskModel | null>('get_task_by_id', { taskId });
  }

  async addTask(projectId: number, name: string): Promise<void> {
    const newTask = await invoke<TaskModel>('add_task', { projectId, name });
    this.tasksByProject.update(prev => ({
      ...prev,
      [projectId]: [
        ...(prev[projectId] ?? []),
        newTask
      ]
    }));
  }
  async deleteTask(taskId: number): Promise<void> {

    const currentSettings = this.settingsService.userSettings();

    if (currentSettings?.activeTaskId === taskId) {
      this.settingsService.userSettings.update(s => ({
        ...(s ?? { activeProjectId: null, activeTaskId: null }),
        activeTaskId: null,
        activeProjectId: null
      }));
    }
    await invoke<void>('delete_task', { taskId });
    await invoke('emit_logs_updated');
  }

  async renameTask(id: number, newName: string) {
     await invoke("edit_task", {taskId: id, newName});
     await invoke('emit_logs_updated');
  }
}
