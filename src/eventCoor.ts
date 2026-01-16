export const getEventCoordinates = (event: MouseEvent | TouchEvent): { clientX: number; clientY: number; isMouseEvent?: boolean; isTouchEvent?: boolean; } | null => {
  // Maybe in micro frontend environment, using `constructor.name` is necessary
  if (event?.constructor?.name === 'MouseEvent') {
    return { clientX: event.clientX, clientY: event.clientY, isMouseEvent: true };
  }
  if (event?.constructor?.name === 'TouchEvent') {
    const touch = event.touches?.[0] || event.changedTouches?.[0];
    console.log('zjzj getEventCoordinates TouchEvent', touch?.clientX, touch)
    if (touch) {
      return { clientX: touch.clientX, clientY: touch.clientY, isTouchEvent: true };
    }
  }
  return null;
}
