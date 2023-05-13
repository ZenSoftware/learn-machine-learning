import { Component, ViewChild } from '@angular/core';
import { ChartConfiguration, ChartDataset, Point } from 'chart.js';
import * as math from 'mathjs';
import { BaseChartDirective } from 'ng2-charts';
import { NgChartsModule } from 'ng2-charts';

const CONFIG = {
  idealized: (x: number) => -26 + 4.7 * x,
  minX: 0,
  maxX: 10,
  plotCount: 50,
  learningRate: 0.0001,
};

@Component({
  selector: 'zen-logistic-regression',
  templateUrl: 'zen-logistic-regression.component.html',
  standalone: true,
  imports: [NgChartsModule],
})
export class ZenLogisticRegressionComponent {
  @ViewChild(BaseChartDirective) chart!: BaseChartDirective;

  parameters: number[] = [];

  datasets: ChartConfiguration<'scatter'>['data']['datasets'] = [
    {
      data: [],
      label: 'Regression',
      pointRadius: 8,
      pointBackgroundColor: 'rgb(255,255,0)',
    },
    {
      data: [],
      label: 'Idealized',
      pointRadius: 8,
      pointBackgroundColor: 'rgb(255,0,255)',
    },
    {
      data: [],
      label: 'Sample',
      pointRadius: 8,
      pointBackgroundColor: 'rgb(0,255,255)',
    },
  ];

  options: ChartConfiguration<'scatter'>['options'] = {
    responsive: false,
    color: '#ffffff',
  };

  constructor() {
    // Generate idealized data
    // const idealizedDataset = this.getDataset('Idealized');

    // for (let x = CONFIG.minX; x <= CONFIG.maxX; x += CONFIG.idealizedStep) {
    //   idealizedDataset.data.push({ x, y: CONFIG.idealized(x) });
    // }

    this.generateSampleData();

    // Initialize parameters
    this.parameters = [0, 0];
  }

  /**
   * Update the parameters to minimize the error
   */
  update() {
    const sampleDataset = this.getDataset('Sample');
    let loopCount = 0;

    do {
      for (let j = 0; j < this.parameters.length; j++) {
        let sum = 0;
        for (let i = 0; i < sampleDataset.data.length; i++) {
          const x = sampleDataset.data[i].x;
          const y = sampleDataset.data[i].y;
          const h = this.hypothesis(x);
          sum += CONFIG.learningRate * (y - h) * (j !== 0 ? x : 1);
        }
        this.parameters[j] += sum;
      }

      loopCount++;
    } while (loopCount < 100_000);

    console.log(`loopCount: ${loopCount}`, this.parameters);

    this.renderRegression();
  }

  generateSampleData() {
    const sampleDataset = this.getDataset('Sample');
    sampleDataset.data = [];

    for (
      let x = CONFIG.minX;
      x <= CONFIG.maxX;
      x += (CONFIG.maxX - CONFIG.minX) / CONFIG.plotCount
    ) {
      const sig = 1 / (1 + math.exp(-CONFIG.idealized(x)));
      if (Math.random() < sig) sampleDataset.data.push({ x, y: 1 });
      else sampleDataset.data.push({ x, y: 0 });
    }
  }

  newSampleData() {
    this.generateSampleData();

    const regressionDataset = this.getDataset('Regression');
    regressionDataset.data = [];
    this.parameters = [0, 0];
    this.chart.update();
  }

  hypothesis(x: number) {
    let theta_x = 0;
    for (let j = 1; j < this.parameters.length; j++) {
      theta_x += this.parameters[j] * x;
    }
    // Add the intercept
    theta_x += this.parameters[0];
    return 1 / (1 + math.exp(-theta_x));
  }

  renderRegression() {
    const regressionDataset = this.getDataset('Regression');
    regressionDataset.data = [];
    for (
      let x = CONFIG.minX;
      x <= CONFIG.maxX;
      x += (CONFIG.maxX - CONFIG.minX) / CONFIG.plotCount
    ) {
      regressionDataset.data.push({ x, y: this.hypothesis(x) });
    }
    this.chart.update();
  }

  getDataset(label: string) {
    return this.datasets.find(c => c.label === label) as ChartDataset<'scatter', Point[]>;
  }
}
