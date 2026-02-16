import { Client as ZknightClient, type Game, type Puzzle } from './bindings';
import { NETWORK_PASSPHRASE, RPC_URL, DEFAULT_METHOD_OPTIONS, DEFAULT_AUTH_TTL_MINUTES } from '@/utils/constants';
import { contract } from '@stellar/stellar-sdk';
import { Buffer } from 'buffer';
import { signAndSendViaLaunchtube } from '@/utils/transactionHelper';
import { calculateValidUntilLedger } from '@/utils/ledgerUtils';

type ClientOptions = contract.ClientOptions;

/**
 * Service for interacting with the ZKnight game contract
 */
export class ZknightService {
  private baseClient: ZknightClient;
  private contractId: string;

  constructor(contractId: string) {
    this.contractId = contractId;
    // Base client for read-only operations
    this.baseClient = new ZknightClient({
      contractId: this.contractId,
      networkPassphrase: NETWORK_PASSPHRASE,
      rpcUrl: RPC_URL,
    });
  }

  /**
   * Create a client with signing capabilities
   */
  private createSigningClient(
    publicKey: string,
    signer: Pick<contract.ClientOptions, 'signTransaction' | 'signAuthEntry'>
  ): ZknightClient {
    const options: ClientOptions = {
      contractId: this.contractId,
      networkPassphrase: NETWORK_PASSPHRASE,
      rpcUrl: RPC_URL,
      publicKey,
      ...signer,
    };
    return new ZknightClient(options);
  }

  // ====================================
  // Read-Only Methods
  // ====================================

  /**
   * Get game state
   * Returns null if game doesn't exist (instead of throwing)
   */
  async getGame(gameId: number): Promise<Game | null> {
    try {
      const tx = await this.baseClient.get_game({ game_id: gameId });
      const result = await tx.simulate();

      // Check if result is Ok before unwrapping
      if (result.result.isOk()) {
        return result.result.unwrap();
      } else {
        // Game doesn't exist or contract returned error
        console.log('[getGame] Game not found for ID:', gameId);
        return null;
      }
    } catch (err) {
      // Simulation or contract call failed
      console.log('[getGame] Error querying game:', err);
      return null;
    }
  }

  /**
   * Get all open games (waiting for player 2)
   * Returns full Game objects (not just IDs)
   */
  async getOpenGames(): Promise<Game[]> {
    try {
      const tx = await this.baseClient.get_open_games();
      const result = await tx.simulate();
      return result.result || [];
    } catch (err) {
      console.log('[getOpenGames] Error querying open games:', err);
      return [];
    }
  }

  /**
   * Get the active WaitingForPlayer game ID for a player (if any)
   * Returns null if player has no active game or their game is already Active/Committing/Finished
   */
  async getPlayerActiveGame(player: string): Promise<number | null> {
    try {
      const tx = await this.baseClient.get_player_active_game({ player });
      const result = await tx.simulate();
      // Option<u32> is returned as {value: number} or undefined
      if (result.result && typeof result.result === 'object' && 'value' in result.result) {
        return (result.result as any).value as number;
      }
      return result.result || null;
    } catch (err) {
      console.log('[getPlayerActiveGame] Error querying player active game:', err);
      return null;
    }
  }

  /**
   * Get the winner of a game (if finished)
   */
  async getGameResult(gameId: number): Promise<string | null> {
    try {
      const tx = await this.baseClient.get_game_result({ game_id: gameId });
      const result = await tx.simulate();
      // Option<Address> is returned as {value: string} or undefined
      if (result.result && typeof result.result === 'object' && 'value' in result.result) {
        return (result.result as any).value as string;
      }
      return result.result || null;
    } catch (err) {
      console.log('[getGameResult] Error querying game result:', err);
      return null;
    }
  }

  /**
   * Get a puzzle by ID
   */
  async getPuzzle(puzzleId: number): Promise<Puzzle | null> {
    try {
      const tx = await this.baseClient.get_puzzle({ puzzle_id: puzzleId });
      const result = await tx.simulate();

      if (result.result.isOk()) {
        return result.result.unwrap();
      } else {
        console.log('[getPuzzle] Puzzle not found for ID:', puzzleId);
        return null;
      }
    } catch (err) {
      console.log('[getPuzzle] Error querying puzzle:', err);
      return null;
    }
  }

