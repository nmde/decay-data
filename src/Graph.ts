import { GraphNode } from './GraphNode';

export class Graph {
  public nodes: GraphNode[] = [];

  /**
   * Gets the node with the specified key.
   * @param key - The key of the node to get.
   * @returns The node.
   */
  public get(key: string) {
    return this.nodes.find((n) => n.label === key);
  }

  /**
   * Gets the leaves of the graph.
   */
  private get leaves() {
    return this.nodes.filter((n) => n.links.length === 0);
  }

  /**
   * Removes the specified node from the graph.
   * @param node - The key of the node to remove.
   */
  private removeNode(key: string) {
    let target = -1;
    this.nodes.forEach((node, i) => {
      if (node.label === key) {
        target = i;
      }
      if (node.links.indexOf(key) >= 0) {
        node.links.splice(node.links.indexOf(key), 1);
      }
    });
    this.nodes.splice(target, 1);
  }

  /**
   * Sorts the nodes of the graph in order from most links to least.
   * @returns The sorted nodes.
   */
  public sort() {
    let sorted: string[] = [];
    while (this.nodes.length > 0) {
      const leaves = this.leaves.map((n) => n.label).sort();
      leaves.forEach((n) => {
        this.removeNode(n);
      });
      sorted = sorted.concat(leaves);
    }
    return sorted.reverse();
  }
}
