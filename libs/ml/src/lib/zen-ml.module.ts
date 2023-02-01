import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { ZenMLPageComponent } from './zen-ml-page/zen-ml-page.component';
import { ZenMLRoutingModule } from './zen-ml-routing.module';

@NgModule({
  imports: [CommonModule, ZenMLRoutingModule],
  declarations: [ZenMLPageComponent],
})
export class ZenMLModule {}
