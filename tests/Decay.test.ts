import path from 'path';
import { InputReader } from '../src/InputReader';
import { Decay } from '../src/Decay';
import { Inventory } from '../src/Inventory';

import OneNuclideExpected from './data/one_nuclide.json';
import TwoNuclidesExpected from './data/two_nuclides.json';

const g = (i: Inventory[], n: string) =>
  i.find((x) => x.nuclide === n) as Inventory;
const d = (a: number, b: number) => (Math.abs(a - b) / ((a + b) / 2)) * 100;

test('one nuclide', async () => {
  const reader = new InputReader();
  const nuclides = await reader.readNuclideCSV('nuclides.csv');
  const inventory = await reader.readInventoryCSV('tests/data/one_nuclide.csv');
  const output = new Decay(nuclides, inventory).decay(3600);
  expect(d(g(output, 'Kr-85').number, OneNuclideExpected['Kr-85'])).toBeLessThan(0.1);
  expect(d(g(output, 'Rb-85').number, OneNuclideExpected['Rb-85'])).toBeLessThan(0.1);
});

test('two nuclides', async () => {
const reader = new InputReader();
  const nuclides = await reader.readNuclideCSV('nuclides.csv');
  const inventory = await reader.readInventoryCSV('tests/data/two_nuclides.csv');
  const output = new Decay(nuclides, inventory).decay(3600);
  expect(d(g(output, 'Kr-85').number, TwoNuclidesExpected['Kr-85'])).toBeLessThan(0.1);
  expect(d(g(output, 'Kr-85m').number, TwoNuclidesExpected['Kr-85m'])).toBeLessThan(0.1);
  expect(d(g(output, 'Rb-85').number, TwoNuclidesExpected['Rb-85'])).toBeLessThan(0.1);
});
