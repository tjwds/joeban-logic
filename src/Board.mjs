const areTuplesEqual = (a, b) => a[0] === b[0] && a[1] === b[1];

class Group {
  constructor({ x, y, color, board }) {
    this.stones = [[x, y]];
    this.color = color;
    this.board = board;
    this.liberties = null;
  }

  getLiberties(recalculate) {
    if (recalculate) {
      this.liberties = null;
    }
    if (this.liberties) {
      return this.liberties;
    }
    const liberties = [];
    this.stones.forEach((stone) => {
      const adjacent = this.board.getCellSiblings(stone[0], stone[1]);
      adjacent.forEach((spot) => {
        if (
          !this.board.getCell(spot[0], spot[1]) &&
          !liberties.some((liberty) => areTuplesEqual(liberty, spot))
        ) {
          liberties.push(spot);
        }
      });
    });

    this.liberties = liberties;
    return liberties;
  }

  mergeInStones(stones) {
    this.stones.push(...stones);
  }

  // If the group has been captured, update the board
  nullStonesOnBoard() {
    this.stones.forEach((stone) => {
      this.board.setCell(null, stone[0], stone[1]);
    });
  }
}

const createBoardShape = (width, height) => {
  const board = [];
  for (let y = 0; y < height; y++) {
    board.push(Array(width).fill(null));
  }
  return board;
};

export default class Board {
  constructor({ width, height, komi }) {
    this.width = width || 19;
    this.height = height || 19;
    this.komi = komi || 9.5;

    this.captures = {
      white: 0,
      black: 0,
    };

    this.board = createBoardShape(this.width, this.height);
    this.groups = [];

    this.turn = "black";
  }

  playStone(player, x, y) {
    // check if legal move
    // --- cell occupied?
    if (this.getCell(x, y) !== null) {
      throw new Error(`Tried to place on ${x}, ${y}, which is occupied`);
    }
    // does this square exist in our table of liberties?
    const groupsWithLiberty = this.getGroupsWithLiberty(x, y);
    let playerGroupsWithLiberty = groupsWithLiberty.filter(
      (group) => group.color === player
    );
    // --- first, make sure this wouldn't be self-capture
    // XXX:  there are some rulesets that allow this!
    if (
      this.getAdjacentStones(x, y).every((stone) => !!stone) &&
      (!playerGroupsWithLiberty.length ||
        playerGroupsWithLiberty.some(
          (group) => group.getLiberties().length === 1
        ))
    ) {
      throw new Error(`Move ${x}, ${y} would be self-capture`);
    }
    // --- if this stone touches an existing group,
    if (groupsWithLiberty.length) {
      // --- --- extend existing group(s), maybe merge groups
      if (playerGroupsWithLiberty.length > 1) {
        this.mergeGroups(playerGroupsWithLiberty);
        playerGroupsWithLiberty = groupsWithLiberty.filter(
          (group) => group.color === player
        );
      }
      // --- --- do any capturing
      const opponentGroupsWithLiberty = groupsWithLiberty.filter(
        (group) => group.color !== player
      );
      opponentGroupsWithLiberty
        .filter((group) => group.getLiberties().length === 1)
        .forEach((group) => {
          this.captureGroup(player, group);
        });
    }

    if (playerGroupsWithLiberty.length) {
      playerGroupsWithLiberty[0].stones.push([x, y]);
    } else {
      // --- if not, create new group
      this.groups.push(new Group({ x, y, color: player, board: this }));
    }
    // add stone to board state
    this.setCell(player, x, y);
    // set whose turn it is
    this.turn = this.turn === "black" ? "white" : "black";
  }

  getCellSiblings(x, y) {
    const siblings = [];
    if (x < 0 || x > this.width - 1 || y < 0 || y > this.height - 1) {
      throw new Error(
        `Attempted to get sibling coordinates for out of bounds location ${x}, ${y}`
      );
    }
    if (x !== 0) {
      siblings.push([x - 1, y]);
    }
    if (x !== this.width - 1) {
      siblings.push([x + 1, y]);
    }
    if (y !== 0) {
      siblings.push([x, y - 1]);
    }
    if (y !== this.height - 1) {
      siblings.push([x, y + 1]);
    }
    return siblings;
  }

  getAdjacentStones(x, y) {
    return this.getCellSiblings(x, y).map((cell) =>
      this.getCell(cell[0], cell[1])
    );
  }

  getCell(x, y) {
    return this.board[y][x];
  }

  setCell(value, x, y) {
    this.board[y][x] = value;
    return this;
  }

  getGroupsWithLiberty(x, y) {
    return this.groups.filter((group) =>
      group
        .getLiberties(true)
        .some((liberty) => areTuplesEqual(liberty, [x, y]))
    );
  }

  mergeGroups(groups) {
    const newParent = groups[0];
    const newChildren = groups.slice(1);

    newChildren.forEach((child) => newParent.mergeInStones(child.stones));

    this.groups = this.groups.filter((group) => !newChildren.includes(group));
  }

  captureGroup(playerCapturing, group) {
    this.captures[playerCapturing] += group.stones.length;
    group.nullStonesOnBoard();

    this.groups = this.groups.filter(
      (existingGroup) => existingGroup !== group
    );
  }
}
