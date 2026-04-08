import { NgTemplateOutlet } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from "@angular/core";
import { Router } from "@angular/router";

import { NzBadgeModule } from "ng-zorro-antd/badge";
import { NzButtonModule } from "ng-zorro-antd/button";
import { NzDropDownModule } from "ng-zorro-antd/dropdown";
import { NzIconModule } from "ng-zorro-antd/icon";
import { NzMenuModule } from "ng-zorro-antd/menu";
import { NzMessageService } from "ng-zorro-antd/message";
import { ModalOptions } from "ng-zorro-antd/modal";
import { NzToolTipModule } from "ng-zorro-antd/tooltip";

import { Location } from "@angular/common";
import { MD5 } from "crypto-js";
import { ChangePasswordService } from "../../../components/change-password/change-password.service";
import { LoginInOutService } from "../../../service/common/login-in-out.service";
import { WindowService } from "../../../service/common/window.service";
import { LocalStorageService } from "../../../service/local-storage.service";
import { MenuService } from "../../../service/menu.service";
import { RoleService } from "../../../service/role.service";
import { UserInfoService } from "../../../service/store/common-store/userInfo.service";
import { ModalBtnStatus } from "../../../utils/base-modal";
// import { ToggleFullscreenDirective } from "../../directives/toggle-fullscreen.directive";
// import { SearchRouteService } from "../search-route/search-route.service";

@Component({
  selector: "app-layout-head-right-menu",
  templateUrl: "./layout-head-right-menu.component.html",
  styleUrls: ["./layout-head-right-menu.component.less"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    NgTemplateOutlet,
    // ScreenLessHiddenDirective,
    NzToolTipModule,
    NzIconModule,
    NzButtonModule,
    // ToggleFullscreenDirective,
    NzDropDownModule,
    NzBadgeModule,
    NzMenuModule,
  ],
})
export class LayoutHeadRightMenuComponent implements OnInit {
  user!: any;
  userName!: string;
  private router = inject(Router);
  private changePasswordModalService = inject(ChangePasswordService);
  private loginOutService = inject(LoginInOutService);
  private windowServe = inject(WindowService);
  // private searchRouteService = inject(SearchRouteService);
  private message = inject(NzMessageService);
  private userInfoService = inject(UserInfoService);
  private menuService = inject(MenuService);
  private roleService = inject(RoleService);
  private localStorageService = inject(LocalStorageService);
  private location = inject(Location);

  // 修改密码
  changePassWorld(): void {
    this.changePasswordModalService
      .show({ nzTitle: "修改密码" })
      .subscribe(({ modalValue, status }) => {
        if (status === ModalBtnStatus.Cancel) {
          return;
        }

        this.user = {
          newPassword: MD5(modalValue.newPassword).toString(),
        };
        const userId = this.localStorageService.getItem("userId");
        this.roleService.resetpsw(userId, this.user).subscribe(() => {
          // this.loginOutService.loginOut().then();
          this.message.success("修改成功");
        });
      });
  }

  showSearchModal(): void {
    const modalOptions: ModalOptions = {
      nzClosable: false,
      nzMaskClosable: true,
      nzStyle: { top: "48px" },
      nzFooter: null,
      nzBodyStyle: { padding: "0" },
    };
    // this.searchRouteService.show(modalOptions);
  }

  goLogin(): void {
    this.loginOutService.loginOut().then();
    this.windowServe.clearStorage();
    this.windowServe.clearSessionStorage();
  }

  clean(): void {
    this.windowServe.clearStorage();
    this.windowServe.clearSessionStorage();
    this.loginOutService.loginOut().then();
    this.message.success("清除成功，请重新登录");
  }

  showMessage(): void {
    this.message.info("切换成功");
  }

  goPage(path: string): void {
    this.router.navigateByUrl(`/default/page-demo/personal/${path}`);
  }

  // 从main-layout移过来的方法
  onBack(): void {
    this.location.back();
  }

  goHome(): void {
    const homeUrl = this.localStorageService.getItem("fromUrl");
    if (!homeUrl) return;

    // 解析 returnUrl 参数
    const urlObj = new URL(homeUrl);
    const returnUrl = urlObj.searchParams.get("returnUrl");
    if (returnUrl) {
      // 解码 returnUrl 并跳转
      window.location.href = decodeURIComponent(returnUrl);
    } else {
      // 没有 returnUrl，兜底跳转
      window.location.href = homeUrl;
    }
  }

  // isAdminSystem(): boolean {
  //   return !!this.localStorageService.getItem("fromUrl");
  // }

  backTitle(): string {
    return "返回上一页";
  }

  ngOnInit(): void {
    this.userName = this.localStorageService.getItem("userName");
  }
}
