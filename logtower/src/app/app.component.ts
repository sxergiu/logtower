import {Component, OnInit, inject} from '@angular/core';
import {ActivatedRoute, Router, RouterOutlet} from "@angular/router";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  router = inject(Router);
  route = inject(ActivatedRoute);

  async ngOnInit() {

    this.route.queryParams.subscribe(params => {
      if (params['route']) {
        this.router.navigate([`/${params['route']}`]);
      }
    });
  }
}