  /**
   * Get the total number of puzzles
   */
  async getPuzzleCount(): Promise<number> {
    try {
      const tx = await this.baseClient.get_puzzle_count();
      const result = await tx.simulate();
      return result.result || 0;
    } catch (err) {
      console.log('[getPuzzleCount] Error querying puzzle count:', err);
      return 0;
    }
  }

  // ====================================
  // Game Lifecycle Methods
  // ====================================

  /**
   * Create a new game (waiting for player 2)
   * Returns the new game ID
   */
  async createGame(
    player1: string,
    signer: Pick<contract.ClientOptions, 'signTransaction' | 'signAuthEntry'>,
    authTtlMinutes?: number
  ): Promise<number> {
    const client = this.createSigningClient(player1, signer);
    const tx = await client.create_game({ player1 }, DEFAULT_METHOD_OPTIONS);

    const validUntilLedgerSeq = authTtlMinutes
      ? await calculateValidUntilLedger(RPC_URL, authTtlMinutes)
      : await calculateValidUntilLedger(RPC_URL, DEFAULT_AUTH_TTL_MINUTES);

    try {
      const sentTx = await signAndSendViaLaunchtube(
        tx,
        DEFAULT_METHOD_OPTIONS.timeoutInSeconds,
        validUntilLedgerSeq
      );

      if (sentTx.getTransactionResponse?.status === 'FAILED') {
        const errorMessage = this.extractErrorFromResponse(sentTx.getTransactionResponse);
        throw new Error(`Failed to create game: ${errorMessage}`);
      }

      // Unwrap the Result wrapper (returns {value: number} instead of number)
      const gameId = sentTx.result;
      if (gameId && typeof gameId === 'object' && 'value' in gameId) {
        return (gameId as any).value as number;
      }
      return gameId;
    } catch (err) {
      if (err instanceof Error && err.message.includes('AlreadyHasActiveGame')) {
        throw new Error('You already have an active game. Cancel it or wait for it to finish.');
      }
      throw err;
    }
  }

  /**
   * Cancel a game (only while waiting for player 2)
   */
  async cancelGame(
    gameId: number,
    player1: string,
    signer: Pick<contract.ClientOptions, 'signTransaction' | 'signAuthEntry'>,
    authTtlMinutes?: number
  ): Promise<void> {
    const client = this.createSigningClient(player1, signer);
    const tx = await client.cancel_game({ game_id: gameId, player1 }, DEFAULT_METHOD_OPTIONS);

    const validUntilLedgerSeq = authTtlMinutes
      ? await calculateValidUntilLedger(RPC_URL, authTtlMinutes)
      : await calculateValidUntilLedger(RPC_URL, DEFAULT_AUTH_TTL_MINUTES);

    try {
      const sentTx = await signAndSendViaLaunchtube(
        tx,
        DEFAULT_METHOD_OPTIONS.timeoutInSeconds,
        validUntilLedgerSeq
      );

      if (sentTx.getTransactionResponse?.status === 'FAILED') {
        const errorMessage = this.extractErrorFromResponse(sentTx.getTransactionResponse);
        throw new Error(`Failed to cancel game: ${errorMessage}`);
      }
    } catch (err) {
      console.error('[cancelGame] Error canceling game:', err);
      throw err;
    }
  }

  /**
   * Check and auto-expire a game if it's >1 hour old
   * IMPORTANT: Call this BEFORE joinGame()
   * Returns true if game was expired, false otherwise
   */
  async checkAndExpireGame(
    gameId: number,
    caller: string,
    signer: Pick<contract.ClientOptions, 'signTransaction' | 'signAuthEntry'>,
    authTtlMinutes?: number
  ): Promise<boolean> {
    const client = this.createSigningClient(caller, signer);
    const tx = await client.check_and_expire_game({ game_id: gameId }, DEFAULT_METHOD_OPTIONS);

    const validUntilLedgerSeq = authTtlMinutes
      ? await calculateValidUntilLedger(RPC_URL, authTtlMinutes)
      : await calculateValidUntilLedger(RPC_URL, DEFAULT_AUTH_TTL_MINUTES);

    try {
      const sentTx = await signAndSendViaLaunchtube(
        tx,
        DEFAULT_METHOD_OPTIONS.timeoutInSeconds,
        validUntilLedgerSeq
      );

      if (sentTx.getTransactionResponse?.status === 'FAILED') {
        // If it fails, game probably doesn't exist or isn't expired
        return false;
      }

      // Unwrap the Result wrapper for boolean values
      const result = sentTx.result;
      if (result && typeof result === 'object' && 'value' in result) {
        return (result as any).value as boolean;
      }
      return result || false;
    } catch (err) {
      console.log('[checkAndExpireGame] Error checking expiry:', err);
      return false;
    }
  }

