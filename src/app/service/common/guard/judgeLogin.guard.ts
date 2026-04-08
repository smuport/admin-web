import { assertInInjectionContext, inject } from "@angular/core";
import {
  ActivatedRouteSnapshot,
  CanActivateChildFn,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
} from "@angular/router";

import { TokenKey } from "../../../config/constant";
import { WindowService } from "../window.service";
import { LocalStorageService } from "../../local-storage.service";

// class与fn的争议https://github.com/angular/angular/pull/47924
// 路由守卫，没有TokenKey则跳转登录页

const canActivateChildFn: CanActivateFn = () => {
  // 这个方法可以检查inject是否在context中
  assertInInjectionContext(canActivateChildFn);
  const localStorageService = inject(LocalStorageService);
  const router = inject(Router);
  const isLogin = !!localStorageService.getItem(TokenKey);
  if (isLogin) {
    return true;
  }
  return router.parseUrl("/login");
};

export const JudgeLoginGuard: CanActivateChildFn = (
  childRoute: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  return canActivateChildFn(childRoute, state);
};
