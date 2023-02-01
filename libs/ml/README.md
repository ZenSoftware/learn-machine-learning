```ts
/**
 * Calculate the slope and intercept of a regression line
 * https://youtu.be/P8hT5nDai6A?t=452
 */
calculateSlopeIntercept() {
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  const n = this.sampleData.length;
  for (let i = 0; i < n; i++) {
    const x = this.sampleData[i].x;
    const y = this.sampleData[i].y;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }
  this.slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  this.intercept = (sumY - this.slope * sumX) / n;
}
```