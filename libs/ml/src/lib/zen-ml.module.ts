import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { NgChartsModule } from 'ng2-charts';

import { ZenCentralLimitComponent } from './zen-central-limit/zen-central-limit.component';
import { ZenLGComponent } from './zen-lg/zen-lg.component';
import { ZenLocalLGComponent } from './zen-local-lg/zen-local-lg.component';
import { ZenLogisticRegressionComponent } from './zen-logistic-regression/zen-logistic-regression.component';
import { ZenMLPageComponent } from './zen-ml-page/zen-ml-page.component';
import { ZenMLRoutingModule } from './zen-ml-routing.module';

@NgModule({
  imports: [CommonModule, MatButtonModule, NgChartsModule, ZenMLRoutingModule],
  declarations: [
    ZenCentralLimitComponent,
    ZenLGComponent,
    ZenLocalLGComponent,
    ZenLogisticRegressionComponent,
    ZenMLPageComponent,
  ],
})
export class ZenMLModule {}
