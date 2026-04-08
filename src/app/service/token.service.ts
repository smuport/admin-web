import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { BaseHttpService } from "./base-http.service";
import { UrlService } from "./url.service";

// 后端返回的格式
interface BackendTokenResponse {
  code: number;
  data: TokenResponse;
  msg?: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpires: number; // access token 过期时间（秒）
  refreshTokenExpires: number; // refresh token 过期时间（秒）
  tokenType: string;
}

@Injectable({
  providedIn: "root",
})
export class TokenService {
  private readonly ACCESS_TOKEN = "accessToken";
  private readonly REFRESH_TOKEN = "refreshToken";
  private readonly ACCESS_TOKEN_EXPIRES = "accessTokenExpires"; // access_token过期时间
  private readonly REFRESH_TOKEN_EXPIRES = "refreshTokenExpires"; // refresh_token过期时间
  private readonly TOKEN_SET_TIME = "tokenSetTime";

  constructor(
    private baseHttpService: BaseHttpService,
    private urlService: UrlService
  ) {}

  // 保存令牌 - 用于登录时设置所有token
  setTokens(response: TokenResponse): void {
    // 验证必要的字段
    if (!response.accessToken || !response.accessTokenExpires) {
      console.error("Invalid token response:", response);
      return;
    }

    localStorage.setItem(this.ACCESS_TOKEN, response.accessToken);
    if (response.refreshToken) {
      localStorage.setItem(this.REFRESH_TOKEN, response.refreshToken);
    }

    // 存储过期时间（秒）和设置时间
    localStorage.setItem(
      this.ACCESS_TOKEN_EXPIRES,
      response.accessTokenExpires.toString()
    );

    // 增加对refreshExpiresIn的检查，避免undefined错误
    if (
      response.refreshTokenExpires !== undefined &&
      response.refreshTokenExpires !== null
    ) {
      localStorage.setItem(
        this.REFRESH_TOKEN_EXPIRES,
        response.refreshTokenExpires.toString()
      );
    } else if (response.refreshToken) {
      localStorage.setItem(
        this.REFRESH_TOKEN_EXPIRES,
        "7200" // 默认2小时
      );
    }

    localStorage.setItem(this.TOKEN_SET_TIME, Date.now().toString());
  }

  // 刷新令牌时仅更新访问令牌 - 专门用于刷新操作
  updateAccessTokenOnly(response: TokenResponse): void {
    // 验证必要的字段
    if (!response.accessToken || !response.accessTokenExpires) {
      console.error("Invalid token response for refresh:", response);
      return;
    }

    // 保存原始token设置时间
    const originalSetTime = localStorage.getItem(this.TOKEN_SET_TIME);

    // 只更新access token相关信息，保留原refresh token
    localStorage.setItem(this.ACCESS_TOKEN, response.accessToken);
    localStorage.setItem(
      this.ACCESS_TOKEN_EXPIRES,
      response.accessTokenExpires.toString()
    );

    // 创建一个单独的access token设置时间，用于新的access token计算
    // 但不更新TOKEN_SET_TIME，以保持refresh token的原始有效期
    const accessTokenSetTime = Date.now().toString();
    localStorage.setItem("accessTokenSetTime", accessTokenSetTime);

    // 检查是否更改了TOKEN_SET_TIME，并给出警告
    if (localStorage.getItem(this.TOKEN_SET_TIME) !== originalSetTime) {
      console.error(
        "警告：TOKEN_SET_TIME被修改，会影响refresh token的过期计算！"
      );
      // 恢复原始值
      if (originalSetTime) {
        localStorage.setItem(this.TOKEN_SET_TIME, originalSetTime);
      }
    }
  }

