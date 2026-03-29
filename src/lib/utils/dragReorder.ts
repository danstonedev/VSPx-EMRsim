/**
 * Reusable drag-reorder logic for sortable lists.
 * Eliminates duplicated dragStart/dragOver/drop/dragEnd
 * implementations across PlanSection's goals, in-clinic, and HEP lists.
 */
export function createDragReorder<T>(
  getItems: () => T[],
  setItems: (items: T[]) => void,
  onDragStateChange?: (index: number | null) => void,
) {
  let srcIdx: number | null = null;

  function setDragIndex(index: number | null) {
    srcIdx = index;
    onDragStateChange?.(index);
  }

  return {
    get dragIdx() {
      return srcIdx;
    },
    dragStart(index: number, e: DragEvent) {
      setDragIndex(index);
      e.dataTransfer!.effectAllowed = 'move';
      e.dataTransfer!.setData('text/plain', String(index));
    },
    dragOver(e: DragEvent) {
      e.preventDefault();
      e.dataTransfer!.dropEffect = 'move';
    },
    drop(toIndex: number, e: DragEvent) {
      e.preventDefault();
      if (srcIdx === null || srcIdx === toIndex) return;
      const items = [...getItems()];
      const [moved] = items.splice(srcIdx, 1);
      items.splice(toIndex, 0, moved);
      setItems(items);
      setDragIndex(null);
    },
    dragEnd() {
      setDragIndex(null);
    },
  };
}
