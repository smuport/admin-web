import { inject, Injectable } from "@angular/core";

import { ActivatedRoute } from "@angular/router";
import { WindowService } from "./common/window.service";
import { LocalStorageService } from "./local-storage.service";
import { LoginInOutService } from "./login-in-out.service";

@Injectable({
  providedIn: "root",
})
export class StartupService {
  private loginInOutService = inject(LoginInOutService);
  private windowSer = inject(WindowService);
  private LocalStorageService = inject(LocalStorageService);
  private activatedRoute = inject(ActivatedRoute);
  load(): Promise<void> {
    this.activatedRoute.queryParams.subscribe((params) => {
      // 1. 获取参数
      const token = params["token"];
      const roleGrade = params["roleGrade"];
      const userName = params["userName"];
      const userId = params["userId"];
      const isAdminSystem = params["isAdminSystem"];
      const refreshTokenExpires = params["refreshTokenExpires"];

      const accessTokenExpires = params["accessTokenExpires"];
      const refreshToken = params["refreshToken"];
      const tokenSetTime = params["tokenSetTime"];
      // 2. 存 localStorage 并清理 URL
      let needReplace = false;
      const url = new URL(window.location.href);
      if (refreshTokenExpires) {
        localStorage.setItem("refreshTokenExpires", refreshTokenExpires);
        url.searchParams.delete("refreshTokenExpires");
        needReplace = true;
      }
      if (tokenSetTime) {
        localStorage.setItem("tokenSetTime", tokenSetTime);
        url.searchParams.delete("tokenSetTime");
        needReplace = true;
      }
      if (accessTokenExpires) {
        localStorage.setItem("accessTokenExpires", accessTokenExpires);
        url.searchParams.delete("accessTokenExpires");

        needReplace = true;
      }

      if (isAdminSystem) {
        localStorage.setItem("isAdminSystem", isAdminSystem);
        url.searchParams.delete("isAdminSystem");
        needReplace = true;
      }
      if (roleGrade) {
        localStorage.setItem("roleGrade", roleGrade);
        url.searchParams.delete("roleGrade");
        needReplace = true;
      }
      if (userName) {
        localStorage.setItem("userName", userName);
        url.searchParams.delete("userName");
        needReplace = true;
      }
      if (token) {
        localStorage.setItem("accessToken", token);
        url.searchParams.delete("token");
        needReplace = true;
      }
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
        url.searchParams.delete("refreshToken");
        needReplace = true;
      }
      if (userId) {
        localStorage.setItem("userId", userId);
        url.searchParams.delete("userId");
      }
      if (needReplace) {
        window.history.replaceState({}, "", url.pathname + url.search);
      }
    });
    // const token = this.windowSer.getSessionStorage('Tokenkey')
    const token = this.LocalStorageService.getItem("Tokenkey");

    if (token) {
      return this.loginInOutService.loginIn(token);
    }
    return new Promise((resolve) => {
      return resolve();
    });
  }
}
