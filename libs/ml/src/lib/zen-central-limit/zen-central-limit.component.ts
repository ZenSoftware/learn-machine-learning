import { Component, ViewChild } from '@angular/core';
import { ChartConfiguration, Point } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { NgChartsModule } from 'ng2-charts';

@Component({
  selector: 'zen-central-limit',
  templateUrl: 'zen-central-limit.component.html',
  standalone: true,
  imports: [NgChartsModule],
})
export class ZenCentralLimitComponent {
  @ViewChild(BaseChartDirective) chart!: BaseChartDirective;

  datasets: ChartConfiguration<'scatter'>['data']['datasets'] = [
    {
      data: [],
      label: 'Sample',
      pointRadius: 4,
      backgroundColor: 'rgb(0,255,255)',
    },
  ];

  options: ChartConfiguration<'scatter'>['options'] = {
    responsive: false,
    color: '#ffffff',
  };

  update() {
    const results = new Map<number, number>();

    for (let j = 0; j < 500; j++) {
      let sum = 0;
      for (let i = 0; i < 10000; i++) {
        sum += this.getRndInteger(1, 6);
      }

      const val = results.get(sum);
      if (val !== undefined) {
        results.set(sum, val + 1);
      } else {
        results.set(sum, 1);
      }
    }

    this.sampleData = Array.from(results.entries()).map(([x, y]) => ({ x, y }));

    this.chart.render();
  }

  get sampleData() {
    return (<any>this.datasets.find(x => x.label === 'Sample')).data as Point[];
  }

  set sampleData(data) {
    (<any>this.datasets.find(x => x.label === 'Sample')).data = data;
  }

  getRndInteger(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
