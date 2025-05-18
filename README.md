# Blue Prince Companion

## Description

Welcome to the Blue Prince Companion! This project is a collection of tools and utilities designed to assist with various aspects of the game Blue Prince.

Currently, the companion includes:

* **Mora Jai Puzzle Box Solver:** A dedicated tool to help users find solutions for the 3x3 grid-based puzzle boxes.
* **Constellation Calculator (WIP):** A tool to help with constellations

This tool was developed to assist with complex puzzle box scenarios where the tile interactions can be intricate and difficult to solve manually but you can use it for easier ones too :P.

## Live Version

You can use the Mora Jai Solver directly in your browser by visiting:
[https://zzaimoo.github.io/](https://zzaimoo.github.io/)

## Features

### Constellation Calculator Features (Coming Soon)

* (Details to be added as the tool is developed)

### Mora Jai Puzzle Box Solver Features

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
* **Sandbox Mode with Random Puzzle Generation:**
  * Manually set up and test puzzle configurations.
  * Generate random puzzles with adjustable difficulty (Easy, Medium, Hard).
  * Generated puzzles use a seed (displayed to the user) for reproducibility.
  * Includes solvability checks and trivial puzzle avoidance based on selected difficulty.
  * Option to view the solution for generated puzzles directly in the sandbox.
* **Sandbox Puzzle History:**
  * Automatically saves successfully generated random puzzles (seed, grid, targets, solution, difficulty).
  * Displays a list of recent puzzles in a dedicated panel next to the sandbox.
  * Allows loading a previously generated puzzle from history back into the sandbox.
  * Option to clear the puzzle history.

## Tile Color Functions

The solver understands the following tile behaviors when a tile is activated:

* **Gray:** Empty space, no function.
* **Black:** Moves all tiles in its row one position to the right (wrapping around).
* **Red:** Globally changes White tiles to Black, and Black tiles to Red. (Activated Red tile is immune).
* **Green:** Swaps its position and color with the tile in the diametrically opposite position.
* **Yellow:** Moves itself one position up (swapping with the tile above it).
* **Pink:** Rotates all 8 surrounding tiles (orthogonal and diagonal) clockwise. (Activated Pink tile is immune).
* **Purple:** Moves itself one position down (swapping with the tile below it).
* **Orange:** Changes its own color to match the most frequent unique color of its 4 orthogonally adjacent tiles (if one exists).
* **White:**
  * Toggles itself and all neighbouring tiles between grey and white
* **Blue:** Copies the function of the tile in the middle of the grid (index 4).
  * If the middle tile's action involves movement, the Blue tile moves and remains Blue.
  * If copying White:
    * Toggles itself and all neighbouring tiles between grey and blue
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
5. **Sandbox Tab:**
    * **Manual Setup:** Click a color from the sandbox palette, then click a grid cell to set its color. Click a color, then a corner symbol (TL, TR, BL, BR) to set a reference target color.
    * **Manual Play:** De-select any color from the palette (e.g., by clicking the selected color again). Then, click any tile on the sandbox grid to activate its function. If target corners are set and matched, a victory modal appears.
    * **Random Puzzle Generation:**
        * **Difficulty:** Use the slider to select a difficulty (Easy, Medium, Hard). This influences the target solution length for generated puzzles.
            * Easy: Targets ~3-5 steps.
            * Medium: Targets ~5-10 steps.
            * Hard: Targets ~8-15 steps.
        * **Generate:** Click "Generate Random Puzzle". A loading modal will appear.
        * The system attempts to generate a puzzle by:
            1. Creating random target corner colors.
            2. Populating a 3x3 grid ensuring colors for targets are present and aiming for color diversity. (If an Orange tile is placed, its orthogonal neighbors are populated to encourage a potentially interesting, non-predetermined effect, using the seeded RNG).
            3. Checking if the puzzle is solvable within the selected difficulty's maximum step limit using a seeded random number generator (the seed is displayed in a notification on success/failure).
            4. **Triviality Check:** If a puzzle is solvable but its solution length is below the minimum steps for the chosen difficulty (e.g., already solved or solvable in too few moves), it's discarded, and the generator tries again (unless a specific seed was provided by the user, in which case the puzzle is generated regardless of triviality).
        * **Outcome:**
            * On success, the new puzzle is displayed. The seed used is shown in a notification.
            * On failure (e.g., after many attempts, no suitable puzzle is found), an error notification is shown with the last seed tried.
        * **Show Solution Steps:** If a random puzzle was successfully generated, the "Test Solve This Puzzle" button changes to "Show Solution Steps". Clicking it displays the solution directly within the Sandbox tab. If the grid or targets are manually changed after generation, this button reverts to its original behavior.
    * **Controls:**
        * `Reset Sandbox`: Clears the grid, targets, and resets play mode.
        * `Restart Puzzle`: If in play mode (after a tile click) or after solving a generated puzzle, this reverts the grid to the state it was in when play began or when the puzzle was generated.
    * **Puzzle History Panel:**
        * Located next to the sandbox controls when the Sandbox tab is active.
        * Displays a list of recently generated puzzles, showing their seed, difficulty, step count, and generation date.
        * Each entry has a "Load" button to reload that puzzle's configuration (grid, targets, seed, difficulty) into the sandbox setup area. The solution for the loaded puzzle is also re-established for the "Show Solution Steps" button.
        * A "Clear History" button allows for removing all saved puzzles from the history (requires confirmation).

## Future Enhancements (Potential)

* Optimize search algorithms further for very complex puzzles. (probably not needed)
* Add cool animation for the step solution :sunglasses:

## Contributing

If you have any suggestions or improvements, feel free to create a pull request or open an issue.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Donations

If you enjoyed using this tool and want to support its development, i have a paypal you can donate to (do not feel obligated though, i will not be mad if you do not donate, i just made this for fun and to help myself and others solve the puzzles)

[![PayPal](https://img.shields.io/badge/PayPal-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/ssimonesechii)
