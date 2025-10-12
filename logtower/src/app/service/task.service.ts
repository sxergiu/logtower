import {effect, inject, Injectable, signal} from '@angular/core';
import {Task} from "../models/task.model";
import {invoke} from "@tauri-apps/api/core";
import {ProjectService} from "./project.service";

@Injectable({
  providedIn: 'root'
})
export class TaskService {

  projectService = inject(ProjectService);

  projects = this.projectService.projects;
  tasksByProject = signal<{ [projectId: number]: Task[] }>({});

  constructor() {
    effect(() => {
      const projects = this.projects();
      if (projects.length > 0) {
        this.fetchTasks();
      }
    });
  }
  async fetchTasks() {
    const tasksMap: { [projectId: number]: Task[] } = {};
    for (const project of this.projects()) {
      tasksMap[project.id] = await this.getTasksForProject(project.id);
    }
    this.tasksByProject.set(tasksMap);
  }
  async getTasksForProject(projectId: number): Promise<Task[]> {
    return await invoke<Task[]>('get_tasks_for_project', { projectId });
  }
  async getTaskById(taskId: number): Promise<Task | null> {
    return await invoke<Task | null>('get_task_by_id', { taskId });
  }

  async addTask(projectId: number, name: string): Promise<Task> {
    return await invoke<Task>('add_task', { projectId, name });
  }
  async deleteTask(taskId: number): Promise<void> {
    return await invoke<void>('delete_task', { taskId });
  }
}
