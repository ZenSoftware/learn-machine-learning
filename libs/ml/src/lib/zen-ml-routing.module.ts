import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ZenMLPageComponent } from './zen-ml-page/zen-ml-page.component';

export const routes: Routes = [
  {
    path: 'ml',
    component: ZenMLPageComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ZenMLRoutingModule {}
