import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ActivatedRoute,
  Router,
  RouterOutlet,
} from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { LocalStorageService } from '../service/local-storage.service';
import { LayoutHeadRightMenuComponent } from '../shared/biz-components/layout-head-right-menu/layout-head-right-menu.component';
import { LoginMenuService } from '../service/http/login/login.service';

interface MenuItem {
  value: string;
  label: string;
  path: string;
  visible: number;
}

@Component({
  selector: 'app-main-layout',
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
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.less'],
})
export class MainLayoutComponent implements OnInit {
  radioValue = 'A';
  isSuperAdmin = false;
  roleGrade = '';

  menuItems: MenuItem[] = [];

  constructor(
    private router: Router,
    private message: NzMessageService,
    private localStorageService: LocalStorageService,
    private ActivatedRoute: ActivatedRoute,
    private loginService: LoginMenuService,
  ) {}

  ngOnInit() {
    this.ActivatedRoute.fragment.subscribe((fragment) => {
      console.log(fragment);
    });
    // 初始化用户权限
    const userName = localStorage.getItem('userName');
    this.isSuperAdmin = userName === 'superadmin';
    this.roleGrade = localStorage.getItem('roleGrade') || '';

    // 动态获取后台菜单
    this.getMenus();
  }

  private getMenus() {
    const userId = Number(this.localStorageService.getItem('userId')) || 0;
    this.loginService.getMenuRouter(userId).subscribe((res: any) => {
      console.log(res);
      const rawMenus = res || [];
      this.menuItems = rawMenus.map((menu: any, index: number) => ({
        value: index.toString(),
        label: menu.menuName,
        path: menu.path,
        visible: menu.visible,
      }));
    });
  }

  radioChange() {
    const selectedMenu = this.menuItems.find(
      (item) => item.value === this.radioValue,
    );
    if (!selectedMenu) return;

    // 导航到目标页面
    if (this.router.url !== selectedMenu.path) {
      this.router.navigate([selectedMenu.path]);
    }
  }
}
