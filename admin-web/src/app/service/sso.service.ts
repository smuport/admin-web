import { Injectable, OnDestroy } from "@angular/core";
import { TokenPre } from "../config/constant";
import { LocalStorageService } from "./local-storage.service";
import { TokenService } from "./token.service";

export interface SSOConfig {
  yardSystemUrl: string; // 堆场系统URL
  //   loadingSystemUrl: string; // 配载系统URL
}

@Injectable({
  providedIn: "root",
})
export class SSOService implements OnDestroy {
  private readonly childSystems: SSOConfig = {
    yardSystemUrl: "http://localhost:53144", // 替换为实际的堆场系统URL
    // loadingSystemUrl: "http://loading-system.example.com", // 替换为实际的配载系统URL
  };

  constructor(
    private tokenService: TokenService,
    private localStorageService: LocalStorageService
  ) {
    // 监听来自子系统的消息
    window.addEventListener("message", this.handlePostMessage.bind(this));
  }
  ngOnDestroy(): void {
    window.removeEventListener("message", this.handlePostMessage.bind(this));
  }

  /**
   * 初始化子系统的 iframe
   * @param systemUrl 子系统URL
   * @returns HTMLIFrameElement
   */
  private createSystemIframe(systemUrl: string): HTMLIFrameElement {
    const iframe = document.createElement("iframe");
    iframe.style.display = "none"; // 隐藏iframe
    iframe.src = systemUrl;
    document.body.appendChild(iframe);
    return iframe;
  }

  /**
   * 处理来自子系统的消息
   * @param event MessageEvent
   */
  private handlePostMessage(event: MessageEvent): void {
    // 验证消息来源
    if (!this.isValidOrigin(event.origin)) {
      console.warn("收到未知来源的消息:", event.origin);
      return;
    }

    // 处理不同类型的消息
    switch (event.data.type) {
      case "REQUEST_TOKEN":
        this.sendTokenToChild(event.source as Window, event.origin);
        break;
      case "TOKEN_RECEIVED":
        console.log("子系统确认收到token:", event.origin);
        break;
      case "LOGOUT":
        this.handleLogout();
        break;
    }
  }

  /**
   * 验证消息来源是否合法
   * @param origin 消息来源
   * @returns boolean
   */
  private isValidOrigin(origin: string): boolean {
    const validOrigins = [
      window.location.origin, // 主系统自己的origin
      new URL(this.childSystems.yardSystemUrl).origin,
      // new URL(this.childSystems.loadingSystemUrl).origin,
    ];
    return validOrigins.includes(origin);
  }

  /**
   * 向子系统发送token
   * @param targetWindow 目标窗口
   * @param targetOrigin 目标源
   */
  private sendTokenToChild(targetWindow: Window, targetOrigin: string): void {
    const token = this.tokenService.getAccessToken();
    if (token) {
      targetWindow.postMessage(
        {
          type: "TOKEN_RESPONSE",
          token: `${TokenPre}${token}`,
        },
        targetOrigin
      );
    }
  }

  /**
   * 处理登出操作
   */
  private handleLogout(): void {
    this.tokenService.clearTokens();
    this.localStorageService.clear();
    // 通知所有子系统登出
    this.broadcastLogout();
  }

  /**
   * 向所有子系统广播登出消息
   */
  private broadcastLogout(): void {
    Object.values(this.childSystems).forEach((url) => {
      const iframes = Array.from(document.getElementsByTagName("iframe"));
      const targetIframe = iframes.find((iframe) => iframe.src.startsWith(url));
      if (targetIframe && targetIframe.contentWindow) {
        targetIframe.contentWindow.postMessage(
          { type: "LOGOUT_BROADCAST" },
          new URL(url).origin
        );
      }
    });
  }

  /**
   * 初始化SSO
   */
  public initSSO(): void {
    Object.values(this.childSystems).forEach((url) => {
      const existingIframe = Array.from(
        document.getElementsByTagName("iframe")
      ).find((iframe) => iframe.src === url);
      if (!existingIframe) {
        this.createSystemIframe(url);
      }
    });
  }

  /**
   * 更新子系统配置
   * @param config 新的配置
   */
  public updateConfig(config: Partial<SSOConfig>): void {
    Object.assign(this.childSystems, config);
  }

  /**
   * 主动向所有子系统发送token
   */
  public broadcastToken(): void {
    const token = this.tokenService.getAccessToken();
    console.log(token);

    if (!token) return;
    Object.values(this.childSystems).forEach((url) => {
      console.log(url);

      // 查找已存在的iframe
      const iframes = Array.from(document.getElementsByTagName("iframe"));
      const targetIframe = iframes.find((iframe) => iframe.src.startsWith(url));

      if (targetIframe && targetIframe.contentWindow) {
        targetIframe.contentWindow.postMessage(
          {
            type: "TOKEN_RESPONSE",
            token: `${TokenPre}${token}`,
          },
          new URL(url).origin
        );
        console.log("成功发送", new URL(url).origin);
      }
    });
  }
}
