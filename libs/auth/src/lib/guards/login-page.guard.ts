import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Environment } from '@zen/common';
import { loggedInVar } from '@zen/graphql/client';

@Injectable({
  providedIn: 'root',
})
export class LoginPageGuard implements CanActivate {
  constructor(private router: Router, private env: Environment) {}

  canActivate() {
    if (!loggedInVar()) {
      return true;
    }

    this.router.navigateByUrl(this.env.url.loginRedirect);
    return false;
  }
}
