import { Component, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ChartConfiguration, ChartDataset, Point } from 'chart.js';
import * as math from 'mathjs';
import { BaseChartDirective } from 'ng2-charts';
import { NgChartsModule } from 'ng2-charts';

interface LocalParameters {
  x: number;
  parameters: number[];
}

const CONFIG = {
  idealized: (x: number) => 134 + 69 * math.cos(0.1 * x),
  idealizedStep: 10,
  sectionCount: 20,
  minX: 10,
  maxX: 100,
  standardDeviation: 5,
  learningRate: 0.00000001,

  sampleCount: 100,
  badwidth: 10,
};

@Component({
  selector: 'zen-local-lg',
  templateUrl: 'zen-local-lg.component.html',
  standalone: true,
  imports: [MatButtonModule, NgChartsModule],
})
export class ZenLocalLGComponent {
  @ViewChild(BaseChartDirective) chart!: BaseChartDirective;

  localParams: LocalParameters[] = [];

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
    const idealizedDataset = this.getDataset('Idealized');

    for (let x = 0; x <= CONFIG.maxX; x += CONFIG.idealizedStep) {
      idealizedDataset.data.push({ x, y: CONFIG.idealized(x) });
    }

    this.generateSampleData();

    // Initialize parameters
    for (
      let x = CONFIG.minX;
      x < CONFIG.maxX;
      x += (CONFIG.maxX - CONFIG.minX) / CONFIG.sectionCount
    ) {
      this.localParams.push({ x, parameters: [0, 0] });
    }
  }

  update() {
    const sampleDataset = this.getDataset('Sample');
    let loopCount = 0;

    do {
      for (let s = 0; s < this.localParams.length; s++) {
        for (let j = 0; j < this.localParams[s].parameters.length; j++) {
          let sum = 0;
          for (let i = 0; i < sampleDataset.data.length; i++) {
            const x = sampleDataset.data[i].x;
            const y = sampleDataset.data[i].y;
            const h = this.hypothesis(x, this.localParams[s].parameters);
            const w = math.exp(-math.pow(x - this.localParams[s].x, 2) / (2 * CONFIG.badwidth));
            sum += w * CONFIG.learningRate * (y - h) * (j !== 0 ? x : 1);
          }
          this.localParams[s].parameters[j] += sum;
        }
      }

      loopCount++;
    } while (loopCount < 100_000);

    console.log(`loopCount: ${loopCount}`, this.localParams);

    this.renderRegression();
  }

  generateSampleData() {
    const data: Point[] = [];
    for (let i = 0; i < CONFIG.sampleCount; i++) {
      const x = this.boundedRandom(CONFIG.minX, CONFIG.maxX);
      const y = this.gaussianRandom(CONFIG.idealized(x), CONFIG.standardDeviation);
      data.push({ x, y });
    }
    const sampleDataset = this.getDataset('Sample');
    sampleDataset.data = data.sort((a, b) => a.x - b.x);
  }

  newSampleData() {
    this.generateSampleData();
    const regressionDataset = this.getDataset('Regression');
    regressionDataset.data = [];

    this.localParams = [];
    for (
      let x = CONFIG.minX;
      x < CONFIG.maxX;
      x += (CONFIG.maxX - CONFIG.minX) / CONFIG.sectionCount
    ) {
      this.localParams.push({ x, parameters: [0, 0] });
    }

    this.chart.update();
  }

  hypothesis(x: number, parameters: number[]) {
    let h = 0;
    for (let j = 1; j < parameters.length; j++) {
      h += parameters[j] * x;
    }
    // Add the intercept
    return h + parameters[0];
  }

  renderRegression() {
    const regressionDataset = this.getDataset('Regression');

    if (regressionDataset) {
      const data: Point[] = [];
      for (let i = 0; i < this.localParams.length; i++) {
        data.push({
          x: this.localParams[i].x,
          y: this.hypothesis(this.localParams[i].x, this.localParams[i].parameters),
        });
      }
      regressionDataset.data = data;

      this.chart.update();
    }
  }

  gaussianRandom(mean = 0, stdev = 1) {
    const u = 1 - Math.random(); //Converting [0,1) to (0,1)
    const v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * stdev + mean;
  }

  boundedRandom(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  getDataset(label: string) {
    return this.datasets.find(c => c.label === label) as ChartDataset<'scatter', Point[]>;
  }
}
