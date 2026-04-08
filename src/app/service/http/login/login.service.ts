import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseHttpService } from '../../base-http.service';
import { UrlService } from '../../url.service';
import { environment } from '../../../../environments/environment';

export interface UserLogin {
  name: string;
  password: string;
}


@Injectable({
  providedIn: 'root',
})
export class LoginMenuService {
  http = inject(BaseHttpService);
  urlService = inject(UrlService);
  managerBaseUrl: string = environment.managerBaseUrl;

  public getMenuRouter(id: number): Observable<any> {
    const systemId = environment.systemCodeMap['权限系统'] || 2;
    return this.http.get<any>(this.urlService.permission.MenuByLoginUrl, {
      systemId: systemId,
    });
  }
}