  /**
   * Join a game as player 2
   * Returns the selected Puzzle for immediate rendering
   *
   * This method:
   * 1. Simulates join_game first to check if it would succeed
   * 2. If simulation fails with GameExpired, calls checkAndExpireGame to clean up
   * 3. If simulation succeeds, submits the join_game transaction
   */
  async joinGame(
    gameId: number,
    player2: string,
    signer: Pick<contract.ClientOptions, 'signTransaction' | 'signAuthEntry'>,
    authTtlMinutes?: number
  ): Promise<Puzzle> {
    const client = this.createSigningClient(player2, signer);
    const tx = await client.join_game({ game_id: gameId, player2 }, DEFAULT_METHOD_OPTIONS);

    // Step 1: Simulate first to check if join would succeed
    try {
      await tx.simulate();
    } catch (simulationErr: any) {
      // If simulation fails with GameExpired, clean up the game on-chain
      if (simulationErr?.message?.includes('GameExpired')) {
        console.log('[joinGame] Game is expired, cleaning up...');
        try {
          await this.checkAndExpireGame(gameId, player2, signer, authTtlMinutes);
        } catch (expireErr) {
          console.log('[joinGame] Error expiring game:', expireErr);
        }
        throw new Error('This game has expired (created over 1 hour ago)');
      }

      // Handle other simulation errors
      if (simulationErr?.message?.includes('AlreadyHasActiveGame')) {
        throw new Error('You already have an active game. Finish or cancel it before joining another.');
      }
      if (simulationErr?.message?.includes('GameNotWaiting')) {
        throw new Error('This game is no longer available');
      }
      if (simulationErr?.message?.includes('CannotPlayYourself')) {
        throw new Error('Cannot play against yourself');
      }

      // Re-throw unknown simulation errors
      throw simulationErr;
    }

    // Step 2: Simulation succeeded, now submit the transaction
    const validUntilLedgerSeq = authTtlMinutes
      ? await calculateValidUntilLedger(RPC_URL, authTtlMinutes)
      : await calculateValidUntilLedger(RPC_URL, DEFAULT_AUTH_TTL_MINUTES);

    try {
      const sentTx = await signAndSendViaLaunchtube(
        tx,
        DEFAULT_METHOD_OPTIONS.timeoutInSeconds,
        validUntilLedgerSeq
      );

      if (sentTx.getTransactionResponse?.status === 'FAILED') {
        const errorMessage = this.extractErrorFromResponse(sentTx.getTransactionResponse);
        throw new Error(`Failed to join game: ${errorMessage}`);
      }

      return sentTx.result;
    } catch (err) {
      console.error('[joinGame] Error submitting transaction:', err);
      throw err;
    }
  }

  // ====================================
  // Commit/Reveal Methods
  // ====================================

  /**
   * Commit a solution (SHA-256 hash of preimage)
   * Call this immediately upon solving the puzzle, before generating the ZK proof
   */
  async commitSolve(
    gameId: number,
    player: string,
    commitment: Uint8Array,
    signer: Pick<contract.ClientOptions, 'signTransaction' | 'signAuthEntry'>,
    authTtlMinutes?: number
  ): Promise<void> {
    const client = this.createSigningClient(player, signer);
    const tx = await client.commit_solve(
      {
        game_id: gameId,
        player,
        commitment: Buffer.from(commitment)
      },
      DEFAULT_METHOD_OPTIONS
    );

    const validUntilLedgerSeq = authTtlMinutes
      ? await calculateValidUntilLedger(RPC_URL, authTtlMinutes)
      : await calculateValidUntilLedger(RPC_URL, DEFAULT_AUTH_TTL_MINUTES);

    try {
      const sentTx = await signAndSendViaLaunchtube(
        tx,
        DEFAULT_METHOD_OPTIONS.timeoutInSeconds,
        validUntilLedgerSeq
      );

      if (sentTx.getTransactionResponse?.status === 'FAILED') {
        const errorMessage = this.extractErrorFromResponse(sentTx.getTransactionResponse);
        throw new Error(`Failed to commit solution: ${errorMessage}`);
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('AlreadyCommitted')) {
        throw new Error('You have already committed a solution for this game');
      }
      throw err;
    }
  }

