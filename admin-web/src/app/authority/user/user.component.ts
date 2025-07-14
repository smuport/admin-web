import {
  ChangeDetectorRef,
  Component,
  OnInit,
  TemplateRef,
  ViewChild,
  inject,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { NzSafeAny } from "ng-zorro-antd/core/types";

import { CommonModule } from "@angular/common";
import { ReactiveFormsModule } from "@angular/forms";

import { NzButtonModule } from "ng-zorro-antd/button";
import { NzCardModule } from "ng-zorro-antd/card";
import { NzDividerModule } from "ng-zorro-antd/divider";
import { NzFlexModule } from "ng-zorro-antd/flex";
import { NzIconModule } from "ng-zorro-antd/icon";
import { NzMessageService } from "ng-zorro-antd/message";
import { NzModalService } from "ng-zorro-antd/modal";
import { NzTableModule } from "ng-zorro-antd/table";
import { NzTagModule } from "ng-zorro-antd/tag";
import { NzToolTipModule } from "ng-zorro-antd/tooltip";
import { NzTreeSelectModule } from "ng-zorro-antd/tree-select";
import { Observable, finalize, map, takeUntil } from "rxjs";
import { MD5 } from "crypto-js";
import {
  AntTableComponent,
  AntTableConfig,
} from "../../components/ant-table/ant-table.component";
import { ChangePasswordService } from "../../components/change-password/change-password.service";
import {
  SearchFormComponent,
  SearchFormModel,
} from "../../components/search-form/search-form.component";
import { RoleOption, User } from "../../model/user";
import { BaseHttpService } from "../../service/base-http.service";
import { DestroyService } from "../../service/common/destory.service";
import { DepartService } from "../../service/depart.service";
import { LocalStorageService } from "../../service/local-storage.service";
import { RoleService } from "../../service/role.service";
import { UrlService } from "../../service/url.service";
import { ModalBtnStatus } from "../../utils/base-modal";
import {
  convertToTreeNodes,
  flattenTreeToLabelValue,
} from "../../utils/data-deal";
import { UserModalService } from "./user-modal/user-modal.service";

@Component({
  selector: "app-user",
  standalone: true,
  imports: [
    SearchFormComponent,
    AntTableComponent,
    CommonModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzDividerModule,
    NzTagModule,
    NzToolTipModule,
    NzTreeSelectModule,
    NzTableModule,
    ReactiveFormsModule,
    NzFlexModule,
  ],
  providers: [DestroyService],
  templateUrl: "./user.component.html",
  styleUrl: "./user.component.less",
})
export class UserComponent implements OnInit {
  @ViewChild("operationTpl", { static: true })
  operationTpl!: TemplateRef<NzSafeAny>;
  @ViewChild("statusTpl", { static: true })
  statusTpl!: TemplateRef<NzSafeAny>;
  @ViewChild("role", { static: true })
  role!: TemplateRef<NzSafeAny>;
  @ViewChild("roleGradeTpl", { static: true })
  roleGradeTpl!: TemplateRef<NzSafeAny>;
  userList!: User[];
  user = {
    newPassword: "",
  };
  roleOptionList: RoleOption[] = [];
  departOptionList: any[] = [];
  searchParam: NzSafeAny = {};
  optionDepartments: any[] = [];
  tableConfig!: AntTableConfig;
  private changePasswordModalService = inject(ChangePasswordService);
  private localStorageService = inject(LocalStorageService);

  get canShowDeptSearch(): boolean {
    const roleGrade = this.localStorageService.getItem("roleGrade");
    return roleGrade == "2";
  }

  get searchFormItems(): SearchFormModel[] {
    const baseItems: SearchFormModel[] = [
      {
        name: "姓名",
        controlName: "search",
        placeholder: "请输入姓名",
        type: "input",
      } as SearchFormModel,
    ];

    if (!this.canShowDeptSearch) {
      baseItems.push(
        {
          name: "角色",
          controlName: "roleId",
          type: "select",
          placeholder: "请输入角色",
          optionList: this.roleOptionList,
        } as SearchFormModel,
        {
          name: "部门",
          controlName: "deptId",
          type: "treeSelect",
          placeholder: "请选择部门",
          treeList: this.optionDepartments,
        } as SearchFormModel
      );
    }

    return baseItems;
  }

  searchForm: SearchFormModel[] = [];

  private modalService = inject(UserModalService);
  private httpService = inject(BaseHttpService);
  private modal = inject(NzModalService);
  private destory$ = inject(DestroyService);
  private cdr = inject(ChangeDetectorRef);
  private departService = inject(DepartService);
  private msg = inject(NzMessageService);
  private roleService = inject(RoleService);
  private urlService = inject(UrlService);
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);

  constructor() {
    // ... 其它 inject
  }

  ngOnInit(): void {
    // 3. 重新初始化数据
    this.getDepartList().subscribe((optionDepartments) => {
      this.optionDepartments = optionDepartments;
    });
    this.searchForm = this.searchFormItems;
    this.initTable();
    this.getUser();
    this.getRole();
  }
  initTable(): void {
    this.tableConfig = {
      headers: [
        {
          title: "账号",
          field: "username",
        },
        {
          title: "姓名",
          width: 200,
          field: "name",
        },
        {
          title: "角色",
          width: 200,
          field: "role_name",
          tdTemplate: this.role,
        },
        {
          title: "部门",
          width: 200,
          field: "dept_info.name",
        },
        {
          title: "管理员",
          width: 100,
          field: "isAdmin",
          tdTemplate: this.statusTpl,
        },
        {
          title: "角色等级",
          width: 100,
          field: "roleGrade",
          tdTemplate: this.roleGradeTpl,
        },
        {
          title: "是否启用",
          width: 100,
          field: "isActive",
          tdTemplate: this.statusTpl,
        },
        {
          title: "操作",
          fixed: true,
          fixedDir: "right",
          tdTemplate: this.operationTpl,
        },
      ],
      showCheckbox: false,
      loading: false,
      total: 0,
      pageSize: 10,
      pageIndex: 1,
      nzFrontPagination: true,
      yScroll: "calc(100vh - 469px)",
    };
  }
  showModel(): void {
    this.getDepartList().subscribe((optionDepartments) => {
      this.modalService
        .show({
          nzTitle: "新增用户",
          nzData: {
            method: "add",
            dataItem: { user_type: 1, isActive: 1 },
            optionDepartments, // 只在此处传递
          },
        })
        .subscribe({
          next: ({ modalValue, status }) => {
            if (status === ModalBtnStatus.Cancel) {
              return;
            }
            this.addData(modalValue);
          },
          error: () => console.error(),
        });
    });
  }

  addData(param: object): void {
    this.httpService
      .post(this.urlService.permission.userUrl, param)
      .subscribe(() => {
        this.msg.success("添加成功");
        this.getUser();
      });
  }
  getRole() {
    this.httpService
      .get(this.urlService.permission.roleUrl)
      .subscribe((res) => {
        this.roleOptionList = res.map((role: any) => ({
          label: role.name,
          value: role.roleId,
        }));

        // 更新搜索表单
        this.searchForm = this.searchFormItems;
        this.cdr.detectChanges();
      });
  }

  getDepartList(): Observable<any[]> {
    const roleGrade = this.localStorageService.getItem("roleGrade");
    let params = undefined;
    if (roleGrade == "2") {
      const userId = this.localStorageService.getItem("userId");
      params = { userId };
    }
    return this.departService.getDepartList(params).pipe(
      map((res) => {
        console.log(res);

        // 将获取的部门数据进行处理
        this.departOptionList = flattenTreeToLabelValue(res);
        this.optionDepartments = convertToTreeNodes("dept", res);

        // 更新搜索表单中的部门选项列表
        this.searchForm = this.searchForm.map((item) => {
          if (item.controlName === "deptId") {
            return {
              ...item,
              optionList: this.departOptionList,
            };
          }
          return item;
        });
        // 触发变更检测，确保界面更新
        this.cdr.detectChanges();
        return this.optionDepartments;
      })
    );
  }
  search(e: NzSafeAny): void {
    this.searchParam = e;

    this.getUser();
  }

  reset(): void {
    this.searchParam = { user_type: 0 };
    this.getUser();
  }

  getUser(): void {
    this.tableConfig.loading = true;
    const params: any = {};

    // 添加搜索参数
    for (const i in this.searchParam) {
      if (this.searchParam.hasOwnProperty(i)) {
        if (this.searchParam[i] != null) {
          params[i] = this.searchParam[i];
        }
      }
    }

    // 如果roleGrade为2，添加userId参数
    const roleGrade = this.localStorageService.getItem("roleGrade");
    console.log(roleGrade);

    if (roleGrade == 2) {
      const userId = this.localStorageService.getItem("userId");
      if (userId) {
        params.userId = userId;
      }
    }
    console.log(params);

    this.httpService
      .get(this.urlService.permission.userUrl, params)
      .pipe(
        map((result) => {
          // 保护 result，避免 undefined 报错
          const list = Array.isArray(result) ? result : [];
          return list.map((item) => ({
            ...item,
            isActive: item.isActive,
          }));
        }),
        takeUntil(this.destory$),
        finalize(() => {
          this.tableConfig.loading = false;
        })
      )
      .subscribe({
        next: (res) => {
          this.userList = res;
          this.tableConfig.total = res.length;
          this.initTable();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.msg.error(err?.message || "获取用户失败");
        },
      });
  }

  updateModel(item: any): void {
    this.getDepartList().subscribe((optionDepartments) => {
      const newItem = {
        ...item,
        isActive: item.isActive,
        isAdmin: item.isAdmin ?? 0,
        roleGrade: item.roleGrade ?? null,
        dept_info: {
          ...item.dept_info,
          deptId: item.dept_info?.deptId,
        },
      };

      this.modalService
        .show(
          {
            nzTitle: "修改用户信息",
            nzData: {
              method: "edit",
              dataItem: newItem,
              optionDepartments, // 只在此处传递
            },
          },
          newItem
        )
        .subscribe({
          next: ({ modalValue, status }) => {
            if (status === ModalBtnStatus.Cancel) {
              return;
            }
            this.editData(item.userId, modalValue);
          },
          error: () => console.error(),
        });
    });
  }

  resetPsw(a: any) {
    this.changePasswordModalService.show({ nzTitle: "修改密码" }).subscribe({
      next: ({ modalValue, status }) => {
        if (status === ModalBtnStatus.Cancel) {
          return;
        }
        this.user = {
          newPassword: MD5(modalValue.newPassword.toString()).toString(),
        };
        this.roleService.resetpsw(a.userId, this.user).subscribe({
          next: () => {
            this.msg.success("修改成功");
          },
          error: (err) => {
            this.msg.error(err?.message || "重置密码失败");
          },
        });
      },
      error: (error) => this.msg.error(error),
    });
  }

  editData(id: string, param: object): void {
    this.httpService
      .put(this.urlService.permission.userUrl, id, param)
      .subscribe((updatedUser) => {
        this.msg.success("修改成功");
        this.getUser();
      });
  }

  deleteStore(id: string): void {
    this.modal.confirm({
      nzTitle: "是否删除?",
      nzContent: "确定要删除这个用户嘛？删除后不可恢复！",
      nzOnOk: () => {
        this.httpService
          .delete(this.urlService.permission.userUrl, id)
          .subscribe(() => {
            this.msg.success("删除成功");
            // 删除用户
            this.userList = this.userList.filter((user) => user.userId !== id);
            this.cdr.markForCheck();
          });
      },
    });
  }

  changePageSize(e?: any): void {
    this.tableConfig.pageSize = e;
    this.getUser();
  }

  changePageIndex(e?: any): void {
    this.tableConfig.pageIndex = e;
    this.getUser();
  }

  deleteThreeMounthAgoUser() {
    this.httpService
      .delete(this.urlService.permission.deleteLongAgoUserUrl)
      .subscribe((a) => {
        console.log(a);
        this.msg.success(`成功删除${a.deleted_count}个用户`);
        this.getUser();
      });
  }

  getRoleGradeText(grade: any): string {
    if (!grade) {
      return "普通用户";
    }

    switch (grade.toString()) {
      case "1":
        return "一级";
      case "2":
        return "二级";
      default:
        return "普通用户";
    }
  }
}
