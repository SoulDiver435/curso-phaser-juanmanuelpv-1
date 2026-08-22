/**
 * @param {number[][]} data
 */
export function weightedRandom(data) {
  const values = data.map((d) => d[0]);
  const weights = data.map((d) => d[1]);

  /**@type {number[]} */
  const cumulativeWeights = [];

  for (let i = 0; i < weights.length; i++) {
    cumulativeWeights[i] = weights[i] + (cumulativeWeights[i - 1] || 0);
  }

  const maxCumulativeWeight = cumulativeWeights[cumulativeWeights.length - 1];

  const randomNumber = maxCumulativeWeight * Math.random();

  return values[
    cumulativeWeights.filter((element) => element <= randomNumber).length
  ];
}
