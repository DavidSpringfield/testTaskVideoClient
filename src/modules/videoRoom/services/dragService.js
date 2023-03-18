export function draggable(elementId, parentId) {
  const el = document.getElementById(elementId);
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  let initialPos = {};

  // store initial element position
  initialPos.x = el.offsetLeft;
  initialPos.y = el.offsetTop;

  el.onmousedown = dragMouseDown;
  el.ontouchstart = dragMouseDown;

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();

    // get the mouse cursor position at startup:
    pos3 = e.clientX || e.touches[0].clientX;
    pos4 = e.clientY || e.touches[0].clientY;

    document.onmouseup = closeDragElement;
    document.ontouchend = closeDragElement;

    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
    document.ontouchmove = elementDrag;
  }

  function elementDrag(e) {
    try {
      e = e || window.event;
      //e.preventDefault();

      // calculate the new cursor position:
      pos1 = pos3 - (e.clientX || e.touches[0].clientX);
      pos2 = pos4 - (e.clientY || e.touches[0].clientY);
      pos3 = e.clientX || e.touches[0].clientX;
      pos4 = e.clientY || e.touches[0].clientY;

      // set the element's new position:
      const newPosX = el.offsetLeft - pos1;
      const newPosY = el.offsetTop - pos2;

      if (isInsideParent(newPosX, newPosY)) {
        el.style.top = newPosY + "px";
        el.style.left = newPosX + "px";
      }
    }
    catch (error) {
      console.warn(error);
    }
  }

  function isInsideParent(x, y) {
    const parentEl = document.getElementById(parentId);
    const parentRect = parentEl.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    return (
      x >= parentRect.left &&
      x + elRect.width <= parentRect.right &&
      y >= parentRect.top &&
      y + elRect.height <= parentRect.bottom
    );
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
    document.ontouchend = null;
    document.ontouchmove = null;
  }

  function resetElementPosition() {
    // reset element position to initial position
    el.style.top = initialPos.y + "px";
    el.style.left = initialPos.x + "px";
  }

  return { resetElementPosition };
}