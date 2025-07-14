import { Component, OnInit, inject } from "@angular/core";
import {
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from "@angular/forms";
import { NzSafeAny } from "ng-zorro-antd/core/types";
import { NZ_MODAL_DATA, NzModalRef } from "ng-zorro-antd/modal";
import { NzFormatEmitEvent, NzTreeNodeOptions } from "ng-zorro-antd/tree";
import { Observable, of } from "rxjs";
import { MD5 } from "crypto-js";
import { dept } from "../../../model/depart";
import { Role } from "../../../model/role";
import { BaseHttpService } from "../../../service/base-http.service";
import { DepartService } from "../../../service/depart.service";
import { LocalStorageService } from "../../../service/local-storage.service";
import { UrlService } from "../../../service/url.service";
import { BasicConfirmModalComponent } from "../../../utils/base-modal";
import { SHARED_ZORRO_MODULES } from "../../../utils/shared-zorro.module";
import { fnCheckForm } from "../../../utils/tools";

@Component({
  selector: "app-user-modal",
  templateUrl: "./user-modal.component.html",
  styleUrls: ["./user-modal.component.scss"],
  standalone: true,
  imports: [SHARED_ZORRO_MODULES],
})
export class UserModalComponent
  extends BasicConfirmModalComponent
  implements OnInit
{
  passwordVisible = false;
  departService = inject(DepartService);
  private urlService = inject(UrlService);
  currentUserRoleGrade: string = "";

  modalData = inject(NZ_MODAL_DATA);
  roleOptionList!: Role[];
  expandKeys = [];
  deptOption!: any[];
  departOptionList!: dept[];
  depetOptionNodes: { key: string; title: string }[] = [];
  dataForm!: UntypedFormGroup;
  url = "/auth/system/user/";
  deptUrl = "/system/dept/";
  roleUrl = "/auth/system/get_role/";
  deptLazyTreeUrl = "/api/system/dept_lazy_tree/";

  // 判断当前用户是否有权限看到管理员相关字段
  get canShowAdminFields(): boolean {
    return ["2"].includes(this.currentUserRoleGrade);
  }

  get canShowRoleField(): boolean {
    return this.currentUserRoleGrade !== "2";
  }

  onIsAdminChange(value: number) {
    if (value === 0) {
      this.dataForm.get("roleGrade")?.setValue(null);
      this.dataForm.get("roleGrade")?.clearValidators();
    } else {
      this.dataForm.get("roleGrade")?.setValue(3);
    }
    this.dataForm.get("roleGrade")?.updateValueAndValidity();
  }

  protected getCurrentValue(): Observable<NzSafeAny> {
    if (!this.dataForm.get("username")!.value) {
      this.dataForm
        .get("username")
        ?.setValue(this.dataForm.get("mobile")!.value);
    }
    if (!fnCheckForm(this.dataForm)) {
      return of(false);
    }
    
    const formValue = { ...this.dataForm.value };
    
    // 如果是新增用户且有密码字段，对密码进行MD5加密
    if (this.modalData.method === "add" && formValue.password) {
      formValue.password = MD5(formValue.password).toString();
    }
    
    return of(formValue);
  }

  constructor(
    private fb: UntypedFormBuilder,
    protected override modalRef: NzModalRef,
    private httpService: BaseHttpService,
    private localStorageService: LocalStorageService
  ) {
    super(modalRef);
  }

  onExpandChange(e: NzFormatEmitEvent): void {
    const node = e.node;
    if (node && node.getChildren().length === 0 && node.isExpanded) {
      this.loadNode(node.key).then((data) => {
        node.addChildren(data);
      });
    }
  }
  loadNode(key: string): Promise<NzTreeNodeOptions[]> {
    return new Promise((resolve) => {
      this.httpService
        .get(this.deptLazyTreeUrl, { parent: key })
        .subscribe((res) => {
          let list: { key: any; title: any }[] = [];
          res.forEach((item: { id: any; name: any }) => {
            list.push({ key: item.id, title: item.name });
          });
          resolve(list);
        });
    });
  }
  ngOnInit(): void {
    this.currentUserRoleGrade =
      this.localStorageService.getItem("roleGrade") || "";
    this.getRole();
    this.initForm();
  }
  getRole() {
    this.httpService
      .get(this.urlService.permission.roleUrl)
      .subscribe((res) => {
        this.roleOptionList = res;
      });
  }

  initForm(): void {
    const formGroup: any = {
      username: [this.modalData.dataItem.username, [Validators.required]],
      name: [this.modalData.dataItem.name, [Validators.required]],
      email: ["1234567789@qq.com"],
      gender: [0],
      deptId: [this.modalData?.dataItem?.dept_info?.deptId],
      isActive: [this.modalData.dataItem.isActive, [Validators.required]],
      mobile: ["12345677899"],
      isAdmin: [this.modalData.dataItem.isAdmin ?? 0],
      roleGrade: [this.modalData.dataItem.roleGrade ?? null],
      roleId: [this.modalData.dataItem.role ?? null],
    };

    if (this.modalData.method === "add") {
      formGroup.password = [null, [Validators.required, this.passwordRule]];
    }

    this.dataForm = this.fb.group(formGroup);

    // 如果是管理员，确保roleGrade有值
    if (
      this.dataForm.get("isAdmin")?.value === 1 &&
      !this.dataForm.get("roleGrade")?.value
    ) {
      this.dataForm.get("roleGrade")?.setValue(3);
    }
  }

  passwordRule = (control: UntypedFormControl): { [s: string]: boolean } => {
    const hasUpperCase = /[A-Z]/.test(control.value);
    const hasLowerCase = /[a-z]/.test(control.value);
    const hasNumber = /\d/.test(control.value);
    const hasSpecialChar = /[!@#$%^&*()\-_=+{};:,<.>?\/\\\[\]|`~]/.test(
      control.value
    );
    const regLength = /^[^\s]{6,20}$/.test(control.value);
    const value = control.value;
    if (!value) {
      return { error: true, required: true };
    } else if (
      !hasUpperCase ||
      !hasLowerCase ||
      !hasNumber ||
      !hasSpecialChar ||
      !regLength
    ) {
      return { error: true, conform: true };
    }
    return {};
  };

  setFormControl(): void {
    if (Object.keys(this.hiddenParams).length > 0) {
      this.hiddenParams.forEach((res: string) => {
        this.dataForm.setControl(
          res,
          new UntypedFormControl({ value: null, disabled: true })
        );
      });
    }

    if (this.params !== null && Object.keys(this.params).length > 0) {
      this.dataForm.patchValue(this.params);
    }
  }
}
