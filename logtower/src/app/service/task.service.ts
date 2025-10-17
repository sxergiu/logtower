import {effect, inject, Injectable, signal} from '@angular/core';
import {TaskEntry} from "../models/task-entry.model";
import {invoke} from "@tauri-apps/api/core";
import {ProjectService} from "./project.service";

@Injectable({
  providedIn: 'root'
})
export class TaskService {

  projectService = inject(ProjectService);

  projects = this.projectService.projects;
  tasksByProject = signal<{ [projectId: number]: TaskEntry[] }>({});

  constructor() {
    effect(() => {
      const projects = this.projects();
      if (projects.length > 0) {
        this.fetchTasks();
      }
    });
  }
  async fetchTasks() {
    const tasksMap: { [projectId: number]: TaskEntry[] } = {};
    for (const project of this.projects()) {
      tasksMap[project.id] = await this.getTasksForProject(project.id);
    }
    this.tasksByProject.set(tasksMap);
  }
  async getTasksForProject(projectId: number): Promise<TaskEntry[]> {
    return await invoke<TaskEntry[]>('get_tasks_for_project', { projectId });
  }
  async getTaskById(taskId: number): Promise<TaskEntry | null> {
    return await invoke<TaskEntry | null>('get_task_by_id', { taskId });
  }

  async addTask(projectId: number, name: string): Promise<void> {
    const newTask = await invoke<TaskEntry>('add_task', { projectId, name });
    this.tasksByProject.update(prev => ({
      ...prev,
      [projectId]: [
        ...(prev[projectId] ?? []),
        newTask
      ]
    }));
  }
  async deleteTask(taskId: number): Promise<void> {
    await invoke<void>('delete_task', { taskId });
    await invoke('emit_logs_updated');
  }

  async renameTask(id: number, newName: string) {
     await invoke("edit_task", {taskId: id, newName});
     await invoke('emit_logs_updated');
  }
}
