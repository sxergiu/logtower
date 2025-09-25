import {Component, inject} from '@angular/core';
import {Router} from "@angular/router";

@Component({
  selector: 'app-settings',
  imports: [],
  templateUrl: './settings.html',
  styleUrl: './settings.css'
})
export class Settings {

  router = inject(Router);

  goToDashboard() {
    this.router.navigate(['/dashboard'])
  }
}
