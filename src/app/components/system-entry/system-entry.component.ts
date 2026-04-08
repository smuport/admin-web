import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { BaseHttpService } from '../../service/base-http.service';
import { UrlService } from '../../service/url.service';
import { SystemCard } from '../../model/system-card';
import { SSOService } from '../../service/sso.service';
import { LayoutHeadRightMenuComponent } from "../../shared/biz-components/layout-head-right-menu/layout-head-right-menu.component";
import { Router } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-system-entry',
  standalone: true,
  imports: [CommonModule, NzMessageModule, LayoutHeadRightMenuComponent, NzButtonModule, NzIconModule],
  templateUrl: './system-entry.component.html',
  styleUrl: './system-entry.component.less',
})
export class SystemEntryComponent implements OnInit {
  systems = signal<SystemCard[]>([]);
  isAdmin = false;

  constructor(
    private baseHttp: BaseHttpService,
    private urlService: UrlService,
    private message: NzMessageService,
    private sso: SSOService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const userName = localStorage.getItem("userName");
    const roleGrade = localStorage.getItem("roleGrade") || "";
    this.isAdmin = userName === "superadmin" || !!roleGrade ;

    this.baseHttp
      .get<SystemCard[]>(this.urlService.permission.systemUrl)
      .subscribe((res) => this.systems.set(res));
  }

  openSystem(system: SystemCard): void {
    const link = system.targetPath || '';
    console.log(link);
    if (link) {
      this.sso.updateConfig({ yardSystemUrl: link });
      window.open(link, '_blank');
    } else {
      this.message.warning('未配置系统跳转地址');
    }
  }

  goToAdmin(): void {
    this.router.navigate(['/admin']);
  }
}
