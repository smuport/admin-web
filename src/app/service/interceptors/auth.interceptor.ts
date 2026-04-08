import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Router } from "@angular/router";
import { NzMessageService } from "ng-zorro-antd/message";
import { EMPTY, Observable, Subject, from, throwError } from "rxjs";
import { catchError, switchMap } from "rxjs/operators";
import { LoginInOutService } from "../common/login-in-out.service";
import { TokenService } from "../token.service";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private router = inject(Router);
  private message = inject(NzMessageService);
  private tokenService = inject(TokenService);
  private loginInOutService = inject(LoginInOutService);

  private isRefreshing = false;
  private refreshTokenSubject: Subject<any> = new Subject<any>();
  private lastRefreshTime = 0;
  private readonly REFRESH_INTERVAL = 30 * 1000; // 30秒的刷新间隔
  private refreshPromise: Promise<any> | null = null;
  private isLoggingOut = false;

  intercept(
    req: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    // 如果是刷新token的请求，直接放行
    if (req.url.includes("/auth/token/refresh/")) {
      return next.handle(req);
    }

    // 如果正在登出，直接返回
    if (this.isLoggingOut) {
      return EMPTY;
    }

    // 获取token
    const token = this.tokenService.getAccessToken();

    // 如果没有token，直接发送请求
    if (!token) {
      return next.handle(req);
    }

    // 检查是否需要刷新token
    if (this.shouldRefreshToken()) {
      return this.handleTokenRefresh(req, next);
    }

    // 不需要刷新，直接带token请求
    return this.handleRequestWithToken(req, next, token);
  }

  private shouldRefreshToken(): boolean {
    const now = Date.now();

    // 1. 如果刚刷新过，不再刷新
    if (now - this.lastRefreshTime < this.REFRESH_INTERVAL) {
      return false;
    }

    // 2. 如果没有refresh token或已过期，不刷新
    if (
      !this.tokenService.getRefreshToken() ||
      this.tokenService.isRefreshTokenExpired()
    ) {
      return false;
    }

    // 3. 仅当 access token 快过期时才刷新
    return this.tokenService.isTokenExpiringSoon();
  }

  private handleTokenRefresh(
    req: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    if (!this.refreshPromise) {
      this.isRefreshing = true;
      this.refreshPromise = this.tokenService
        .refreshToken()
        .toPromise()
        .then((response) => {
          this.isRefreshing = false;
          this.lastRefreshTime = Date.now();

          if (!response) {
            throw new Error("Empty response from token refresh");
          }

          if (!response.data) {
            throw new Error("Invalid token response structure");
          }

          if (!response.data.accessToken) {
            throw new Error("Missing access token in response");
          }

          this.tokenService.updateAccessTokenOnly(response.data);
          this.refreshTokenSubject.next(response.data);
          return response.data;
        })
        .catch((error) => {
          this.isRefreshing = false;

          if (this.tokenService.isRefreshTokenExpired()) {
            this.handleLoginTimeout();
          } else {
            setTimeout(() => {
              this.refreshPromise = null;
            }, 5000);
          }

          throw error;
        })
        .finally(() => {
          this.refreshPromise = null;
        });
    }

    return from(this.refreshPromise).pipe(
      switchMap((tokens) => {
        if (!tokens || !tokens.accessToken) {
          console.error("Invalid tokens returned from refresh:", tokens);
          return EMPTY;
        }
        return this.handleRequestWithToken(req, next, tokens.accessToken);
      }),
      catchError(() => {
        return EMPTY;
      })
    );
  }

  private handleRequestWithToken(
    req: HttpRequest<unknown>,
    next: HttpHandler,
    token: string
  ): Observable<HttpEvent<unknown>> {
    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });

    return next.handle(clonedReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          if (this.isLoggingOut) {
            return EMPTY;
          }

          if (this.tokenService.isRefreshTokenExpired()) {
            this.handleLoginTimeout();
            return EMPTY;
          }

          if (Date.now() - this.lastRefreshTime < 5000) {
            return EMPTY;
          }

          return this.handleTokenRefresh(req, next);
        }

        if (error.status === 403) {
          this.message.error("没有权限执行此操作");
          return EMPTY;
        }

        return throwError(() => error);
      })
    );
  }

  private handleLoginTimeout(): void {
    if (this.isLoggingOut) {
      return;
    }

    this.isLoggingOut = true;
    this.isRefreshing = false;
    this.refreshPromise = null;

    setTimeout(() => {
      this.loginInOutService.loginOut().then(() => {
        this.tokenService.clearTokens();
        this.message.error("登录已过期，请重新登录");
        this.router.navigate(["/login"]).then(() => {
          this.isLoggingOut = false;
        });
      });
    }, 100);
  }
}
