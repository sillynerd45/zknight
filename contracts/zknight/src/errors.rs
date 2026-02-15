//! Error types for ZKnight contract

use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    // Game errors
    GameNotFound = 1,
    GameNotWaiting = 2,
    WrongStatus = 3,
    CannotPlayYourself = 4,
    GameExpired = 5,
    AlreadyHasActiveGame = 6,

    // Puzzle errors
    PuzzleNotFound = 10,
    InvalidPuzzleId = 11,

    // Commitment errors
    NoCommitment = 20,
    BadPreimage = 21,
    AlreadyCommitted = 22,

    // Proof errors
    InvalidProof = 30,

    // Timeout errors
    TooEarly = 40,
    YouDidNotCommit = 41,
    OpponentAlreadyRevealed = 42,
    NoCommitTime = 43,

    // Authorization errors
    Unauthorized = 50,
}
