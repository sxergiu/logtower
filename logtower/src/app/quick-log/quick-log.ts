import {AfterViewInit, Component, computed, effect, ElementRef, inject, signal, ViewChild} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LogService } from '../service/log.service';
import { SettingsService } from '../service/settings.service';
import { TaskService } from '../service/task.service';
import {ProjectService} from "../service/project.service";
import {getCurrentWebviewWindow} from "@tauri-apps/api/webviewWindow";

@Component({
  selector: 'app-quick-log',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './quick-log.html',
  styleUrls: ['./quick-log.css'],
})
export class QuickLog implements AfterViewInit {
  @ViewChild('logInput') logInput!: ElementRef<HTMLInputElement>;

  private logService = inject(LogService);
  private settingsService = inject(SettingsService);
  private taskService = inject(TaskService);
  private projectService = inject(ProjectService);

  settings = this.settingsService.userSettings;
  projects = this.projectService.projects;
  tasksByProject = this.taskService.tasksByProject;

  projectsWithTasks = computed(() =>
      this.projects().filter(p => (this.tasksByProject()[p.id] ?? []).length > 0));

  pickedProjectId = signal<number | null>(null);
  pickedTaskId = signal<number | null>(null);

  pickedTasks = computed(() => {
    const projectId = this.pickedProjectId();
    return projectId === null ? [] : this.tasksByProject()[projectId] ?? [];
  });

  differsFromDefault = computed(() => {
    const taskId = this.pickedTaskId();
    return !!this.settings() && taskId !== null && taskId !== (this.settings()?.activeTaskId ?? null);
  });

  savedAsDefault = signal(false);
  private savedAsDefaultTimer?: ReturnType<typeof setTimeout>;

  newMessage = '';

  constructor() {
    // Seeds the picks once: a later settings reload must not overwrite what the
    // user picked here, only what "set as default" compares it against.
    const seed = effect(() => {
      const settings = this.settings();
      if (!settings) return;
      this.pickedProjectId.set(settings.activeProjectId ?? null);
      this.pickedTaskId.set(settings.activeTaskId ?? null);
      seed.destroy();
    });
  }

  ngAfterViewInit() {
    setTimeout(() => this.logInput.nativeElement.focus(), 0);
  }

  onProjectChange(projectId: number) {
    this.pickedProjectId.set(projectId);
    this.pickedTaskId.set(this.tasksByProject()[projectId]?.[0]?.id ?? null);
    this.savedAsDefault.set(false);
  }

  onTaskChange(taskId: number) {
    this.pickedTaskId.set(taskId);
    this.savedAsDefault.set(false);
  }

  async setAsDefault() {
    const projectId = this.pickedProjectId();
    const taskId = this.pickedTaskId();
    if (projectId === null || taskId === null) return;
    // Before the task: setting the project also resets the active task to its first one.
    if (projectId !== this.settings()?.activeProjectId) {
      await this.settingsService.setActiveProject(projectId);
    }
    await this.settingsService.setActiveTask(taskId);
    this.savedAsDefault.set(true);
    clearTimeout(this.savedAsDefaultTimer);
    this.savedAsDefaultTimer = setTimeout(() => this.savedAsDefault.set(false), 1500);
  }

  async addLog() {
    const taskId = this.pickedTaskId();
    if (!this.newMessage.trim() || taskId === null) return;
    await this.logService.addLog(this.newMessage, taskId);
    this.newMessage = '';
    await this.closeWindow();
  }

  async closeWindow() {
    await getCurrentWebviewWindow().close();
  }
}
