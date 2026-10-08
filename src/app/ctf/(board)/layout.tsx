export default function CtfBoardLayout({ children, modal }: { children: React.ReactNode; modal: React.ReactNode }) {
  // Other CTF pages unmount this board-only layout. Avoid a catch-all modal slot:
  // it would also register unknown /ctf/* URLs as successful board pages.
  return <>{children}{modal}</>;
}
