import { Component } from '@angular/core';

import { ZenCentralLimitComponent } from '../zen-central-limit/zen-central-limit.component';
import { ZenLGComponent } from '../zen-lg/zen-lg.component';
import { ZenLocalLGComponent } from '../zen-local-lg/zen-local-lg.component';
import { ZenLogisticRegressionComponent } from '../zen-logistic-regression/zen-logistic-regression.component';

@Component({
  selector: 'zen-ml-page',
  templateUrl: 'zen-ml-page.component.html',
  standalone: true,
  imports: [
    ZenCentralLimitComponent,
    ZenLGComponent,
    ZenLocalLGComponent,
    ZenLogisticRegressionComponent,
  ],
})
export class ZenMLPageComponent {}