  // 获取访问令牌
  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN);
  }

  // 获取刷新令牌
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN);
  }

  // 检查访问令牌是否即将过期（默认剩余30秒时刷新）
  isTokenExpiringSoon(thresholdMs: number = 30 * 1000): boolean {
    const accessTokenExpires = localStorage.getItem(this.ACCESS_TOKEN_EXPIRES);
    const tokenSetTime = localStorage.getItem(this.TOKEN_SET_TIME);
    const accessTokenSetTime = localStorage.getItem("accessTokenSetTime");

    if (!accessTokenExpires || (!tokenSetTime && !accessTokenSetTime)) {
      return true;
    }

    // 正确计算过期时间点和剩余时间
    const expiresInSeconds = parseInt(accessTokenExpires); // 过期时长(秒)
    const setTimeMs = accessTokenSetTime
      ? parseInt(accessTokenSetTime)
      : parseInt(tokenSetTime!); // 设置时间(毫秒时间戳)

    if (isNaN(expiresInSeconds) || isNaN(setTimeMs)) {
      return true;
    }

    // 计算绝对过期时间和剩余时间
    const expiresAtMs = setTimeMs + expiresInSeconds * 1000; // 过期时间点(毫秒时间戳)
    const now = Date.now();
    const timeLeftMs = expiresAtMs - now; // 剩余时间(毫秒)

    return timeLeftMs <= thresholdMs;
  }

  // 检查刷新令牌是否已经过期
  isRefreshTokenExpired(): boolean {
    const refreshTokenExpires = localStorage.getItem(
      this.REFRESH_TOKEN_EXPIRES
    );
    const tokenSetTime = localStorage.getItem(this.TOKEN_SET_TIME);

    if (!refreshTokenExpires || !tokenSetTime) {
      return true;
    }

    // 正确计算过期时间点和剩余时间
    const expiresInSeconds = parseInt(refreshTokenExpires); // 过期时长(秒)
    const setTimeMs = parseInt(tokenSetTime); // 设置时间(毫秒时间戳)

    if (isNaN(expiresInSeconds) || isNaN(setTimeMs)) {
      return true;
    }

    // 计算绝对过期时间
    const expiresAtMs = setTimeMs + expiresInSeconds * 1000; // 过期时间点(毫秒时间戳)
    const now = Date.now();

    return now >= expiresAtMs; // 当前时间超过过期时间点时，表示已过期
  }

  // 计算剩余登录时间 - 供日志显示使用
  getTokenTimeLeftInfo(): {
    accessTimeLeft: string;
    refreshTimeLeft: string;
    accessExpiresAt: string;
    refreshExpiresAt: string;
  } {
    const accessTokenExpires = localStorage.getItem(this.ACCESS_TOKEN_EXPIRES);
    const refreshTokenExpires = localStorage.getItem(
      this.REFRESH_TOKEN_EXPIRES
    );
    const tokenSetTime = localStorage.getItem(this.TOKEN_SET_TIME);
    const accessTokenSetTime = localStorage.getItem("accessTokenSetTime");

    if (!accessTokenExpires || !refreshTokenExpires || !tokenSetTime) {
      return {
        accessTimeLeft: "无法获取",
        refreshTimeLeft: "无法获取",
        accessExpiresAt: "无法获取",
        refreshExpiresAt: "无法获取",
      };
    }

    const now = Date.now();
    const setTimeMs = parseInt(tokenSetTime);

    // 计算Access Token过期时间 - 优先使用accessTokenSetTime
    const accessExpiresInSeconds = parseInt(accessTokenExpires);
    const accessSetTimeMs = accessTokenSetTime
      ? parseInt(accessTokenSetTime)
      : setTimeMs;
    const accessExpiresAtMs = accessSetTimeMs + accessExpiresInSeconds * 1000;
    const accessTimeLeftMs = accessExpiresAtMs - now;
    const accessTimeLeftMinutes = Math.max(
      0,
      Math.floor(accessTimeLeftMs / 60000)
    );
    const accessTimeLeftSeconds = Math.max(
      0,
      Math.floor((accessTimeLeftMs % 60000) / 1000)
    );

    // 计算Refresh Token过期时间 - 使用原始tokenSetTime
    const refreshExpiresInSeconds = parseInt(refreshTokenExpires);
    const refreshExpiresAtMs = setTimeMs + refreshExpiresInSeconds * 1000;
    const refreshTimeLeftMs = refreshExpiresAtMs - now;
    const refreshTimeLeftMinutes = Math.max(
      0,
      Math.floor(refreshTimeLeftMs / 60000)
    );
    const refreshTimeLeftSeconds = Math.max(
      0,
      Math.floor((refreshTimeLeftMs % 60000) / 1000)
    );

    return {
      accessTimeLeft: `${accessTimeLeftMinutes}分钟${accessTimeLeftSeconds}秒`,
      refreshTimeLeft: `${refreshTimeLeftMinutes}分钟${refreshTimeLeftSeconds}秒`,
      accessExpiresAt: new Date(accessExpiresAtMs).toLocaleString(),
      refreshExpiresAt: new Date(refreshExpiresAtMs).toLocaleString(),
    };
  }

  // 刷新令牌
  refreshToken(): Observable<BackendTokenResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    // 使用自定义的 headers 发送请求
    return this.baseHttpService.postWithoutCodeCheck<BackendTokenResponse>(
      this.urlService.permission.refreshTokenUrl,
      { refreshToken } // 在请求体中发送 refreshToken
    );
  }

  // 清除所有令牌
  clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN);
    localStorage.removeItem(this.REFRESH_TOKEN);
    localStorage.removeItem(this.ACCESS_TOKEN_EXPIRES);
    localStorage.removeItem(this.REFRESH_TOKEN_EXPIRES);
    localStorage.removeItem(this.TOKEN_SET_TIME);
    localStorage.removeItem("accessTokenSetTime");
    localStorage.removeItem("Tokenkey");
    localStorage.removeItem("token");
    sessionStorage.removeItem("Tokenkey");
    sessionStorage.removeItem("token");
    console.log("11s");
  }
}
