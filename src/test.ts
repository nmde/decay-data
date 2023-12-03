function q(z: number) {
  return 450106 * Math.sin((Math.PI * (z + 0.3134)) / 12.9601);
}

function Tco(z: number) {
  return 653.7 + 0.01207 * Math.sqrt(q(z));
}

function Tinfty(z: number) {
  return (
    556 +
    (1 / (2111.1 * 1.225 * 0.974)) *
      (14092.3 * Math.sin(0.242405 * z) -
        185142 * Math.cos(0.242405 * z) +
        185142)
  );
}

function qNB(z: number) {
  return 6860.989 * (Tco(z) - 653.7) ** 2;
}

function qFC(z: number) {
  return 130240 * (Tco(z) - Tinfty(z));
}

function q2(z: number) {
  return qFC(z) * Math.sqrt(1 + ((q(z) / qFC(z)) * (1 - qNB(z) / q(z))) ** 2);
}

const guess = 8.02;
const a = q(guess);
const b = q2(guess);
const diff = Math.abs(a - b);
console.log(`${guess}: ${a}, ${b}, ${diff}`);
