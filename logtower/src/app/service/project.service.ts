import {Injectable, signal} from '@angular/core';
import {invoke} from "@tauri-apps/api/core";
import {Project} from "../models/project.model";

@Injectable({
  providedIn: 'root'
})
export class ProjectService {

  projects = signal<Project[]>([]);

  constructor() {
    this.fetchProjects();
  }

  private async fetchProjects() {
    const projects = await this.getAllProjects(); // API call
    this.projects.set(projects);
  }

  async getAllProjects(): Promise<Project[]> {
    return await invoke<Project[]>('get_all_projects');
  }

  async getProjectById(projectId: number): Promise<Project | null> {
    return await invoke<Project | null>('get_project_by_id', { projectId });
  }

  async addProject(name: string): Promise<void> {
    const newProject = await invoke<Project>('add_project', { name });
    this.projects.update(prev => [...prev, newProject]);
  }

  async deleteProject(projectId: number) {
    await invoke('delete_project', { projectId });
    await invoke('emit_logs_updated');
  }

  async renameProject(id: number, newName: string) {
    await invoke("edit_project", {projectId: id, newName});
    await invoke('emit_logs_updated');
  }
}