  /**
   * Reveal and verify solution with ZK proof
   * This verifies the proof on-chain and determines the winner if both players have revealed
   */
  async revealSolve(
    gameId: number,
    player: string,
    preimage: Uint8Array,
    proof: Uint8Array,
    tickCount: number,
    signer: Pick<contract.ClientOptions, 'signTransaction' | 'signAuthEntry'>,
    authTtlMinutes?: number
  ): Promise<void> {
    const client = this.createSigningClient(player, signer);
    const tx = await client.reveal_solve(
      {
        game_id: gameId,
        player,
        preimage: Buffer.from(preimage),
        proof: Buffer.from(proof),
        tick_count: tickCount,
      },
      DEFAULT_METHOD_OPTIONS
    );

    const validUntilLedgerSeq = authTtlMinutes
      ? await calculateValidUntilLedger(RPC_URL, authTtlMinutes)
      : await calculateValidUntilLedger(RPC_URL, DEFAULT_AUTH_TTL_MINUTES);

    try {
      const sentTx = await signAndSendViaLaunchtube(
        tx,
        DEFAULT_METHOD_OPTIONS.timeoutInSeconds,
        validUntilLedgerSeq
      );

      if (sentTx.getTransactionResponse?.status === 'FAILED') {
        const errorMessage = this.extractErrorFromResponse(sentTx.getTransactionResponse);
        throw new Error(`Failed to reveal solution: ${errorMessage}`);
      }
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('BadPreimage')) {
          throw new Error('Preimage does not match commitment');
        }
        if (err.message.includes('InvalidProof')) {
          throw new Error('ZK proof verification failed');
        }
        if (err.message.includes('NoCommitment')) {
          throw new Error('You must commit a solution before revealing');
        }
      }
      throw err;
    }
  }

  /**
   * Claim a timeout win (10-minute default win if opponent doesn't reveal)
   */
  async claimTimeoutWin(
    gameId: number,
    claimer: string,
    signer: Pick<contract.ClientOptions, 'signTransaction' | 'signAuthEntry'>,
    authTtlMinutes?: number
  ): Promise<void> {
    const client = this.createSigningClient(claimer, signer);
    const tx = await client.claim_timeout_win(
      { game_id: gameId, claimer },
      DEFAULT_METHOD_OPTIONS
    );

    const validUntilLedgerSeq = authTtlMinutes
      ? await calculateValidUntilLedger(RPC_URL, authTtlMinutes)
      : await calculateValidUntilLedger(RPC_URL, DEFAULT_AUTH_TTL_MINUTES);

    try {
      const sentTx = await signAndSendViaLaunchtube(
        tx,
        DEFAULT_METHOD_OPTIONS.timeoutInSeconds,
        validUntilLedgerSeq
      );

      if (sentTx.getTransactionResponse?.status === 'FAILED') {
        const errorMessage = this.extractErrorFromResponse(sentTx.getTransactionResponse);
        throw new Error(`Failed to claim timeout win: ${errorMessage}`);
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('TooEarly')) {
        throw new Error('Cannot claim timeout yet - must wait 10 minutes after opponent commits');
      }
      throw err;
    }
  }

  // ====================================
  // Error Handling
  // ====================================

  /**
   * Extract human-readable error message from transaction response
   */
  private extractErrorFromResponse(transactionResponse: any): string {
    try {
      // Check for result_xdr error info
      if (transactionResponse?.result_xdr) {
        console.error('[ZknightService] Result XDR:', transactionResponse.result_xdr);
      }

      // Check for diagnostic events
      const diagnosticEvents = transactionResponse?.diagnosticEventsXdr ||
                              transactionResponse?.diagnostic_events || [];

      for (const event of diagnosticEvents) {
        if (event?.topics) {
          const topics = Array.isArray(event.topics) ? event.topics : [];
          const hasErrorTopic = topics.some((topic: any) =>
            topic?.symbol === 'error' || topic?.error
          );

          if (hasErrorTopic && event.data) {
            if (typeof event.data === 'string') {
              return event.data;
            }
          }
        }
      }

      // Fallback
      const status = transactionResponse?.status || 'Unknown';
      return `Transaction ${status}. Check console for details.`;
    } catch (err) {
      console.error('[ZknightService] Failed to extract error:', err);
      return 'Transaction failed with unknown error';
    }
  }
}

// Create singleton instance with contract ID from bindings
// Example: const zknightService = new ZknightService(networks.testnet.contractId);
