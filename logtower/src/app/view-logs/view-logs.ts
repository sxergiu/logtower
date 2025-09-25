import {Component, inject} from '@angular/core';
import {Router} from "@angular/router";

@Component({
  selector: 'app-view-logs',
  imports: [],
  templateUrl: './view-logs.html',
  styleUrl: './view-logs.css'
})
export class ViewLogs {

  router = inject(Router);
  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
