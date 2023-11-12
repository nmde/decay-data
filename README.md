# decay

A TypeScript implementation of radionuclide decay equations.

Provides a library, CLI, and GUI for inputting an inventory of nuclides, and calculating their number densities and activities after decaying for a specified amount of time.

## Contents
- [decay](#decay)
  - [Contents](#contents)
  - [Input](#input)
    - [Manual CSV Input](#manual-csv-input)
    - [Automatic Input](#automatic-input)
    - [JSON Input](#json-input)
  - [CLI Usage](#cli-usage)
  - [GUI Usage](#gui-usage)
  - [Performance Comparisons](#performance-comparisons)

## Input
The library requires two inputs: data for all nuclides in the chain, and a list of initial inventories. 

### Manual CSV Input

**Nuclide Data Format**: The manually created nuclide data file is expected to have the following columns, in order:
- Isotope - the name of the isotope, including mass number
- Branching Fraction - the branching fraction from the current isotope's parent to it
- Half Life - the half life of the isotope, including units.
- Gamma Emitter - if the isotope emits significant gammas.
- Max Significant Gamma Energy - the most significant gamma energy, or a comma separated list of gamma energies times the frequency.
- Gamma Frequency: if only one significant gamma energy is specified, list the frequency of that energy. If multiple energies are specified in the previous column, leave blank.
- Decay Product: the product of the decay of this isotope.

Upon reaching the decay products, the columns must repeat for each nuclide down the decay chain. In the case of branching, the branches are listed in the following row(s), starting from the same column as the other daughters.

**Inventory Data Format**: The inventory CSV file is expected to have the following columns, in order:
- Isotope: the name of the isotope. Must match the format used in the nuclide data file.
- Bq/s: the initial activity in Bq/s.
- Ci/s: the initial activity in Ci/s.

### Automatic Input
Todo

### JSON Input
Todo

## CLI Usage
To run the CLI, enter the following command:
```
yarn ts-node src/index.ts --help
```
This command will invoke the CLI and display a help message describing the options and arguments the CLI accepts.

The three required arguments are the path to the nuclide data file, the path to the inventory file, and the amount of time to decay, in seconds. An example command with the arguments:
```
yarn ts-node src/index.ts nuclides.csv inventory.csv -t 3600
```
The above command will read nuclide data from ./nuclides.csv, inventory data from ./inventory.csv, and calculate decays for one hour.

Additional options are:
- -l, --level \<level\>: Controls the detail of information written to the info.log output file. Defaults to 1.
- -o, --output \<directory\>: Specify the directory to write output files to. Defaults to ./output.

## GUI Usage
Todo

## Performance Comparisons
| Test       | Python | Decay.ts |
|------------|--------|----------|
| Kr-85 Only | 3s     | 4.28s    |
