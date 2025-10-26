import {inject, Injectable, signal} from '@angular/core';
import {invoke} from "@tauri-apps/api/core";
import {ProjectModel} from "../models/project.model";
import {SettingsService} from "./settings.service";

@Injectable({
  providedIn: 'root'
})
export class ProjectService {

  settingsService = inject(SettingsService);

  projects = signal<ProjectModel[]>([]);

  constructor() {
    this.fetchProjects();
  }

  private async fetchProjects() {
    const projects = await this.getAllProjects(); // API call
    this.projects.set(projects);
  }

  async getAllProjects(): Promise<ProjectModel[]> {
    return await invoke<ProjectModel[]>('get_all_projects');
  }

  async getProjectById(projectId: number): Promise<ProjectModel | null> {
    return await invoke<ProjectModel | null>('get_project_by_id', { projectId });
  }

  async addProject(name: string): Promise<void> {
    const newProject = await invoke<ProjectModel>('add_project', { name });
    this.projects.update(prev => [newProject,...prev]);
  }

  async deleteProject(projectId: number) {

    const currentSettings = this.settingsService.userSettings();

    if (currentSettings?.activeProjectId === projectId) {
      this.settingsService.userSettings.update(s => ({
        ...(s ?? { activeProjectId: null, activeTaskId: null }),
        activeProjectId: null,
      }));
    }

    await invoke('delete_project', { projectId });
    await invoke('emit_logs_updated');
  }

  async renameProject(id: number, newName: string) {
    await invoke("edit_project", {projectId: id, newName});
    await invoke('emit_logs_updated');
  }
}
