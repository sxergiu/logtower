import {AfterViewInit, Component, computed, effect, ElementRef, signal, ViewChild} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LogService } from '../service/log.service';
import { Window } from '@tauri-apps/api/window';
import { SettingsService } from '../service/settings.service';
import { TaskService } from '../service/task.service';
import { TaskModel} from "../models/task.model";
import {ProjectModel} from "../models/project.model";
import {ProjectService} from "../service/project.service";
import {listen} from "@tauri-apps/api/event";

@Component({
  selector: 'app-quick-log',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './quick-log.html',
  styleUrls: ['./quick-log.css'],
})
export class QuickLog implements AfterViewInit {
  @ViewChild('logInput') logInput!: ElementRef<HTMLInputElement>;


  activeProjectId = computed(() => this.settingsService.userSettings()?.activeProjectId ?? null);
  activeTaskId = computed(() => this.settingsService.userSettings()?.activeTaskId ?? null);

  activeProject = signal<ProjectModel | null>(null);
  activeTask = signal<TaskModel | null>(null);

  newMessage = '';

  constructor(
      private logService: LogService,
      private settingsService: SettingsService,
      private taskService: TaskService,
      private projectService: ProjectService
  ) {
    // watch for changes to activeTaskId and load the task reactively
    effect(() => {
      const taskId = this.activeTaskId();
      const projectId = this.activeProjectId();

      if (taskId && taskId > 0) {
        this.loadTask(taskId);
        this.activeTask.set(null);
      }

      if (projectId && projectId > 0) {
        this.loadProject(projectId);
      } else {
        this.activeProject.set(null);
      }
    });

    listen('settings-updated', async () => {
      await this.settingsService.loadData();
    });
  }

  private async loadProject(projectId: number) {
    const project = await this.projectService.getProjectById(projectId);
    this.activeProject.set(project);
  }
  private async loadTask(taskId: number) {
    const task = await this.taskService.getTaskById(taskId);
    this.activeTask.set(task);
  }

  ngAfterViewInit() {
    // Focus input after view init
    setTimeout(() => this.logInput.nativeElement.focus(), 0);
  }

  async addLog() {
    if (!this.newMessage.trim()) return;
    await this.logService.addLog(this.newMessage);
    this.newMessage = '';
    await this.closeWindow();
  }

  async closeWindow() {
    try {
      const appWindow = await Window.getByLabel('quick-log');
      if (appWindow) {
        await appWindow.close();
      } else {
        console.error('Window with label "quick-log" not found');
      }
    } catch (error) {
      console.error('Error closing window:', error);
    }
  }

  protected readonly close = close;
}
