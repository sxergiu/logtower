import {Component, inject} from '@angular/core';
import {Router} from "@angular/router";

@Component({
  selector: 'app-manage-projects',
  imports: [],
  templateUrl: './manage-projects.html',
  styleUrl: './manage-projects.css'
})
export class ManageProjects {

  router = inject(Router);
  goToSettings() {
    this.router.navigate(['settings']);
  }
}
