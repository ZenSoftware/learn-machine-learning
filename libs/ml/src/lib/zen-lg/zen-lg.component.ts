import { Component, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ChartConfiguration, ChartDataset, Point } from 'chart.js';
import * as math from 'mathjs';
import { BaseChartDirective } from 'ng2-charts';
import { NgChartsModule } from 'ng2-charts';

const CONFIG = {
  idealized: (x: number) => 80 - 0.7 * x,
  idealizedStep: 10,
  sampleCount: 100,
  minX: 10,
  maxX: 100,
  standardDeviation: 5,
  learningRate: 0.0001,
};

@Component({
  selector: 'zen-lg',
  templateUrl: 'zen-lg.component.html',
  standalone: true,
  imports: [MatButtonModule, NgChartsModule],
})
export class ZenLGComponent {
  @ViewChild(BaseChartDirective) chart!: BaseChartDirective;

  parameters: number[] = [];
  closedFormRegression = math.compile('(x_transposed * x)^-1 * x_transposed * y');

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
    scales: {
      x: {
        title: { display: true, text: 'Square Feet' },
      },
      y: {
        title: { display: true, text: 'Price (in $1000)' },
      },
    },
  };

  constructor() {
    // Generate idealized data
    const idealizedDataset = this.getDataset('Idealized');

    for (let x = 0; x <= CONFIG.maxX; x += CONFIG.idealizedStep) {
      idealizedDataset.data.push({ x, y: CONFIG.idealized(x) });
    }

    this.generateSampleData();

    // Initialize parameters
    for (let j = 0; j < 2; j++) {
      this.parameters.push(0);
    }
  }

  /**
   * Update the parameters to minimize the error
   */
  update() {
    // this.updateBatch(); // Slowest
    // this.updateStochastic(); // Converges faster than batch
    this.updateNormalEquation(); // Fastest
    this.renderRegression();
  }

  updateBatch() {
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
    } while (loopCount < 1_000);

    console.log(`loopCount: ${loopCount}`, this.parameters);
  }

  updateStochastic() {
    const sampleDataset = this.getDataset('Sample');
    let loopCount = 0;

    do {
      for (let i = 0; i < sampleDataset.data.length; i++) {
        for (let j = 0; j < this.parameters.length; j++) {
          const x = sampleDataset.data[i].x;
          const y = sampleDataset.data[i].y;
          const h = this.hypothesis(x);
          this.parameters[j] += CONFIG.learningRate * (y - h) * (j !== 0 ? x : 1);
        }
      }

      loopCount++;
    } while (loopCount < 1_000);

    console.log(`loopCount: ${loopCount}`, this.parameters);
  }

  updateNormalEquation() {
    const result: math.Matrix = this.closedFormRegression.evaluate(this.getData());
    this.parameters = math.transpose(result).toArray()[0] as number[];
    console.log('parameters', this.parameters);
  }

  getData() {
    const sampleDataset = this.getDataset('Sample');
    const x: number[][] = [];
    const y: number[][] = [];

    for (const point of sampleDataset.data) {
      x.push([point.x]);
      y.push([point.y]);
    }

    const x_withIntecept = math.concat(math.ones(x.length, 1), x);
    const x_transposed = math.transpose(x_withIntecept);

    return { x: x_withIntecept, x_transposed, y };
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

    for (let j = 0; j < this.parameters.length; j++) {
      this.parameters[j] = 0;
    }

    this.chart.update();
  }

  hypothesis(x: number) {
    let h = 0;
    for (let j = 1; j < this.parameters.length; j++) {
      h += this.parameters[j] * x;
    }
    // Add the intercept
    return h + this.parameters[0];
  }

  renderRegression() {
    const regressionDataset = this.getDataset('Regression');

    if (regressionDataset) {
      const data: Point[] = [];
      for (let x = 0; x <= CONFIG.maxX; x += CONFIG.idealizedStep) {
        data.push({ x, y: this.hypothesis(x) });
      }
      regressionDataset.data = data;
      this.chart.update();
    }
  }

  gaussianRandom(mean = 0, stdev = 1) {
    const u = Math.random();
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
