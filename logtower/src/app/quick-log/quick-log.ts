import { Component } from '@angular/core';
import {FormsModule} from "@angular/forms";
import {LogService} from "../service/log.service";

@Component({
  selector: 'app-quick-log',
  imports: [
    FormsModule
  ],
  templateUrl: './quick-log.html',
  styleUrl: './quick-log.css'
})
export class QuickLog {

  newMessage = '';
  constructor(private logService: LogService) {}

  async addLog() {
    if (!this.newMessage.trim()) return;
    await this.logService.addLog(this.newMessage);
    this.newMessage = '';
  }

}
