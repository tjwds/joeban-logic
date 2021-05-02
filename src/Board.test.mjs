import Board from "./Board.mjs";

test("Basic play and capture", () => {
  const board = new Board({ width: 3, height: 3 });
  expect(board.board).toStrictEqual([
    [null, null, null],
    [null, null, null],
    [null, null, null],
  ]);

  board.playStone("black", 1, 1);
  board.playStone("white", 0, 1);
  board.playStone("black", 0, 2);
  board.playStone("white", 0, 0);
  expect(board.board).toStrictEqual([
    ["white", null, null],
    ["white", "black", null],
    ["black", null, null],
  ]);
  expect(board.groups.length).toEqual(3);

  board.playStone("black", 1, 0);
  expect(board.board).toStrictEqual([
    [null, "black", null],
    [null, "black", null],
    ["black", null, null],
  ]);
  expect(board.groups.length).toEqual(2);
  expect(board.captures.black).toEqual(2);
});

const setUpSelfCaptureBoard = () => {
  const board = new Board({ width: 3, height: 3 });
  board.playStone("black", 0, 0);
  board.playStone("white", 1, 0);
  board.playStone("black", 2, 2);
  board.playStone("white", 0, 1);
  return board;
};

test("No self-capture", () => {
  const board = setUpSelfCaptureBoard();
  expect(() => board.playStone("black", 0, 0)).toThrow();
});
