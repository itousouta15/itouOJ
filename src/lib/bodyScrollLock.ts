// Loading boundaries can briefly overlap modal instances. A shared lock also
// prevents a closing mobile menu from unlocking a newly opened dialog.
let locks = 0;
let previousOverflow = "";

export function lockBodyScroll(): () => void {
  if (locks === 0) previousOverflow = document.body.style.overflow;
  locks++;
  document.body.style.overflow = "hidden";
  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (--locks === 0) document.body.style.overflow = previousOverflow;
  };
}
