# Mora Jai Puzzle Box Solver

## Description

This Mora Jai Puzzle Box Solver is a web application designed to help users find solutions for the 3x3 grid-based puzzle boxes encountered in Blue Prince.

This tool was developed to assist with complex puzzle box scenarios where the tile interactions can be intricate and difficult to solve manually but you can use it for easier ones too :P.

## Features

* **Interactive 3x3 Grid Setup:** Easily set the color of each tile on the 3x3 grid using a color palette.
* **Target Corner Color Definition:** Specify the required final colors for the four corner tiles (Top-Left, Top-Right, Bottom-Left, Bottom-Right).
* **Automatic Solver:** Employs search algorithms (Breadth-First Search and Iterative Deepening Depth-First Search) to find a solution.
* **Step-by-Step Solution Display:**
  * Shows the sequence of tiles to activate.
  * Visually displays the grid state before and after each move.
  * Provides details on the activated tile and its effect.
* **Position Notation Toggle:** View tile positions as 1-9 numerical indices or as descriptive text (TL, TOP, MID, etc.).
* **Dark Theme Interface:** A modern, visually appealing dark theme for comfortable use.
* **Color-Specific Icons:** Unique icons within the color palette options for easier identification of tile functions. **(please save me, i used ai to make these in svg and they look horrible, if anyone has a png of the icons make a PR or DM me)**
* **Help Section:** In-app guidance on how to use the solver and a legend for color functions.

## Tile Color Functions

The solver understands the following tile behaviors when a tile is activated:

* **Gray:** Empty space, no function.
* **Black:** Moves all tiles in its row one position to the right (wrapping around).
* **Red:** Globally changes White tiles to Black, and Black tiles to Red. (Activated Red tile is immune).
* **Green:** Swaps its position and color with the tile in the diametrically opposite position.
* **Yellow:** Moves itself one position up (swapping with the tile above it).
* **Pink:** Rotates all 8 surrounding tiles (orthogonal and diagonal) clockwise. (Activated Pink tile is immune).
* **Purple:** Moves itself one position down (swapping with the tile below it).
* **Orange:** Changes its own color to match the majority color of its 4 orthogonally adjacent tiles (if a strict majority exists).
* **White:**
  * **Expands:** If adjacent to any Gray tiles, turns those Gray tiles White. The activated White tile then turns Gray.
  * **Disappears:** If not adjacent to any Gray tiles, the activated White tile turns Gray.
* **Blue:** Copies the function of the tile in the middle of the grid (index 4).
  * If the middle tile's action involves movement, the Blue tile moves and remains Blue.
  * If copying White:
    * If White would expand, Blue turns its adjacent Gray tiles Blue, then turns Gray itself.
    * If White would disappear, Blue turns Gray itself.
  * The Blue tile is generally immune to effects that would change its own color unless the copied function explicitly dictates it (e.g., copying Orange or a disappearing White). If the middle tile is Blue, the activated Blue tile does nothing.

## How to Use

1. **Setup Puzzle Tab:**
    * Click on a color from the palette at the bottom of the grid area.
    * Click on a cell in the 3x3 grid to apply the selected color to that cell.
    * To set target corner colors: Click a color from the palette, then click one of the corner symbols (TL, TR, BL, BR) around the grid.
2. **Proceed to Solve:** Once the initial grid and target corners are set, click the "Proceed to Solve" button. This will switch you to the "Solve" tab.
3. **Solve Tab:**
    * Click the "Find Solution" button.
    * The application will search for a solution. Progress messages will be displayed.
    * If a solution is found, the steps will be displayed.
    * Use the "Toggle Position Notation" button to switch between numerical (1-9) and textual (TOP LEFT, MID, etc.) display for tile positions in the solution.
4. **Help Tab:** Refer to this tab for a summary of instructions and the color function legend.

## Technology Used

* **HTML:** Structure of the web page.
* **CSS:** Styling for the user interface, including the dark theme and responsive elements.
* **JavaScript (Vanilla):** All client-side logic for:
  * Grid interaction and setup.
  * Puzzle state management.
  * Implementation of tile color functions.
  * Search algorithms (BFS, IDDFS).

## Future Enhancements (Potential)

* Implement a "share" feature to share puzzle setups and solutions.
* Optimize search algorithms further for very complex puzzles. (probably not needed)
* Save/Load puzzle configurations.
* Add cool animation for the step solution :sunglasses:

## Contributing

If you have any suggestions or improvements, feel free to create a pull request or open an issue.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Donations

If you enjoyed using this tool and want to support its development, i have a paypal you can donate to (do not feel obligated though, i will not be mad if you do not donate, i just made this for fun and to help myself and others solve the puzzles)

[![PayPal](https://img.shields.io/badge/PayPal-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/ssimonesechii)
