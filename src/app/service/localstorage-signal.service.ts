import { Injectable, signal } from "@angular/core";

export interface UserState {
  userName: string;
  roleGrade: string;
  accessToken: string;
  userId: string;
}

@Injectable({ providedIn: "root" })
export class LocalStorageSignalService {
  private _userState = signal<UserState>({
    userName: localStorage.getItem("userName") || "",
    roleGrade: localStorage.getItem("roleGrade") || "",
    accessToken: localStorage.getItem("accessToken") || "",
    userId: localStorage.getItem("userId") || "",
  });

  readonly userState = this._userState.asReadonly();

  updateUser(partial: Partial<UserState>) {
    console.log(partial);

    const newState = { ...this._userState(), ...partial };
    if (partial.userName !== undefined)
      localStorage.setItem("userName", partial.userName);
    if (partial.roleGrade !== undefined)
      localStorage.setItem("roleGrade", partial.roleGrade);
    if (partial.accessToken !== undefined)
      localStorage.setItem("accessToken", partial.accessToken);
    if (partial.userId !== undefined)
      localStorage.setItem("userId", partial.userId);
    this._userState.set(newState);
  }

  constructor() {
    window.addEventListener("storage", (event) => {
      if (
        ["userName", "roleGrade", "accessToken", "userId"].includes(event.key!)
      ) {
        this._userState.set({
          userName: localStorage.getItem("userName") || "",
          roleGrade: localStorage.getItem("roleGrade") || "",
          accessToken: localStorage.getItem("accessToken") || "",
          userId: localStorage.getItem("userId") || "",
        });
      }
    });
  }
}
