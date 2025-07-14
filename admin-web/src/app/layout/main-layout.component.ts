import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterOutlet,
} from "@angular/router";
import { NzIconModule } from "ng-zorro-antd/icon";
import { NzMessageService } from "ng-zorro-antd/message";
import { NzPageHeaderModule } from "ng-zorro-antd/page-header";
import { NzRadioModule } from "ng-zorro-antd/radio";
import { filter } from "rxjs";
import { LocalStorageService } from "../service/local-storage.service";
import { LayoutHeadRightMenuComponent } from "../shared/biz-components/layout-head-right-menu/layout-head-right-menu.component";

interface MenuItem {
  value: string;
  label: string;
  path: string;
  visible: (roleGrade: string, isAdmin: boolean) => boolean;
}

@Component({
  selector: "app-main-layout",
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    NzPageHeaderModule,
    NzRadioModule,
    FormsModule,
    NzIconModule,
    LayoutHeadRightMenuComponent,
  ],
  templateUrl: "./main-layout.component.html",
  styleUrls: ["./main-layout.component.less"],
})
export class MainLayoutComponent implements OnInit {
  radioValue = "A";
  isSuperAdmin = false;
  roleGrade = "";

  menuItems: MenuItem[] = [
    {
      value: "A",
      label: "用户管理",
      path: "/admin/user",
      visible: () => true, // 所有人都可以看到用户管理
    },
    {
      value: "B",
      label: "角色管理",
      path: "/admin/role",
      visible: (roleGrade, isAdmin) => isAdmin || roleGrade === "1", // superadmin或roleGrade为1可以看到
    },
    {
      value: "C",
      label: "系统管理",
      path: "/admin/menuSetting",
      visible: (roleGrade, isAdmin) => isAdmin, // 只有superadmin可以看到
    },
    {
      value: "D",
      label: "部门管理",
      path: "/admin/dept",
      visible: (roleGrade, isAdmin) => isAdmin || roleGrade === "1", // superadmin或roleGrade为1可以看到
    },
  ];

  constructor(
    private router: Router,
    private message: NzMessageService,
    private localStorageService: LocalStorageService,
    private ActivatedRoute: ActivatedRoute
  ) {}

  ngOnInit() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.checkRoutePermission();
      });
    this.ActivatedRoute.fragment.subscribe((fragment) => {
      console.log(fragment);
    });
    // 初始化用户权限
    const userName = localStorage.getItem("userName");
    this.isSuperAdmin = userName === "superadmin";
    this.roleGrade = localStorage.getItem("roleGrade") || "";

    // 检查当前路由权限
    this.checkRoutePermission();
  }

  private checkRoutePermission() {
    const currentPath = this.router.url;
    const currentMenu = this.menuItems.find((item) =>
      currentPath.startsWith(item.path)
    );

    if (!currentMenu) return;

    // 设置当前选中值
    this.radioValue = currentMenu.value;

    // 检查权限
    if (!currentMenu.visible(this.roleGrade, this.isSuperAdmin)) {
      this.message.warning("您没有权限访问该页面");
      this.router.navigate(["/admin/user"]);
      this.radioValue = "A";
    }
  }

  radioChange() {
    const selectedMenu = this.menuItems.find(
      (item) => item.value === this.radioValue
    );
    if (!selectedMenu) return;

    // 检查权限
    if (!selectedMenu.visible(this.roleGrade, this.isSuperAdmin)) {
      this.message.warning("您没有权限访问该页面");
      this.radioValue = "A";
      this.router.navigate(["/admin/user"]);
      return;
    }

    // 导航到目标页面
    if (this.router.url !== selectedMenu.path) {
      this.router.navigate([selectedMenu.path]);
    }
  }
}
