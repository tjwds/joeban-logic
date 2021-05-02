import Board from "./Board.mjs";

const prettyPrintBoard = (board) => {
  const getCharForState = (state) => {
    switch (state) {
      case "black":
        return "•";
      case "white":
        return "o";
      default:
        return "+";
    }
  };
  getCharForState();
  const printRow = (row) =>
    row.reduce((prev, current) => prev + getCharForState(current), "");

  board.board.reverse().forEach((row) => console.log(printRow(row)));
};

const board = new Board({ width: 5, height: 5 });
board.playStone("black", 2, 2);
prettyPrintBoard(board);
// console.log(board.board)
