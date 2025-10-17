import {AfterViewInit, Component, ElementRef, ViewChild} from '@angular/core';
import {FormsModule} from "@angular/forms";
import {LogService} from "../service/log.service";
import { Window } from '@tauri-apps/api/window';

@Component({
  selector: 'app-quick-log',
  imports: [
    FormsModule
  ],
  templateUrl: './quick-log.html',
  styleUrl: './quick-log.css'
})
export class QuickLog implements AfterViewInit{

  newMessage = '';
  constructor(private logService: LogService) {}

  @ViewChild('logInput') logInput!: ElementRef<HTMLInputElement>;

  ngAfterViewInit() {
    // Give Angular a tick to render the input before focusing
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
      const appWindow = await Window.getByLabel("quick-log");
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
