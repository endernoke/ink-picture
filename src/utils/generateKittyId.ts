/**
 * Generates unique IDs for Kitty image rendering.
 */

const MIN_ID = 1048576;
const MAX_ID = 16777216;

class KittyIdGenerator {
  private currentId = MIN_ID;
  private freedIds = new Set<number>();

  generateId(): number {
    // Reuse freed ID if available
    if (this.freedIds.size > 0) {
      const reusedId = this.freedIds.values().next().value!;
      this.freedIds.delete(reusedId);
      return reusedId;
    }

    // Generate new sequential ID
    if (this.currentId >= MAX_ID) {
      throw new Error("Kitty ID overflow: Maximum ID value reached");
    }

    return this.currentId++;
  }

  freeId(id: number): boolean {
    // Validate ID is in our managed range and was previously allocated
    if (id >= MIN_ID && id < this.currentId) {
      return this.freedIds.add(id).size > this.freedIds.size - 1;
    }
    return false;
  }

  // Utility methods
  getActiveIdCount(): number {
    return this.currentId - MIN_ID - this.freedIds.size;
  }

  getAvailableIdCount(): number {
    return MAX_ID - this.currentId + this.freedIds.size;
  }
}

// Export singleton instance
const generator = new KittyIdGenerator();
export const generateId = () => generator.generateId();
export const freeId = (id: number) => generator.freeId(id);
export default generateId;
