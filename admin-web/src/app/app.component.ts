import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
// import { SSOService } from "./service/sso.service";

@Component({
  selector: "app-root",
  imports: [RouterOutlet],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
  standalone: true,
})
export class AppComponent {
  // constructor(private ssoService: SSOService) {
  //   // this.ssoService.initSSO();
  // }
  title = "admin-web";
}
