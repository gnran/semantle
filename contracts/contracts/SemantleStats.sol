// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SemantleStats
 * @notice Stores Semantle game statistics on-chain with automatic fund forwarding
 */
contract SemantleStats {
    struct UserStats {
        uint256 totalGames;      // Number of games played
        uint256 totalAttempts;   // Sum of all attempts
        uint256 bestScore;       // Best (minimum) attempts
        uint256 lastUpdated;     // Last update timestamp
    }

    mapping(address => UserStats) public userStats;

    /// @notice Contract deployer (funds receiver)
    address public immutable deployer;

    /*──────────────────── EVENTS ────────────────────*/

    event GameSubmitted(
        address indexed user,
        uint16 attempts,
        uint256 totalGames,
        uint256 totalAttempts,
        uint256 bestScore,
        uint256 timestamp
    );

    event FundsForwarded(
        address indexed from,
        address indexed to,
        uint256 amount
    );

    /*────────────────── CONSTRUCTOR ──────────────────*/

    constructor() {
        deployer = msg.sender;
    }

    /*──────────────── GAME LOGIC ─────────────────────*/

    /**
     * @notice Submit the result of a finished Semantle game
     * @param attempts Number of attempts used (> 0)
     */
    function submitGame(uint16 attempts) external {
        require(attempts > 0, "Attempts must be > 0");

        UserStats storage stats = userStats[msg.sender];

        stats.totalGames += 1;
        stats.totalAttempts += attempts;

        if (stats.bestScore == 0 || attempts < stats.bestScore) {
            stats.bestScore = attempts;
        }

        stats.lastUpdated = block.timestamp;

        emit GameSubmitted(
            msg.sender,
            attempts,
            stats.totalGames,
            stats.totalAttempts,
            stats.bestScore,
            block.timestamp
        );
    }

    /*─────────────── VIEW HELPERS ───────────────────*/

    /**
     * @notice Get complete user stats including calculated average
     * @param user Address to query
     * @return stats User statistics struct
     * @return avgAttempts Average attempts (fixed point * 100)
     */
    function getUserStats(address user)
        external
        view
        returns (UserStats memory stats, uint256 avgAttempts)
    {
        stats = userStats[user];
        avgAttempts = stats.totalGames > 0
            ? (stats.totalAttempts * 100) / stats.totalGames
            : 0;
    }

    /*────────────── ETH HANDLING ─────────────────────*/

    receive() external payable {
        _forwardETH();
    }

    fallback() external payable {
        _forwardETH();
    }

    function _forwardETH() internal {
        if (msg.value > 0) {
            (bool success, ) = payable(deployer).call{value: msg.value}("");
            require(success, "ETH forward failed");
            emit FundsForwarded(msg.sender, deployer, msg.value);
        }
    }
}
