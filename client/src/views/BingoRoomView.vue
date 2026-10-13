<template>
  <div class="bingo-room bingo-room-terminal" v-if="room">
    <!-- Terminal header -->
    <div class="terminal-header">
      <div class="terminal-header-top">
        <button class="terminal-brand" type="button" @click="goBack">
          <v-icon size="small" class="mr-2">mdi-arrow-left</v-icon>
          <img class="terminal-brand-logo" src="/img/asmat-bingo-logo.png" alt="Asmat Bingo logo" />
          <span>Asmat Bingo</span>
        </button>
        <div class="terminal-header-actions">
          <v-menu location="bottom end" :close-on-content-click="false">
            <template #activator="{ props }">
              <button v-bind="props" class="terminal-icon-btn" type="button" aria-label="Language settings"
                title="Language settings">
                <v-icon size="small">mdi-eye</v-icon>
              </button>
            </template>
            <v-card class="terminal-menu-card">
              <v-card-title class="text-subtitle-2">Language</v-card-title>
              <v-card-text>
                <LanguageSelector @language-changed="handleLanguageChange" />
              </v-card-text>
            </v-card>
          </v-menu>
          <button v-if="gameStatus === 'idle' && canManageRoom" class="terminal-icon-btn" type="button"
            aria-label="Game and fee settings" title="Game and fee settings" :aria-expanded="showPatternSettings"
            @click="showPatternSettings = !showPatternSettings">
            <v-icon size="small">mdi-cart</v-icon>
          </button>
          <v-menu v-if="canManageRoom" location="bottom end" :close-on-content-click="false">
            <template #activator="{ props }">
              <button v-bind="props" class="terminal-user-menu-btn" type="button"
                aria-label="User and house fee settings" title="User and house fee settings">
                <v-avatar color="primary" size="24" class="mx-1">
                  <span class="text-caption text-white">{{ user?.username?.charAt(0).toUpperCase() || '?' }}</span>
                </v-avatar>
                <span class="terminal-user-name">{{ user?.username || 'Loading...' }}</span>
              </button>
            </template>
            <v-card class="terminal-menu-card terminal-fee-menu-card">
              <v-card-title class="text-subtitle-2">House Fee / Commission</v-card-title>
              <v-card-text>
                <v-select v-model="houseFee" :items="houseFeeOptions" item-title="title" item-value="value"
                  label="Commission per card (%)" prepend-inner-icon="mdi-percent" density="compact" variant="outlined"
                  hide-details />
              </v-card-text>
            </v-card>
          </v-menu>
          <template v-else>
            <v-avatar color="primary" size="24" class="mx-1">
              <span class="text-caption text-white">{{ user?.username?.charAt(0).toUpperCase() || '?' }}</span>
            </v-avatar>
            <span class="terminal-user-name">{{ user?.username || 'Loading...' }}</span>
          </template>
          <button class="terminal-icon-btn" type="button" aria-label="Logout" title="Logout" @click="confirmLogout">
            <v-icon size="small">mdi-logout</v-icon>
          </button>
        </div>
      </div>
      <div class="terminal-color-bar">
        <div class="bar-tab tab-black"><span class="tab-label">Black</span></div>
        <div class="bar-tab tab-blue"><span class="tab-label">Blue</span></div>
        <div class="bar-tab tab-green"><span class="tab-label">Green</span></div>
        <div class="bar-tab tab-yellow"><span class="tab-label">Yellow</span></div>
      </div>
    </div>

    <v-expand-transition>
      <section v-if="gameStatus === 'idle' && canManageRoom && showPatternSettings" class="pattern-settings-panel"
        aria-label="Game pattern settings">
        <div class="pattern-settings-inner">
          <div class="pattern-settings-heading">
            <div>
              <div class="pattern-settings-title">Game Pattern</div>
              <div class="pattern-settings-subtitle">Choose the winning pattern before starting the game.</div>
            </div>
            <button type="button" class="pattern-settings-close" aria-label="Close game pattern settings"
              @click="showPatternSettings = false">
              <v-icon size="small">mdi-close</v-icon>
            </button>
          </div>
          <div class="pattern-settings-controls">
            <v-select v-model="currentPattern" :items="patterns" label="Pattern" density="compact" variant="outlined"
              hide-details />
            <v-btn variant="outlined" color="primary" @click="showPatternPreview = !showPatternPreview">
              <v-icon class="mr-1">{{ showPatternPreview ? 'mdi-eye-off' : 'mdi-eye' }}</v-icon>
              {{ showPatternPreview ? 'Hide' : 'Show' }} Preview
            </v-btn>
          </div>
          <div v-if="showPatternPreview" class="header-pattern-preview">
            <div class="pattern-preview-description">{{ getPatternTitle(currentPattern) }}</div>
            <div class="pattern-card-header">
              <div class="pattern-header-letter letter-b">B</div>
              <div class="pattern-header-letter letter-i">I</div>
              <div class="pattern-header-letter letter-n">N</div>
              <div class="pattern-header-letter letter-g">G</div>
              <div class="pattern-header-letter letter-o">O</div>
            </div>
            <table class="pattern-grid">
              <tbody>
                <tr v-for="row in 5" :key="row">
                  <td v-for="col in 5" :key="col" class="pattern-cell"
                    :class="{ 'pattern-active': isPreviewPatternCell(row - 1, col - 1, currentPattern), 'pattern-free': row === 3 && col === 3 }">
                    <span v-if="row === 3 && col === 3">FREE</span>
                    <span v-else>{{ getStaticCardNumber(row - 1, col - 1) }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </v-expand-transition>

    <!-- New-game terminal -->
    <div v-if="gameStatus === 'idle'" class="terminal-content">
      <div class="terminal-info-grid">
        <div class="info-box text-center">
          <div class="info-label">BET AMOUNT</div>
          <div class="bet-control-wrap">
            <button class="bet-btn" type="button" aria-label="Decrease bet"
              @click="betAmount = Math.max(1, betAmount - 1)">-</button>
            <input v-model.number="betAmount" type="number" min="1" step="0.5" inputmode="decimal"
              aria-label="Bet amount" class="bet-input-field"
              @change="betAmount = Math.max(1, Number(betAmount) || 1)" />
            <button class="bet-btn" type="button" aria-label="Increase bet" @click="betAmount++">+</button>
          </div>
        </div>

        <div class="info-box text-center">
          <div class="info-label">GAME NUMBER</div>
          <div class="game-number-val">{{ room.currentMatch?.id || '0' }}</div>

        </div>

        <div class="info-box wallet-box wallet-status-banner text-center">
          <div class="wallet-status-banner">WALLET STATUS<br> Excellent</div>

        </div>
      </div>

      <div class="card-grid-container">
        <div class="cards-flex-wrap">
          <button v-for="cardNum in cardNumbers" :key="cardNum" type="button" class="terminal-card-tile"
            :class="{ 'tile-selected': isCardRegistered(cardNum) }" :aria-pressed="isCardRegistered(cardNum)"
            @click="toggleCardRegistration(cardNum)">
            {{ cardNum }}
          </button>
        </div>
        <div v-if="!cardNumbers.length" class="card-catalog-empty">
          No cards are available for this room.
        </div>
      </div>

      <div v-if="cardNumbers.length" class="card-range-summary">
        <span class="range-badge">
          1-{{ cardNumbers[cardNumbers.length - 1] }}
        </span>
      </div>

      <!-- <div class="registered-cards-summary" aria-live="polite">
        {{ registeredCards.length }} card{{ registeredCards.length === 1 ? '' : 's' }} registered
      </div> -->

      <button type="button" class="terminal-start-btn" :disabled="registeredCards.length === 0" @click="startNewGame">
        Start Game
      </button>

    </div>

    <v-row v-else>
      <v-col cols="12" lg="3" md="4" class="left-panel">
        <v-card class="mb-4 info-card">
          <v-card-title class="info-card-title text-center">
            <h2>75-Ball Bingo</h2>
          </v-card-title>

          <v-card-text class="text-center">
            <div class="current-ball">
              <div class="ball-display" :class="getBallColor(lastCalledNumber)">
                {{ lastCalledNumber || '-' }}
              </div>
              <div class="ball-letter">{{ getBallLetter(lastCalledNumber) }}</div>
            </div>

            <h3 class="mt-4">Numbers Called: {{ calledNumbers.length }}/75</h3>

            <div class="recent-numbers mt-4">
              <div v-for="num in calledNumbers.slice(-5).reverse()" :key="num" class="recent-ball"
                :class="getBallColor(num)">
                {{ num }}
              </div>
            </div>

            <!-- Pattern Selection -->
            <v-select v-model="currentPattern" :items="patterns" label="Current Pattern" class="mt-4"
              v-if="canManageRoom" disabled></v-select>

            <v-chip class="mt-2" color="info" v-else>
              Pattern: {{ currentPattern }}
            </v-chip>

            <!-- Pattern Preview Toggle Button -->
            <v-btn v-if="canManageRoom" @click="showPatternPreview = !showPatternPreview" variant="outlined"
              size="small" class="mt-2" block color="primary">
              <v-icon class="mr-1">{{ showPatternPreview ? 'mdi-eye-off' : 'mdi-eye' }}</v-icon>
              {{ showPatternPreview ? 'Hide' : 'Show' }} Pattern Preview
            </v-btn>

            <!-- Pattern Preview (for managers) -->
            <v-expand-transition>
              <div class="pattern-preview mt-4" v-if="canManageRoom && showPatternPreview">
                <p class="text-center text-caption mb-2" style="color: #aaa; font-weight: 500;">
                  <span v-if="currentPattern === 'horizontal'">✓ Any complete horizontal row wins</span>
                  <span v-else-if="currentPattern === 'vertical'">✓ Any complete vertical column wins</span>
                  <span v-else-if="currentPattern === 'diagonal'">✓ Complete either diagonal (\ or /) wins</span>
                  <span v-else-if="currentPattern === 'x'">✓ Complete BOTH diagonals (X shape) wins</span>
                  <span v-else-if="currentPattern === 'corners'">✓ All four corner cells win</span>
                  <span v-else-if="currentPattern === 't'">✓ Top row + middle column (T shape) wins</span>
                  <span v-else-if="currentPattern === 'l'">✓ Left column + bottom row (L shape) wins</span>
                  <span v-else-if="currentPattern === 'fullhouse'">✓ All 25 cells must be marked</span>
                  <span v-else>Match the highlighted pattern to win</span>
                </p>

                <!-- B-I-N-G-O Header -->
                <div class="pattern-card-header">
                  <div class="pattern-header-letter letter-b">B</div>
                  <div class="pattern-header-letter letter-i">I</div>
                  <div class="pattern-header-letter letter-n">N</div>
                  <div class="pattern-header-letter letter-g">G</div>
                  <div class="pattern-header-letter letter-o">O</div>
                </div>

                <!-- 5x5 Grid with Numbers -->
                <table class="pattern-grid">
                  <tbody>
                    <tr v-for="row in 5" :key="row">
                      <td v-for="col in 5" :key="col" class="pattern-cell" :class="{
                        'pattern-active': isPreviewPatternCell(row - 1, col - 1, currentPattern),
                        'pattern-free': row === 3 && col === 3
                      }">
                        <span v-if="row === 3 && col === 3">FREE</span>
                        <span v-else>{{ getStaticCardNumber(row - 1, col - 1) }}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </v-expand-transition>
          </v-card-text>
        </v-card>

        <!-- Language and Volume Controls -->
        <v-card class="mb-4 sidebar-card voice-card">
          <v-card-title class="text-subtitle-1 bg-primary">
            <v-icon class="mr-2">mdi-volume-high</v-icon>
            Voice Settings
          </v-card-title>
          <v-card-text class="pa-3">
            <LanguageSelector @language-changed="handleLanguageChange" class="mb-3" />
            <VolumeControl @volume-changed="handleVolumeChange" />
          </v-card-text>
        </v-card>

        <!-- Betting Configuration Modal -->
        <v-dialog v-model="showBettingModal" max-width="500">
          <v-card class="betting-modal-card">
            <v-card-title class="betting-modal-title">
              <v-icon class="mr-2">mdi-currency-usd</v-icon>
              Betting Configuration
            </v-card-title>

            <v-card-text class="pa-6">
              <v-text-field v-model.number="betAmount" label="Bet Amount per Card (Birr)" type="number"
                variant="outlined" prepend-inner-icon="mdi-currency-usd" min="0" hint="Amount each player pays per card"
                persistent-hint class="mb-4 betting-input"></v-text-field>

              <v-select v-model="houseFee" :items="houseFeeOptions" item-title="title" item-value="value"
                label="House Fee per Card (%)" prepend-inner-icon="mdi-percent" variant="outlined"
                hint="Choose a commission from 20% to 100%" persistent-hint class="betting-input"></v-select>

              <v-alert type="info" density="compact" class="mt-4">
                <strong>Current Settings:</strong><br>
                Bet: {{ betAmount }} Birr | Commission: {{ houseFee }}%
              </v-alert>
            </v-card-text>

            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="grey" variant="text" @click="showBettingModal = false">
                Cancel
              </v-btn>
              <v-btn color="primary" variant="elevated" @click="saveBettingSettings">
                <v-icon class="mr-1">mdi-check</v-icon>
                Save
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

      </v-col>

      <!-- Center Panel: Card Selection & Calling History -->
      <v-col cols="12" lg="9" md="8" class="right-panel">
        <!-- Floating Game Ended Button (when all numbers called) -->
        <div v-if="canManageRoom && calledNumbers.length >= 75" class="floating-pause-container">
          <v-card class="floating-pause-card floating-end-card" elevation="8">
            <v-card-text class="pa-4">
              <v-row align="center" no-gutters>
                <v-col class="grow">
                  <div class="pause-alert-text">
                    <v-icon color="error" size="large" class="mr-2">mdi-check-circle</v-icon>
                    <span><strong>Game Ended!</strong> All 75 numbers called. Start a new game?</span>
                  </div>
                </v-col>
                <v-col class="shrink ml-4">
                  <v-btn color="error" variant="elevated" @click="resetGame" size="large">
                    <v-icon class="mr-2">mdi-refresh</v-icon>
                    New Game
                  </v-btn>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </div>
        <!-- Card Details Modal -->
        <v-dialog v-model="showCardDetailsModal" max-width="500">
          <v-card class="card-details-card">
            <v-card-text class="pa-4">
              <div class="card-detail-display">
                <div class="bingo-card-header">
                  <div class="card-letter">B</div>
                  <div class="card-letter">I</div>
                  <div class="card-letter">N</div>
                  <div class="card-letter">G</div>
                  <div class="card-letter">O</div>
                </div>
                <table class="detail-bingo-card">
                  <tbody>
                    <tr v-for="row in 5" :key="row">
                      <td v-for="col in 5" :key="col" class="detail-card-cell" :class="{
                        'free-space': row === 3 && col === 3,
                        'called-marked': isCardCellCalled(row - 1, col - 1),
                        'winning-marked': isWinningPatternCell(row - 1, col - 1),
                      }">
                        <span v-if="row === 3 && col === 3">FREE</span>
                        <span v-else>{{ getCardCellValue(row - 1, col - 1) }}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div class="card-detail-info mt-3">
                  <strong class="card-detail-number">
                    Card #{{ selectedCardForView }}
                  </strong>
                  <div class="card-detail-close-box">
                    <v-btn class="card-detail-close" icon size="small" variant="text" aria-label="Close card details"
                      @click="
                        showCardDetailsModal = false;
                      selectedCardForView = null;
                      selectedCardGrid = null;
                      ">
                      <v-icon>mdi-close</v-icon>
                    </v-btn>
                  </div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-dialog>

        <!-- TV Bingo Board - Only visible when game is playing or paused -->
        <v-card class="tv-bingo-board mb-4" :class="{ 'tv-bingo-board--shuffling': boardShuffleActive }">
          <!-- Top Grid Section -->
          <div class="tv-board-main">
            <!-- Vertical B-I-N-G-O Header Strip -->
            <div class="tv-bingo-sidebar">
              <div v-for="letter in bingoLetters" :key="letter" class="tv-sidebar-letter">
                {{ letter }}
              </div>
            </div>

            <!-- 5x15 Numbers Matrix -->
            <div class="tv-numbers-grid">
              <div v-for="(letter, rowIndex) in bingoLetters" :key="letter" class="tv-grid-row">
                <div v-for="offset in 15" :key="`${letter}-${offset}`" class="tv-grid-cell" :class="{
                  'tv-cell--called': isNumberCalled(rowIndex * 15 + offset),
                  'tv-cell--latest': lastCalledNumber === (rowIndex * 15 + offset),
                  'tv-grid-cell--shuffling': boardShuffleActive,
                  'tv-grid-cell--shuffle-active': boardShuffleActive && shuffleHighlightedNumbers.has(rowIndex * 15 + offset)
                }">
                  {{ rowIndex * 15 + offset }}
                </div>
              </div>
            </div>
          </div>

          <!-- Multi-Color Progress Divider Line -->
          <div class="tv-color-progress-bar">
            <div class="bar-segment bar-blue"></div>
            <div class="bar-segment bar-green"></div>
            <div class="bar-segment bar-yellow"></div>
          </div>

          <!-- Bottom Control & Dashboard Area -->
          <div class="tv-board-footer">
            <!-- Left: Current Ball Display & Last 5 Calls -->
            <div class="tv-current-ball-container">
              <div class="tv-current-ball-ring">
                <div class="tv-current-ball-inner">
                  <div class="ball-letter-top" v-if="lastCalledNumber">
                    {{ getBallLetter(lastCalledNumber) }}
                  </div>
                  <div class="ball-number-main">
                    {{ lastCalledNumber || '-' }}
                  </div>
                </div>
              </div>
              <div class="tv-last-calls-label">Last 5 Calls</div>
              <div class="tv-recent-balls-row">
                <div v-for="num in calledNumbers.slice(-5).reverse()" :key="num" class="recent-mini-ball"
                  :class="getBallColor(num)">
                  {{ num }}
                </div>
              </div>
            </div>

            <!-- Center: Interactive Controls -->
            <div class="tv-center-controls" v-if="canManageRoom">
              <div class="control-btn-stack">
                <v-btn color="success" variant="flat" size="small" @click="callNextNumber"
                  v-if="gameStatus === 'playing'" :disabled="calledNumbers.length >= 75">
                  Call Next Number
                </v-btn>

                <v-btn :color="gameStatus === 'playing' ? 'grey-lighten-2' : 'success'" variant="flat" size="small"
                  @click="togglePauseResume" :disabled="shuffleWorkflowActive"
                  :aria-label="gameStatus === 'playing' ? 'Pause Game' : 'Resume Game'">
                  <v-icon class="mr-1">{{ gameStatus === 'playing' ? 'mdi-pause' : 'mdi-play' }}</v-icon>
                  {{ gameStatus === 'playing' ? 'Pause Game' : 'Resume Game' }}
                </v-btn>

                <v-btn color="red-darken-1" variant="flat" size="small" class="text-white" @click="toggleAutoCall"
                  :disabled="shuffleWaitActive">
                  {{ autoCallEnabled ? 'Stop Auto' : 'Auto Call' }}
                </v-btn>

                <v-btn color="grey-lighten-2" variant="flat" size="small" @click="resetGame"
                  :disabled="gameStatus === 'playing' && calledNumbers.length < 75">
                  Reset Board
                </v-btn>

                <v-btn color="grey-lighten-2" variant="flat" size="small" @click="openShuffleRing"
                  :disabled="gameStatus !== 'playing' || boardShuffleActive || shuffleWaitActive">
                  Shuffle
                </v-btn>
              </div>
            </div>

            <div class="tv-board-extra-controls" v-if="canManageRoom">
              <div class="tv-speed-control">
                <div class="tv-control-label">Voice Speed</div>
                <v-slider v-model="callingSpeed" :min="1000" :max="6000" :step="500" hide-details density="compact"
                  thumb-label color="primary" @update:model-value="autoCallEnabled && startAutoCall()" />
                <div class="tv-speed-value">{{ (callingSpeed / 1000).toFixed(1) }}s</div>
              </div>
              <div class="tv-verify-control">
                <v-text-field v-model="verifyCardNumber" label="Card number" density="compact" variant="outlined"
                  hide-details prepend-inner-icon="mdi-card-account-details" />
                <v-btn color="success" size="small" :loading="verifying" @click="verifyWin">
                  <v-icon class="mr-1">mdi-check-decagram</v-icon>
                  Verify Win
                </v-btn>
              </div>
            </div>

            <!-- Right: Game Stats Displays -->
            <div class="tv-stats-container">
              <!-- Total Calls Circle -->
              <div class="tv-stat-circle circle-green">
                <div class="stat-value">{{ calledNumbers.length }}</div>
                <div class="stat-label">Total Calls</div>
              </div>

              <!-- Prev Call Circle -->
              <div class="tv-stat-circle circle-orange">
                <div class="stat-value">
                  <span v-if="calledNumbers.length > 1">
                    {{ getBallLetter(calledNumbers[calledNumbers.length - 2]) }}{{ calledNumbers[calledNumbers.length -
                      2] }}
                  </span>
                  <span v-else>-</span>
                </div>
                <div class="stat-label">Prev. Call</div>
              </div>

              <!-- Amount Circle -->
              <div class="tv-stat-circle circle-red-large">
                <div class="stat-label-top">Amount</div>
                <div class="stat-value-large">{{ totalReward }}</div>
              </div>
            </div>
          </div>
        </v-card>

        <!-- Winning Pattern Visualization (when valid win OR late claim) -->
        <v-card class="winning-pattern-card mt-4"
          :class="{ 'late-claim-card': verificationResult && verificationResult.lateClaim }"
          v-if="verificationResult && (verificationResult.isValid || verificationResult.lateClaim)">
          <v-card-title class="winning-title" :class="{ 'late-claim-title': verificationResult.lateClaim }">
            <v-icon class="mr-2">{{ verificationResult.lateClaim ? 'mdi-clock-alert' : 'mdi-trophy' }}</v-icon>
            <span v-if="verificationResult.lateClaim" style="color: #d32f2f;">
              LATE CLAIM - Pattern Completed Earlier
            </span>
            <span v-else-if="verificationResult.patternNames && verificationResult.patternNames.length > 1">
              Winning Patterns ({{ verificationResult.patternNames.length }}): {{
                verificationResult.patternNames.join(', ') }}
            </span>
            <span v-else-if="verificationResult.patternNames && verificationResult.patternNames.length === 1">
              Winning Pattern: {{ verificationResult.patternNames[0] }}
            </span>
            <span v-else>
              Winning Pattern - {{ activePattern.toUpperCase() }}
            </span>
          </v-card-title>
          <v-card-text class="pa-4">
            <v-alert v-if="verificationResult.lateClaim" type="error" variant="tonal" density="compact" class="mb-3">
              <v-icon class="mr-2">mdi-alert-circle</v-icon>
              This pattern was completed earlier. You must call BINGO immediately when you win!
            </v-alert>
            <v-alert v-else-if="verificationResult.patternNames && verificationResult.patternNames.length > 1"
              type="success" variant="tonal" density="compact" class="mb-3">
              <v-icon class="mr-2">mdi-star-circle</v-icon>
              This card matches {{ verificationResult.patternNames.length }} different winning patterns!
            </v-alert>
            <table class="winning-grid">
              <tbody>
                <tr v-for="row in 5" :key="row">
                  <td v-for="col in 5" :key="col" class="winning-cell" :class="{
                    'winning-marked': isWinningPatternCell(row - 1, col - 1),
                    'free-space': row === 3 && col === 3
                  }">
                    {{ row === 3 && col === 3 ? 'FREE' : getWinningCardCellValue(row - 1, col - 1) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </v-card-text>
        </v-card>

        <!-- User Management (Admin Only) -->
        <div v-if="isAdmin && showUserManagement" class="mt-4">
          <UserManagement :room-id="roomId" @cards-assigned="onCardsAssigned" />
        </div>
      </v-col>
    </v-row>

    <v-snackbar v-model="toast.show" :color="toast.color" location="top right" timeout="4500">
      {{ toast.message }}
    </v-snackbar>

    <!-- Logout Confirmation Dialog -->
    <v-dialog v-model="showLogoutDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h5">
          <v-icon class="mr-2" color="warning">mdi-logout</v-icon>
          Confirm Logout
        </v-card-title>
        <v-card-text>
          Are you sure you want to logout? You will leave the current game room.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="showLogoutDialog = false">
            Cancel
          </v-btn>
          <v-btn color="error" variant="elevated" @click="logout">
            <v-icon class="mr-1">mdi-logout</v-icon>
            Logout
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>

  <!-- Loading State -->
  <div v-else class="loading-container">
    <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    <p class="mt-4 text-white">Loading room...</p>
  </div>
</template>

<script setup lang="ts">
/* eslint-disable no-undef */
import { ref, computed, inject, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuth } from '@/store/auth';
import { useSocket } from '@/store/socket';
import { useRoomSocket } from '@/composables/useRoomSocket';
import { Services } from '@/services';
import UserManagement from '@/components/UserManagement.vue';
import LanguageSelector from '@/components/LanguageSelector.vue';
import VolumeControl from '@/components/VolumeControl.vue';
import { getAmharicAudioService } from '@/services/AmharicAudioService';
import type { Room, RoomManager } from '@/types/room';
import type { MatchNumber } from '@/types/match';
import type { VerificationResult } from '@/types/verification';
import { normalizeCardNumber as normalizeRoomCardNumber } from '@/utils/cardNumber';

const route = useRoute();
const router = useRouter();
const auth = useAuth();
const socketStore = useSocket();
const services = inject<Services>('services');

const roomId = computed(() => +route.params.roomId);
const { user } = auth;

const room = ref<Room | null>(null);
const lastCalledNumber = ref<number>(0);
const calledNumbers = ref<number[]>([]);
const gameStatus = ref<'idle' | 'playing' | 'paused'>('idle');
const currentPattern = ref('twoline');
const selectedPatternForMatch = ref('twoline');
const showUserManagement = ref(false);
const showPatternPreview = ref(false); // Collapsed by default
const showPatternSettings = ref(false);
const showLogoutDialog = ref(false);
const verifyCardNumber = ref('');
const verifying = ref(false);
const verificationResult = ref<VerificationResult | null>(null);
const matchWinners = ref<Array<{ cardNumber: string; timestamp: Date; specialWin?: boolean }>>([]); // Track all winners for current match
const registeredCards = ref<number[]>([]); // Array of registered card numbers
const cardCatalog = ref<number[]>([]);
const selectedCardForView = ref<number | null>(null); // Card selected for viewing details
const betAmount = ref(10); // Bet amount per card in Birr
const houseFee = ref(20); // House fee percentage per card
const houseFeeOptions = Array.from({ length: 17 }, (_, index) => {
  const value = 20 + index * 5;
  return { title: `${value}%`, value };
});
const showBettingModal = ref(false); // Show/hide betting configuration modal
const selectedCardGrid = ref<number[][] | null>(null);

// Calling speed control
const callingSpeed = ref(3000); // Default 3 seconds
const canManageRoomByApi = ref(false);
const showCardDetailsModal = ref(false);
const shuffleHighlightedNumbers = ref<Set<number>>(new Set());
const boardShuffleActive = ref(false);
const shuffleWaitActive = ref(false);
let shuffleBoardInterval: number | null = null;
let shuffleWaitTimeout: number | null = null;
let shuffleHighlightQueue: number[] = [];
const toast = ref<{ show: boolean; message: string; color: string }>({
  show: false,
  message: '',
  color: 'info',
});

// Auto-call functionality
const autoCallEnabled = ref(false);
let autoCallTimer: number | null = null;
let initialCallTimeout: number | null = null;

const SHUFFLE_DURATION_MS = 20000;
const SHUFFLE_WAIT_MS = 5000;

const shuffleWorkflowActive = computed(
  () => boardShuffleActive.value || shuffleWaitActive.value,
);

// Language and audio support
const currentLanguage = ref(localStorage.getItem('voiceLanguage') || 'am');
const amharicAudio = getAmharicAudioService();

const patterns = [
  { title: 'Two Lines (Horizontal, Vertical, or Diagonal)', value: 'twoline' },
  { title: 'Three Lines (Horizontal, Vertical, or Diagonal)', value: 'threeline' },
  { title: 'Any Line (Horizontal, Vertical, or Diagonal)', value: 'anyline' },
  { title: 'Horizontal Line (Any Row)', value: 'horizontal' },
  { title: 'Vertical Line (Any Column)', value: 'vertical' },
  { title: 'Diagonal (Either Direction)', value: 'diagonal' },
  { title: 'Four Corners', value: 'corners' },
  { title: 'X Pattern (Both Diagonals)', value: 'x' },
  { title: 'T Pattern', value: 't' },
  { title: 'L Pattern', value: 'l' },
  { title: 'Full House (All Cells)', value: 'fullhouse' },
];

const bingoLetters = ['B', 'I', 'N', 'G', 'O'];

const canManageRoom = computed(() => {
  if (canManageRoomByApi.value) return true;
  if (!room.value || !user) return false;

  // Admin can manage any room
  if (user.role === 'admin') return true;

  // Owner can manage their room
  if (room.value.owner?.id === user.id) return true;

  // Check if user is assigned as manager
  if (room.value.managers) {
    return room.value.managers.some(
      (m: RoomManager) => m.user?.id === user.id,
    );
  }

  return false;
});

const isAdmin = computed(() => {
  return user?.role === 'admin';
});

const activePattern = computed(() =>
  gameStatus.value === 'idle' ? currentPattern.value : selectedPatternForMatch.value,
);

const totalReward = computed(() => {
  const totalBet = registeredCards.value.length * betAmount.value;
  const totalFee = totalBet * (houseFee.value / 100);
  return Math.max(0, totalBet - totalFee);
});

const cardNumbers = computed(() => {
  const displayLimit = room.value?.cardDisplayLimit || 400;
  return cardCatalog.value.filter((cardNumber) => cardNumber <= displayLimit);
});

const getBallLetter = (num: number): string => {
  if (!num) return '';
  if (num <= 15) return 'B';
  if (num <= 30) return 'I';
  if (num <= 45) return 'N';
  if (num <= 60) return 'G';
  return 'O';
};

const getBallColor = (num: number): string => {
  if (!num) return '';
  if (num <= 15) return 'ball-b';
  if (num <= 30) return 'ball-i';
  if (num <= 45) return 'ball-n';
  if (num <= 60) return 'ball-g';
  return 'ball-o';
};

const calledNumbersSet = computed(() => new Set(calledNumbers.value));

const isNumberCalled = (num: number): boolean => calledNumbersSet.value.has(num);

const getStaticCardNumber = (row: number, col: number): number => {
  // Generate a static sample card for display
  const colStart = col * 15 + 1;
  // Generate a consistent number for this cell
  const seed = row * 5 + col;
  return colStart + (seed * 3) % 15;
};

const getCardCellValue = (row: number, col: number): string | number => {
  if (!selectedCardGrid.value || !selectedCardGrid.value[row]) {
    return '-';
  }
  return selectedCardGrid.value[row][col] ?? '-';
};
const isCardCellCalled = (row: number, col: number): boolean => {
  const value = selectedCardGrid.value?.[row]?.[col];
  return typeof value === 'number' && value > 0 && isNumberCalled(value);
};
const getWinningCardCellValue = (row: number, col: number): string | number => {
  if (!selectedCardGrid.value || !selectedCardGrid.value[row]) {
    return row === 2 && col === 2 ? 'FREE' : '';
  }
  const value = selectedCardGrid.value[row][col];
  return value === 0 ? 'FREE' : value;
};

const showToast = (message: string, color = 'info') => {
  toast.value = {
    show: true,
    message,
    color,
  };
};

const speakMessage = async (message: string) => {
  console.log(`[Audio Debug] speakMessage called with: "${message}", language: ${currentLanguage.value}`);

  if (currentLanguage.value === 'am') {
    // Use Amharic audio for specific messages
    const eventMap: Record<string, string> = {
      'Congratulations': 'congratulations',
      'Card not registered': 'card-not-registered',
      'Invalid claim': 'card-locked',
      'Late claim rejected': 'winner-invalid',
      'must call BINGO immediately': 'winner-invalid',
      'Starting new game': 'game-start',
      'Game paused': 'game-paused',
      'Game resumed': 'game-resumed',
      'Card locked': 'card-locked',
      'locked due to': 'card-locked',
      'card is now locked': 'card-locked',
      'Invalid': 'winner-invalid',
    };

    // Find matching event
    const eventKey = Object.keys(eventMap).find(key => message.includes(key));
    if (eventKey) {
      console.log(`[Audio Debug] ✅ Playing Amharic event: ${eventMap[eventKey]} for message: "${message}"`);
      try {
        await amharicAudio.playEvent(eventMap[eventKey]);
        console.log(`[Audio Debug] ✅ Successfully played: ${eventMap[eventKey]}`);
      } catch (error) {
        console.error(`[Audio Debug] ❌ Error playing event: ${eventMap[eventKey]}`, error);
      }
      return;
    }

    // If no specific match, try to determine event type
    if (message.toLowerCase().includes('congratulations') || message.toLowerCase().includes('wins')) {
      console.log(`[Audio Debug] ✅ Playing Amharic congratulations for: "${message}"`);
      await amharicAudio.playEvent('congratulations');
      return;
    }
    if (message.toLowerCase().includes('invalid') || message.toLowerCase().includes('locked') || message.toLowerCase().includes('rejected')) {
      console.log(`[Audio Debug] ✅ Playing Amharic invalid for: "${message}"`);
      await amharicAudio.playEvent('winner-invalid');
      return;
    }

    console.log(`[Audio Debug] ⚠️ No Amharic mapping found for message: "${message}"`);
  }

  // Fallback to English Web Speech API
  try {
    console.log(`[Audio Debug] Using English Web Speech API for: "${message}"`);
    window.speechSynthesis.cancel();
    const voiceMessage = new SpeechSynthesisUtterance(message);
    voiceMessage.lang = 'en-US';
    voiceMessage.rate = 1;
    voiceMessage.pitch = 1;
    window.speechSynthesis.speak(voiceMessage);
  } catch (error) {
    console.error('[Audio Debug] ❌ Speech synthesis error:', error);
  }
};

const announceNumber = async (letter: string, number: number) => {
  console.log(`[Audio Debug] announceNumber called: ${letter}-${number}, language: ${currentLanguage.value}`);

  // REMOVED: Special milestone announcements (10/75, 25/75, etc.)
  // These count announcements have been removed per user request

  if (currentLanguage.value === 'am') {
    try {
      console.log(`[Audio Debug] ✅ Playing Amharic number: ${letter}-${number}`);
      await amharicAudio.playNumber(letter, number);
      console.log(`[Audio Debug] ✅ Successfully played number: ${letter}-${number}`);
    } catch (error) {
      console.error(`[Audio Debug] ❌ Error playing Amharic number: ${letter}-${number}, falling back to English`, error);
      // Fallback to English if Amharic audio fails
      try {
        const msg = new SpeechSynthesisUtterance(`${letter} ${number}`);
        msg.lang = 'en-US';
        msg.rate = 1.0;
        msg.pitch = 1.1;
        window.speechSynthesis.speak(msg);
      } catch (fallbackError) {
        console.error('[Audio Debug] ❌ Fallback speech synthesis error:', fallbackError);
      }
    }
  } else {
    try {
      console.log(`[Audio Debug] Using English Web Speech API for: ${letter} ${number}`);
      const msg = new SpeechSynthesisUtterance(`${letter} ${number}`);
      msg.lang = 'en-US';
      msg.rate = 1.0;
      msg.pitch = 1.1;
      msg.volume = 1.0;
      window.speechSynthesis.speak(msg);
    } catch (error) {
      console.error('[Audio Debug] ❌ Speech synthesis error:', error);
    }
  }
};

const handleLanguageChange = (lang: string) => {
  currentLanguage.value = lang;
};

const handleVolumeChange = (volume: number) => {
  amharicAudio.setVolume(volume);
};

const getPatternTitle = (pattern: string): string => {
  const normalized = String(pattern || '').toLowerCase();
  const match = patterns.find((p) => String(p.value).toLowerCase() === normalized);
  return match?.title || pattern;
};


const getWinningPatternDetails = (): string => {
  // Check if we have multiple patterns
  const winningPatterns = verificationResult.value?.winningPatterns;
  const patternNames = verificationResult.value?.patternNames;

  if (Array.isArray(winningPatterns) && winningPatterns.length > 0 && Array.isArray(patternNames)) {
    // Multiple patterns - show all pattern names
    if (winningPatterns.length > 1) {
      return `${winningPatterns.length} patterns: ${patternNames.join(', ')}`;
    }
    // Single pattern with name
    return patternNames[0] || '';
  }

  // Fallback to old single pattern format
  const winningPattern = verificationResult.value?.winningPattern;
  if (!Array.isArray(winningPattern) || winningPattern.length === 0) {
    return '';
  }

  const letters = ['B', 'I', 'N', 'G', 'O'];
  const details = winningPattern
    .map((cell) => {
      const row = cell[0] ?? 0;
      const col = cell[1] ?? 0;
      const columnLetter = letters[col] || '?';
      const cardValue = selectedCardGrid.value?.[row]?.[col];
      const displayValue = cardValue === 0 ? 'FREE' : cardValue ?? '?';
      return `${columnLetter}${row + 1}:${displayValue}`;
    })
    .join(', ');

  return details;
};

const isCardRegistered = (cardNum: number): boolean => {
  return registeredCards.value.includes(cardNum);
};

const toggleCardRegistration = (cardNum: number) => {
  const index = registeredCards.value.indexOf(cardNum);
  if (index > -1) {
    // Unregister
    registeredCards.value.splice(index, 1);
  } else {
    // Register
    registeredCards.value.push(cardNum);
  }
};

const playShuffleSound = async () => {
  try {
    await amharicAudio.playShuffle();
  } catch (error) {
    console.warn('Recorded shuffle audio is unavailable:', error);
  }
};

const openShuffleRing = () => {
  if (gameStatus.value !== 'playing' || boardShuffleActive.value || shuffleWaitActive.value) return;

  void playShuffleSound();
  stopAutoCall();
  if (initialCallTimeout !== null) {
    window.clearTimeout(initialCallTimeout);
    initialCallTimeout = null;
  }

  // Pause server-side extraction while the board is only showing animation.
  socketStore.client?.emit('pause-match', {
    matchId: room.value?.currentMatch?.id,
    roomId: roomId.value,
  });
  gameStatus.value = 'paused';

  startBoardShuffleMotion();
  initialCallTimeout = window.setTimeout(() => {
    initialCallTimeout = null;
    beginShuffleWait();
  }, SHUFFLE_DURATION_MS);
};

const stopBoardShuffleMotion = () => {
  if (shuffleBoardInterval !== null) {
    window.clearInterval(shuffleBoardInterval);
    shuffleBoardInterval = null;
  }
  boardShuffleActive.value = false;
  shuffleHighlightedNumbers.value = new Set();
  shuffleHighlightQueue = [];
};

const startBoardShuffleMotion = () => {
  stopBoardShuffleMotion();
  boardShuffleActive.value = true;
  shuffleHighlightQueue = Array.from({ length: 75 }, (_, index) => index + 1);
  shuffleBoardInterval = window.setInterval(() => {
    if (shuffleHighlightQueue.length === 0) {
      shuffleHighlightQueue = Array.from({ length: 75 }, (_, index) => index + 1);
    }

    for (let index = shuffleHighlightQueue.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [shuffleHighlightQueue[index], shuffleHighlightQueue[randomIndex]] = [
        shuffleHighlightQueue[randomIndex],
        shuffleHighlightQueue[index],
      ];
    }

    shuffleHighlightedNumbers.value = new Set(shuffleHighlightQueue.splice(0, 8));
  }, 180);
};

const beginShuffleWait = () => {
  stopBoardShuffleMotion();

  if (shuffleWaitTimeout !== null) {
    window.clearTimeout(shuffleWaitTimeout);
  }

  shuffleWaitActive.value = true;
  shuffleWaitTimeout = window.setTimeout(() => {
    shuffleWaitTimeout = null;
    shuffleWaitActive.value = false;

    if (gameStatus.value !== 'paused') return;

    socketStore.client?.emit('play-match', {
      matchId: room.value?.currentMatch?.id,
      roomId: roomId.value,
    });
    gameStatus.value = 'playing';
    autoCallEnabled.value = true;
    callNextNumber();
    startAutoCall();
  }, SHUFFLE_WAIT_MS);
};

const cancelShuffleWorkflow = () => {
  stopBoardShuffleMotion();

  if (shuffleWaitTimeout !== null) {
    window.clearTimeout(shuffleWaitTimeout);
    shuffleWaitTimeout = null;
  }

  shuffleWaitActive.value = false;
};

const viewCardDetails = async (cardNum: number): Promise<void> => {
  selectedCardForView.value = cardNum;
  showCardDetailsModal.value = true;
  selectedCardGrid.value = null;
  const normalizedCardNumber = normalizeCardNumber(String(cardNum));
  try {
    const response = await services?.cardService.getByCardNumber(normalizedCardNumber);
    const grid = response?.data?.grid;
    if (Array.isArray(grid) && Array.isArray(grid[0])) {
      selectedCardGrid.value = grid;
      return;
    }
    selectedCardGrid.value = generateFallbackCardGrid(cardNum);
  } catch (error) {
    console.error('Error loading card details:', error);
    selectedCardGrid.value = generateFallbackCardGrid(cardNum);
  }
};

const generateFallbackCardGrid = (cardNum: number): number[][] => {
  const ranges: [number, number][] = [
    [1, 15],
    [16, 30],
    [31, 45],
    [46, 60],
    [61, 75],
  ];
  const grid: number[][] = Array.from({ length: 5 }, () => Array(5).fill(0));
  let seed = Math.max(1, cardNum) * 1000;
  const seededRandom = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  for (let col = 0; col < 5; col++) {
    const [min, max] = ranges[col];
    const nums = Array.from({ length: max - min + 1 }, (_, i) => min + i);
    for (let i = nums.length - 1; i > 0; i--) {
      const j = Math.floor(seededRandom() * (i + 1));
      [nums[i], nums[j]] = [nums[j], nums[i]];
    }
    const chosen = nums.slice(0, 5).sort((a, b) => a - b);
    for (let row = 0; row < 5; row++) {
      grid[row][col] = row === 2 && col === 2 ? 0 : chosen[row];
    }
  }
  return grid;
};

// Navigation functions
const goBack = () => {
  router.push({ name: 'home' });
};

const confirmLogout = () => {
  showLogoutDialog.value = true;
};

const logout = () => {
  showLogoutDialog.value = false;
  auth.logout();
  router.push({ name: 'home' });
};

const startNewGame = async () => {
  if (!canManageRoom.value) {
    speakMessage('Only admin or assigned room manager can start a game.');
    return;
  }
  if (registeredCards.value.length === 0) {
    const message = 'Please register at least one card before starting the game.';
    speakMessage(message);
    return;
  }

  // Unlock all cards from previous match before starting new game
  if (room.value?.currentMatch?.id) {
    try {
      await services?.cardService.unlockMatch(room.value.currentMatch.id);
      console.log(`[Game Start] Unlocked all cards from previous match #${room.value.currentMatch.id}`);
    } catch (error) {
      console.warn('[Game Start] Failed to unlock cards from previous match:', error);
      // Continue anyway - this is not critical
    }
  }

  selectedPatternForMatch.value = currentPattern.value;

  // Announce game start and pattern
  const patternTitle = getPatternTitle(currentPattern.value);
  const startMessage = `Starting new game! We are playing for ${patternTitle}. Good luck everyone!`;
  speakMessage(startMessage);

  // Convert card numbers to proper format (e.g., 1 -> ROOM9-CAR0001)
  const currentRoomId = room.value?.id || 0;
  const registeredCardNumbers = registeredCards.value.map(num =>
    `ROOM${currentRoomId}-CAR${String(num).padStart(4, '0')}`
  );

  console.log('[Frontend] Emitting new-match event:', {
    roomId: roomId.value,
    soldCards: registeredCards.value.length,
    houseFeePerCard: houseFee.value,
    betAmount: betAmount.value,
    registeredCards: registeredCardNumbers,
    pattern: currentPattern.value,
  });

  const emitNewMatch = () => {
    console.log('[Frontend] ✅ Socket connected, emitting event...');
    socketStore.client?.emit('new-match', {
      roomId: roomId.value,
      soldCards: registeredCards.value.length,
      houseFeePerCard: houseFee.value,
      betAmount: betAmount.value,
      registeredCards: registeredCardNumbers,
      pattern: currentPattern.value,
    }, (response?: { error?: string }) => {
      if (response?.error) {
        console.error('[Frontend] ❌ Server error:', response.error);
        speakMessage(`Error starting game: ${response.error}`);
      } else {
        console.log('[Frontend] ✅ Server acknowledged new-match event');
      }
    });
    gameStatus.value = 'playing';
    matchWinners.value = [];
    if (initialCallTimeout !== null) {
      window.clearTimeout(initialCallTimeout);
    }
    initialCallTimeout = window.setTimeout(() => {
      initialCallTimeout = null;
      if (gameStatus.value === 'playing' && calledNumbers.value.length === 0) {
        callNextNumber();
      }
    }, 15000);
  };

  if (!socketStore.client?.connected) {
    socketStore.ensureConnected();
    if (!socketStore.client) {
      console.error('[Frontend] ❌ Socket not connected!');
      speakMessage('Connection error. Please log in again.');
      return;
    }
    socketStore.client.once('connect', emitNewMatch);
    return;
  }

  emitNewMatch();
};

const normalizeCardNumber = (raw: string): string => {
  const value = String(raw || '').trim().toUpperCase();
  if (!value) return '';
  if (value.startsWith('SOEMB-CA')) {
    return value;
  }
  const currentRoomId = room.value?.id || 0;
  return normalizeRoomCardNumber(value, currentRoomId) || value;
};

const pauseGame = () => {
  if (!canManageRoom.value) {
    showToast('Only admin or assigned room manager can pause a game.', 'warning');
    return;
  }

  console.log('[PAUSE] ========== PAUSE GAME CLICKED ==========');
  console.log('[PAUSE] Match ID:', room.value?.currentMatch?.id);
  console.log('[PAUSE] Room ID:', roomId.value);
  console.log('[PAUSE] Socket connected:', socketStore.client?.connected);
  console.log('[PAUSE] Emitting pause-match event...');

  stopAutoCall();
  gameStatus.value = 'paused';
  console.log('[PAUSE] ✅ Game status set to paused');

  socketStore.client?.emit('pause-match', {
    matchId: room.value?.currentMatch?.id,
    roomId: roomId.value
  });

  // Announce pause
  speakMessage('Game paused. BINGO called!');
};

const resumeGame = () => {
  if (!canManageRoom.value) {
    showToast('Only admin or assigned room manager can resume a game.', 'warning');
    return;
  }
  socketStore.client?.emit('play-match', {
    matchId: room.value?.currentMatch?.id,
    roomId: roomId.value,
  });
  gameStatus.value = 'playing';

  // Announce resume
  speakMessage('Game resumed. Continuing to call numbers.');

  // Resume auto-call if it was enabled
  if (autoCallEnabled.value) {
    startAutoCall();
  }
};

const togglePauseResume = () => {
  if (gameStatus.value === 'playing') {
    pauseGame();
    return;
  }

  if (gameStatus.value === 'paused') {
    resumeGame();
  }
};

// Manual call next number
const callNextNumber = () => {
  if (!canManageRoom.value) {
    showToast('Only admin or assigned room manager can call numbers.', 'warning');
    return;
  }

  if (gameStatus.value !== 'playing') {
    showToast('Game is not active.', 'warning');
    return;
  }

  if (calledNumbers.value.length >= 75) {
    showToast('All numbers have been called!', 'info');
    return;
  }

  // Manually call by changing speed momentarily to trigger immediate call
  socketStore.client?.emit('change-speed', {
    matchId: room.value?.currentMatch?.id,
    roomId: roomId.value,
    speed: 100, // Very fast to trigger immediately
  });

  // Reset to normal speed after a moment
  setTimeout(() => {
    socketStore.client?.emit('change-speed', {
      matchId: room.value?.currentMatch?.id,
      roomId: roomId.value,
      speed: callingSpeed.value,
    });
  }, 200);
};

// Toggle auto-call functionality
const toggleAutoCall = () => {
  if (boardShuffleActive.value) {
    autoCallEnabled.value = true;
    beginShuffleWait();
    return;
  }

  autoCallEnabled.value = !autoCallEnabled.value;

  if (autoCallEnabled.value) {
    if (gameStatus.value === 'playing') {
      startAutoCall();
      showToast('Auto-call enabled', 'success');
    } else {
      autoCallEnabled.value = false;
      showToast('Start a game first to enable auto-call', 'warning');
    }
  } else {
    stopAutoCall();
    if (initialCallTimeout !== null) {
      window.clearTimeout(initialCallTimeout);
      initialCallTimeout = null;
    }
    showToast('Auto-call disabled', 'info');
  }
};

// Start auto-calling numbers
const startAutoCall = () => {
  if (autoCallTimer) {
    clearInterval(autoCallTimer);
  }

  autoCallTimer = window.setInterval(() => {
    if (gameStatus.value === 'playing' && calledNumbers.value.length < 75) {
      callNextNumber();
    } else {
      stopAutoCall();
    }
  }, callingSpeed.value);
};

// Stop auto-calling
const stopAutoCall = () => {
  if (autoCallTimer) {
    clearInterval(autoCallTimer);
    autoCallTimer = null;
  }
  autoCallEnabled.value = false;
};

const resetGame = () => {
  if (!canManageRoom.value) {
    showToast('Only admin or assigned room manager can reset a game.', 'warning');
    return;
  }

  stopAutoCall();
  cancelShuffleWorkflow();

  // Emit reset event to backend
  if (room.value?.currentMatch?.id) {
    socketStore.client?.emit('reset-match', {
      matchId: room.value.currentMatch.id,
      roomId: roomId.value
    });
  }

  // Immediately clear all frontend state for fast response
  calledNumbers.value = [];
  lastCalledNumber.value = 0;
  gameStatus.value = 'idle';
  verificationResult.value = null;
  verifyCardNumber.value = '';
  matchWinners.value = [];
  registeredCards.value = [];
  selectedCardForView.value = null;
  selectedCardGrid.value = null;
  showCardDetailsModal.value = false;

  // Unlock all cards for this match
  if (room.value?.currentMatch?.id) {
    services?.cardService.unlockMatch(room.value.currentMatch.id);
  }

  showToast('Game reset successfully', 'success');
};

const verifyWin = async () => {
  if (!canManageRoom.value) {
    showToast('Only admin or assigned room manager can verify wins.', 'warning');
    return;
  }
  if (gameStatus.value !== 'paused') {
    showToast('You can verify only when game is paused.', 'warning');
    return;
  }
  if (!verifyCardNumber.value) {
    const message = 'Please enter a card number to verify.';
    showToast(message, 'warning');
    speakMessage(message);
    return;
  }

  verifying.value = true;
  verificationResult.value = null;

  try {
    const normalizedCardNumber = normalizeCardNumber(verifyCardNumber.value);

    const response = await services?.cardService.verify(
      normalizedCardNumber,
      calledNumbers.value,
      activePattern.value
    );

    verificationResult.value = response?.data as VerificationResult;
    verifyCardNumber.value = normalizedCardNumber;

    // Extract card number for viewing details
    const cardNumMatch = normalizedCardNumber.match(/\d+$/);
    if (cardNumMatch) {
      const selectedCardNumber = Number(cardNumMatch[0]);
      if (!Number.isNaN(selectedCardNumber)) {
        selectedCardForView.value = selectedCardNumber;
        await viewCardDetails(selectedCardNumber);
      }
    }

    if (response?.data.isValid) {
      const alreadyWinner = matchWinners.value.some(
        (w) => w.cardNumber.toUpperCase() === normalizedCardNumber.toUpperCase(),
      );
      if (alreadyWinner) {
        showToast(`Card ${normalizedCardNumber} is already verified as a winner.`, 'warning');
        return;
      }

      matchWinners.value.push({
        cardNumber: normalizedCardNumber,
        timestamp: new Date(),
        specialWin: response?.data.specialWin || false,
      });

      // Check if it's a special win (unlucky winner - zero marks after 12 calls)
      if (response?.data.specialWin) {
        const specialMessage = `🎉 SPECIAL WIN! Card ${normalizedCardNumber} has zero numbers marked after 12 calls - Unlucky Winner!`;
        showToast(specialMessage, 'success');
        speakMessage(`Special win! Card ${normalizedCardNumber} is the unlucky winner with no numbers marked.`);
      } else {
        const patternTitle = getPatternTitle(activePattern.value);
        const patternDetails = getWinningPatternDetails();

        // Show winner count if multiple winners
        const winnerCount = matchWinners.value.length;
        const winnerInfo = winnerCount > 1 ? ` (Winner #${winnerCount})` : '';

        const serverMessage = response?.data.message?.trim();
        const successMessage =
          serverMessage ||
          `Card ${normalizedCardNumber} wins with ${patternTitle}${winnerInfo}. ${patternDetails ? `Pattern: ${patternDetails}` : ''}`.trim();
        showToast(successMessage, 'success');
        speakMessage(`Congratulations! ${normalizedCardNumber} is a valid ${patternTitle} winner.`);
      }

      // Show multiple winners info
      if (matchWinners.value.length > 1) {
        const winnersInfo = `Total winners: ${matchWinners.value.length} - Prize will be split equally.`;
        showToast(winnersInfo, 'info');
      }

      // Keep game PAUSED to allow verifying more winners
      gameStatus.value = 'paused';

      // Clear the input for next verification
      verifyCardNumber.value = '';

      // Show message about verifying more winners
      const moreWinnersMessage = `Winner verified! You can verify more winners or click "Finish Game" to end.`;
      showToast(moreWinnersMessage, 'info');
    } else if (response?.data.unregistered) {
      // Card is not registered for this match - BLOCK verification
      speakMessage(`Card not registered. Only registered cards can win.`);
    } else if (response?.data.cardLocked) {
      // Card is locked from previous wrong claim
      const lockedMessage = `Card ${normalizedCardNumber} is locked due to a previous wrong claim.`;
      showToast(lockedMessage, 'error');
      speakMessage(`Invalid claim. ${normalizedCardNumber} is locked.`);
    } else {
      // Invalid claim - check if it's a timing issue (late claim)
      const isLateClaim = response?.data.lateClaim ||
        response?.data.message?.includes('Pattern was completed earlier') ||
        response?.data.message?.includes('not on the current number');

      if (isLateClaim) {
        // Late BINGO claim - pattern was completed earlier
        // BUT still show the winning pattern so manager can see what was completed
        const lateClaimMessage = `❌ LATE CLAIM! ${response?.data.message || 'You must call BINGO immediately when you win!'}`;
        showToast(lateClaimMessage, 'error');

        // Play the late-claim event audio
        if (currentLanguage.value === 'am') {
          try {
            await amharicAudio.playEvent('winner-invalid');
            console.log('[Audio Debug] ✅ Played late claim event audio');
          } catch (error) {
            console.error('[Audio Debug] ❌ Error playing late claim audio:', error);
            // Fallback to text-to-speech
            speakMessage('Late claim rejected. You must call BINGO immediately. Click the resume button.');
          }
        } else {
          speakMessage('Late claim rejected. You must call BINGO immediately. Click the resume button.');
        }

        // Show additional info about the late claim
        if (response?.data.patternNames && response?.data.patternNames.length > 0) {
          const patternInfo = `Pattern completed: ${response.data.patternNames.join(', ')}`;
          showToast(patternInfo, 'warning');
        }

        // NOTE: verificationResult is already set above, so the pattern will display
        // The winning pattern grid will show even though it's a late claim

        // Don't auto-resume - let manager click resume button
        showToast('Click RESUME button to continue the game', 'info');
      } else {
        // Regular invalid claim - lock the card
        const invalidMessage = `Invalid win. Card ${normalizedCardNumber} will be locked until game ends.`;
        showToast(invalidMessage, 'error');
        speakMessage(`Invalid win for ${normalizedCardNumber}. The card is now locked.`);

        // Lock the card
        if (room.value?.currentMatch?.id) {
          await services?.cardService.lockCard(normalizedCardNumber, room.value.currentMatch.id);
        }

        if (matchWinners.value.length > 0) {
          showToast('Invalid claim. Game remains paused because valid winners exist.', 'info');
        } else {
          showToast('Click RESUME to continue calling numbers.', 'info');
        }
      }
    }
  } catch (error) {
    console.error('Error verifying win:', error);
    const message = 'Failed to verify win. Please try again.';
    showToast(message, 'error');
  } finally {
    verifying.value = false;
  }
};

const onCardsAssigned = () => {
  console.log('Cards assigned successfully');
};
const saveBettingSettings = async () => {
  if (!canManageRoom.value) {
    showToast('Only admin or assigned room manager can update ticket settings.', 'warning');
    return;
  }
  try {
    await services?.roomService.ticketPrice(roomId.value, Number(betAmount.value || 0));
    showBettingModal.value = false;
    showToast('Ticket price updated successfully!', 'success');

    // Refresh room data to show updated ticket price
    await loadRoomData();
  } catch (error) {
    const maybeError = error as { response?: { data?: { message?: string } }; message?: string };
    const message = 'Error saving betting settings: ' + (maybeError.response?.data?.message || maybeError.message || 'Unknown error');
    showToast(message, 'error');
  }
};

// Reusable function to load/refresh room data
const loadRoomData = async () => {
  try {
    const response = await services?.roomService.show(roomId.value);
    room.value = response?.data ?? null;
    const catalogResponse = await services?.roomService.getRoomCardCatalog(roomId.value);
    cardCatalog.value = (catalogResponse?.data?.cards || [])
      .map((card) => card.index)
      .filter((index) => Number.isInteger(index) && index > 0)
      .sort((a, b) => a - b);
    betAmount.value = Number(room.value?.ticketPrice || 0);

    // Load pattern from active match if available
    if (room.value?.currentMatch?.pattern && !room.value.currentMatch.closed) {
      currentPattern.value = room.value.currentMatch.pattern;
      selectedPatternForMatch.value = room.value.currentMatch.pattern;
      console.log(`[BingoRoom] Loaded pattern from active match: ${room.value.currentMatch.pattern}`);
    }

    const permission = await services?.roomService.canManageRoom(roomId.value);
    canManageRoomByApi.value = Boolean(permission?.data?.canManage);
  } catch (error) {
    console.error('Error loading room data:', error);
  }
};

/** Each pattern may have several variants; each variant is a list of [row, col] cells. */
type PatternCoordinates = number[][][];

const getPatternCoordinates = (pattern: string): PatternCoordinates => {
  const lines: PatternCoordinates = [
    ...Array.from({ length: 5 }, (_, row) =>
      Array.from({ length: 5 }, (_, col) => [row, col]),
    ),
    ...Array.from({ length: 5 }, (_, col) =>
      Array.from({ length: 5 }, (_, row) => [row, col]),
    ),
    [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4]],
    [[0, 4], [1, 3], [2, 2], [3, 1], [4, 0]],
  ];
  const combineLines = (count: number): PatternCoordinates => {
    const combinations: PatternCoordinates = [];
    const visit = (start: number, selected: number[][][]) => {
      if (selected.length === count) {
        combinations.push(selected.flat());
        return;
      }
      for (let index = start; index < lines.length; index++) {
        visit(index + 1, [...selected, lines[index]]);
      }
    };
    visit(0, []);
    return combinations;
  };
  const patterns: Record<string, PatternCoordinates> = {
    twoline: combineLines(2),
    threeline: combineLines(3),
    anyline: [
      // Show all possible lines for visualization
      [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]], // Row 0
      [[1, 0], [1, 1], [1, 2], [1, 3], [1, 4]], // Row 1
      [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4]], // Row 2
      [[3, 0], [3, 1], [3, 2], [3, 3], [3, 4]], // Row 3
      [[4, 0], [4, 1], [4, 2], [4, 3], [4, 4]], // Row 4
      [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]], // Col 0
      [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1]], // Col 1
      [[0, 2], [1, 2], [2, 2], [3, 2], [4, 2]], // Col 2
      [[0, 3], [1, 3], [2, 3], [3, 3], [4, 3]], // Col 3
      [[0, 4], [1, 4], [2, 4], [3, 4], [4, 4]], // Col 4
      [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4]], // Diagonal \
      [[0, 4], [1, 3], [2, 2], [3, 1], [4, 0]], // Diagonal /
    ],
    horizontal: [
      [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4]], // Middle row (row 3) - example
    ],
    vertical: [
      [[0, 2], [1, 2], [2, 2], [3, 2], [4, 2]], // Middle column (N) - example
    ],
    diagonal: [
      [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4]], // Top-left to bottom-right \
      [[0, 4], [1, 3], [2, 2], [3, 1], [4, 0]], // Top-right to bottom-left /
    ],
    corners: [
      [[0, 0], [0, 4], [4, 0], [4, 4]], // Four corners only
    ],
    x: [
      [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4]], // Top-left to bottom-right \
      [[0, 4], [1, 3], [2, 2], [3, 1], [4, 0]], // Top-right to bottom-left /
    ],
    t: [
      // T pointing down only: Top row + middle column
      [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [1, 2], [2, 2], [3, 2], [4, 2]],
    ],
    l: [
      // L bottom-left only: Left column + bottom row
      [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [4, 1], [4, 2], [4, 3], [4, 4]],
    ],
    fullhouse: [
      Array.from({ length: 25 }, (_, i) => [Math.floor(i / 5), i % 5]), // All 25 cells
    ],
  };

  return patterns[pattern.toLowerCase()] || [];
};

const isPatternCell = (row: number, col: number, pattern: string) => {
  const patternCoords = getPatternCoordinates(pattern);
  if (patternCoords.length === 0) return false;

  // Check ALL pattern options (important for diagonal which has 2 options)
  return patternCoords.some((coords) =>
    coords.some((cell) => cell[0] === row && cell[1] === col),
  );
};

const isPreviewPatternCell = (row: number, col: number, pattern: string) => {
  const patternCoords = getPatternCoordinates(pattern);
  if (patternCoords.length === 0) return false;

  if (pattern === 'twoline' || pattern === 'threeline') {
    return patternCoords[0].some((cell) => cell[0] === row && cell[1] === col);
  }

  return isPatternCell(row, col, pattern);
};

const isWinningPatternCell = (row: number, col: number) => {
  if (!verificationResult.value) return false;

  // Check all winning patterns if available
  const winningPatterns = verificationResult.value.winningPatterns;
  if (Array.isArray(winningPatterns) && winningPatterns.length > 0) {
    // Check if this cell is in ANY of the winning patterns
    return winningPatterns.some((pattern) =>
      pattern.some((cell) => cell[0] === row && cell[1] === col),
    );
  }

  // Fallback to single pattern
  const winningPattern = verificationResult.value.winningPattern;
  if (!winningPattern) return false;
  return winningPattern.some((cell) => cell[0] === row && cell[1] === col);
};

onMounted(async () => {
  try {
    console.log('Loading room:', roomId.value);

    // Load room data
    await loadRoomData();

    console.log('Room response:', room.value);

    if (room.value?.currentMatch?.matchNumbers) {
      // Set game status based on match state
      if (room.value.currentMatch.closed) {
        // Match is closed - clear all state for fresh start
        gameStatus.value = 'idle';
        calledNumbers.value = [];
        lastCalledNumber.value = 0;
        verificationResult.value = null;
        verifyCardNumber.value = '';
        matchWinners.value = [];
      } else if (room.value.currentMatch.matchNumbers.length > 0) {
        // Match is active - load the numbers
        calledNumbers.value = room.value.currentMatch.matchNumbers.map(
          (mn: MatchNumber) => mn.number,
        );
        lastCalledNumber.value = calledNumbers.value[calledNumbers.value.length - 1] || 0;
        gameStatus.value = 'playing';
        selectedPatternForMatch.value = currentPattern.value;
      }
    } else {
      // No match exists - ensure clean state
      gameStatus.value = 'idle';
      calledNumbers.value = [];
      lastCalledNumber.value = 0;
      verificationResult.value = null;
      verifyCardNumber.value = '';
      matchWinners.value = [];
    }

    const { setup: setupRoomSocket } = useRoomSocket({
      roomId,
      calledNumbers,
      lastCalledNumber,
      gameStatus,
      room,
      currentPattern,
      selectedPatternForMatch,
      matchWinners,
      registeredCards,
      verificationResult,
      verifyCardNumber,
      selectedCardForView,
      selectedCardGrid,
      showCardDetailsModal,
      onNumberCalled: announceNumber,
      showToast,
      isNumberCalled,
    });
    setupRoomSocket();
  } catch (error) {
    console.error('Error loading room:', error);
    showToast('Failed to load room. Please try again.', 'error');
  }
});

// Cleanup when leaving the room
onBeforeUnmount(() => {
  stopBoardShuffleMotion();
  stopAutoCall();
  cancelShuffleWorkflow();
  if (initialCallTimeout !== null) {
    window.clearTimeout(initialCallTimeout);
    initialCallTimeout = null;
  }

  // Stop speech synthesis
  window.speechSynthesis.cancel();

  // Clear Amharic audio cache
  amharicAudio.clearCache();
});
</script>

<style scoped lang="scss">
.bingo-room {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  padding: 0;
}

.room-header {
  position: sticky !important;
  top: 0;
  z-index: 100;
}

.room-content {
  padding: 20px;
}

.left-panel {
  display: none !important;
}

.right-panel {
  display: block !important;
  flex: 0 0 100% !important;
  max-width: 100% !important;
}

.terminal-menu-card {
  min-width: 220px;
  background: #fff !important;
}

.pattern-settings-panel {
  position: relative;
  z-index: 2;
  border-bottom: 1px solid #d7dee5;
  background: #f7f9fb;
  box-shadow: 0 4px 12px rgba(20, 34, 53, 0.12);
}

.pattern-settings-inner {
  max-width: 1440px;
  margin: 0 auto;
  padding: 16px 32px 18px;
}

.pattern-settings-heading,
.pattern-settings-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.pattern-settings-title {
  color: #142235;
  font-size: 16px;
  font-weight: 800;
}

.pattern-settings-subtitle {
  margin-top: 2px;
  color: #607080;
  font-size: 12px;
}

.pattern-settings-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: #546e7a;
}

.pattern-settings-close:hover,
.pattern-settings-close:focus-visible {
  background: #e4ebf1;
}

.pattern-settings-controls {
  justify-content: flex-start;
  margin-top: 12px;
}

.pattern-settings-controls .v-select {
  width: min(360px, 100%);
}

.header-pattern-preview {
  max-width: 400px;
  margin: 18px auto 0;
  border-top: 1px solid #e0e0e0;
  padding-top: 16px;
}

.header-pattern-preview .pattern-card-header {
  display: grid;
  grid-template-columns: repeat(5, minmax(30px, 1fr));
  gap: 8px;
  max-width: 360px;
  margin-right: auto;
  margin-left: auto;
  margin-top: 8px;
}

.header-pattern-preview .pattern-header-letter {
  min-height: 42px;
  padding: 8px 0;
  border-radius: 8px;
  color: #fff;
  font-size: 1rem;
  font-weight: 800;
  text-align: center;
}

.header-pattern-preview .pattern-grid {
  width: 100%;
  max-width: 360px;
  margin: 0 auto;
  border-collapse: separate;
  border-spacing: 5px;
  padding: 7px;
  border-radius: 12px;
  background: #1b2230;
  box-shadow: 0 8px 20px rgba(20, 34, 53, 0.2);
}

.header-pattern-preview .pattern-cell {
  width: 20%;
  height: clamp(42px, 7vw, 58px);
  padding: 10px 4px;
  border: 2px solid #d9dee7;
  border-radius: 7px;
  background: #ffffff;
  color: #263238;
  font-size: clamp(0.85rem, 1.4vw, 1.1rem);
  font-weight: 800;
  text-align: center;
}

.header-pattern-preview .pattern-cell.pattern-active {
  background: #e53935;
  color: #fff;
  border-color: #b71c1c;
  box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.18);
}

.header-pattern-preview .pattern-cell.pattern-free {
  background: #ffd740;
  color: #17202a;
  border-color: #ffb300;
}

.info-card {
  background: #142235 !important;
  border-radius: 6px !important;
  box-shadow: 0 10px 28px rgba(2, 8, 18, 0.42) !important;
  border: 1px solid #25506d !important;
}

.info-card-title {
  display: flex;
  justify-content: center;
  background: #1a6a9c !important;
  color: #eaf8ff !important;
  padding: 9px 12px !important;
  border-radius: 5px 5px 0 0 !important;

  h2 {
    font-size: 0.82rem;
    font-weight: 800;
    letter-spacing: 0.14em;
    margin: 0;
  }
}

.current-ball {
  margin: 14px auto 10px;
  padding: 12px 10px 10px;
  background: #0b1725;
  border: 1px solid #20425c;
  border-radius: 4px;
  box-shadow: inset 0 0 20px rgba(2, 8, 18, 0.72);
}

.ball-display {
  width: 104px;
  height: 104px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3.2rem;
  font-weight: 800;
  color: white;
  margin: 0 auto;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.44), 0 0 0 5px #173a54, inset 0 -8px 16px rgba(0, 0, 0, 0.2);
  border: 2px solid #71dcf5;
  animation: pulse 2s infinite;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 15%;
    left: 20%;
    width: 40%;
    height: 30%;
    background: radial-gradient(ellipse at center, rgba(255, 255, 255, 0.32) 0%, transparent 70%);
    border-radius: 50%;
    transform: rotate(-45deg);
  }
}

@keyframes pulse {

  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.25), 0 0 0 8px rgba(255, 255, 255, 0.9), inset 0 -8px 16px rgba(0, 0, 0, 0.15);
  }

  50% {
    transform: scale(1.05);
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.3), 0 0 0 10px rgba(255, 255, 255, 0.95), inset 0 -10px 20px rgba(0, 0, 0, 0.2);
  }
}

.ball-letter {
  font-size: 1rem;
  font-weight: 800;
  margin-top: 9px;
  color: #7cdbf4;
  text-shadow: none;
  letter-spacing: 0.2em;
}

.ball-b {
  background: linear-gradient(135deg, #2196f3 0%, #1565c0 100%);
  box-shadow:
    0 12px 28px rgba(33, 150, 243, 0.4),
    0 0 0 8px rgba(255, 255, 255, 0.9),
    inset 0 -8px 16px rgba(0, 0, 0, 0.15);
}

.ball-i {
  background: linear-gradient(135deg, #ef5350 0%, #c62828 100%);
  box-shadow:
    0 12px 28px rgba(239, 83, 80, 0.4),
    0 0 0 8px rgba(255, 255, 255, 0.9),
    inset 0 -8px 16px rgba(0, 0, 0, 0.15);
}

.ball-n {
  background: linear-gradient(135deg, #66bb6a 0%, #2e7d32 100%);
  box-shadow:
    0 12px 28px rgba(102, 187, 106, 0.4),
    0 0 0 8px rgba(255, 255, 255, 0.9),
    inset 0 -8px 16px rgba(0, 0, 0, 0.15);
}

.ball-g {
  background: linear-gradient(135deg, #ffa726 0%, #ef6c00 100%);
  box-shadow:
    0 12px 28px rgba(255, 167, 38, 0.4),
    0 0 0 8px rgba(255, 255, 255, 0.9),
    inset 0 -8px 16px rgba(0, 0, 0, 0.15);
}

.ball-o {
  background: linear-gradient(135deg, #ab47bc 0%, #6a1b9a 100%);
  box-shadow:
    0 12px 28px rgba(171, 71, 188, 0.4),
    0 0 0 8px rgba(255, 255, 255, 0.9),
    inset 0 -8px 16px rgba(0, 0, 0, 0.15);
}

.recent-numbers {
  display: flex;
  justify-content: center;
  gap: 7px;
  flex-wrap: wrap;
  margin-top: 12px;
  padding: 9px 6px;
  background: #0b1725;
  border: 1px solid #20425c;
  border-radius: 4px;
  box-shadow: inset 0 0 16px rgba(2, 8, 18, 0.6);
}

.recent-ball {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.82rem;
  font-weight: 800;
  color: white;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.34), 0 0 0 2px #1c425b, inset 0 -4px 8px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(116, 220, 245, 0.7);
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 15%;
    left: 20%;
    width: 35%;
    height: 25%;
    background: radial-gradient(ellipse at center, rgba(255, 255, 255, 0.35) 0%, transparent 70%);
    border-radius: 50%;
    transform: rotate(-45deg);
  }
}

.board-card {
  background: #000 !important;
  border: 3px solid #333 !important;
}

.board-title {
  background: #000 !important;
  border-bottom: 2px solid #333;
}

.bingo-board-header {
  display: flex;
  justify-content: space-around;
  width: 100%;
  font-size: 2.5rem;
  font-weight: bold;
  color: #666;
  padding: 15px 0;
  font-family: 'Courier New', monospace;
}

.board-letter {
  flex: 1;
  text-align: center;
}

.board-content {
  background: #000;
  padding: 20px !important;
}

.bingo-board {
  width: 100%;
  border-collapse: separate;
  border-spacing: 4px;
  background: #000;
}

.board-cell {
  width: 20%;
  height: 50px;
  text-align: center;
  font-size: 1.8rem;
  font-weight: bold;
  font-family: 'Courier New', 'Digital-7', monospace;
  transition: all 0.3s;
  background: #000;
  color: #333;
  border: none;
  padding: 8px;
  letter-spacing: 2px;

  &.called {
    color: #ff0000;
    text-shadow:
      0 0 5px #ff0000,
      0 0 10px #ff0000,
      0 0 15px #ff0000,
      0 0 20px #ff0000;
    animation: glow 0.5s ease-in-out;
  }
}

.sidebar-card {
  background: #142235 !important;
  border: 1px solid #25506d !important;
  border-radius: 6px !important;
  box-shadow: 0 10px 28px rgba(2, 8, 18, 0.42) !important;
  color: #c3d9e8;
}

.info-card :deep(.v-card-text),
.sidebar-card :deep(.v-card-text) {
  padding: 12px !important;
}

.info-card h3 {
  margin: 10px 0 0;
  color: #8fb2c8;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.voice-card :deep(.v-card-title),
.controls-card :deep(.v-card-title) {
  min-height: 38px;
  display: flex;
  align-items: center;
  padding: 8px 12px !important;
  color: #dff7ff !important;
  font-size: 0.72rem !important;
  font-weight: 800 !important;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.voice-card :deep(.v-card-title) {
  background: #1a6a9c !important;
}

.controls-card :deep(.v-card-title) {
  background: #194c69 !important;
}

.sidebar-card :deep(.v-field) {
  color: #cbe4f1 !important;
  background: #0d1b2b !important;
  border-color: #2b5873 !important;
}

.sidebar-card :deep(.v-field__input),
.sidebar-card :deep(.v-label) {
  color: #9fc1d3 !important;
  font-size: 0.76rem;
}

.sidebar-card :deep(.v-field--disabled) {
  opacity: 0.7;
}

.sidebar-card :deep(.v-btn) {
  min-height: 34px;
  border-radius: 3px;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.sidebar-card :deep(.v-btn--variant-outlined) {
  border-color: #368bb1;
  color: #6fd9f5;
}

.controls-card :deep(.v-card--variant-tonal) {
  background: #10263a !important;
  border: 1px solid #225777 !important;
  border-radius: 4px !important;
}

.controls-card :deep(.v-card--variant-tonal .v-card-text) {
  padding: 10px !important;
}

.controls-card :deep(.v-slider-track__background),
.controls-card :deep(.v-slider-track__fill) {
  background: #3cb9da !important;
}

.controls-card :deep(.v-slider-thumb__surface) {
  background: #72e1f5 !important;
}

.controls-card :deep(.text-grey),
.controls-card :deep(.text-subtitle-2) {
  color: #88aec3 !important;
  font-size: 0.68rem !important;
}

.controls-card :deep(.v-divider) {
  border-color: #28506a !important;
  opacity: 0.8;
}

.pattern-preview {
  padding: 8px;
  background: #0b1725;
  border: 1px solid #20425c;
  border-radius: 4px;
}

.pattern-preview :deep(.pattern-grid) {
  max-width: 100%;
}

@keyframes glow {
  0% {
    color: #333;
    text-shadow: none;
  }

  50% {
    color: #ff0000;
    text-shadow:
      0 0 10px #ff0000,
      0 0 20px #ff0000,
      0 0 30px #ff0000,
      0 0 40px #ff0000;
  }

  100% {
    color: #ff0000;
    text-shadow:
      0 0 5px #ff0000,
      0 0 10px #ff0000,
      0 0 15px #ff0000,
      0 0 20px #ff0000;
  }
}

.v-card {
  border-radius: 16px !important;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12) !important;
  overflow: hidden !important;

  .v-card-title {
    font-weight: 600;
    letter-spacing: 0.3px;
  }

  .v-card-text {
    padding: 20px !important;
  }
}

.control-card {
  background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%) !important;
  border: 1px solid rgba(102, 126, 234, 0.2) !important;
}

.control-title {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%) !important;
  color: white !important;
  font-weight: 700 !important;
  padding: 16px 20px !important;
}

.verify-card {
  background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%) !important;
  border: 2px solid #4caf50 !important;
  border-radius: 16px !important;
  box-shadow: 0 8px 24px rgba(76, 175, 80, 0.15) !important;
}

.verify-title {
  background: linear-gradient(135deg, #66bb6a 0%, #43a047 100%) !important;
  color: white !important;
  font-weight: 700 !important;
  padding: 20px !important;
  border-radius: 16px 16px 0 0 !important;
  font-size: 1.2rem !important;
}

.pause-btn {
  font-size: 1.1rem !important;
  font-weight: bold !important;
}

.pause-btn-prominent {
  animation: pulse-warning 2s infinite !important;
  box-shadow: 0 0 20px rgba(255, 152, 0, 0.8) !important;
}

@keyframes pulse-warning {

  0%,
  100% {
    box-shadow: 0 0 20px rgba(255, 152, 0, 0.8);
  }

  50% {
    box-shadow: 0 0 40px rgba(255, 152, 0, 1);
  }
}

.floating-pause-container {
  position: sticky;
  top: 20px;
  z-index: 100;
  margin-bottom: 20px;
}

.floating-pause-card {
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%) !important;
  border: 3px solid #ff9800 !important;
  border-radius: 12px !important;
}

.floating-end-card {
  background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%) !important;
  border: 3px solid #f44336 !important;
}

.pause-alert-text {
  display: flex;
  align-items: center;
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
}

.pattern-card {
  background: white !important;
  border: 2px solid #667eea !important;
}

.pattern-title {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: bold;
}

.card-selection-card {
  background: #1a1a2e !important;
  border: 2px solid #333 !important;
}

.card-selection-title {
  background: #16213e !important;
  color: white;
  font-size: 1.2rem;
  padding: 12px 16px;
  font-weight: bold;
  display: flex;
  align-items: center;
}

.registered-counter-ball {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: bold;
  color: white;
  background: linear-gradient(135deg, #f57c00 0%, #ef6c00 100%);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
  border: 6px solid white;
  animation: pulse 2s infinite;
}

.card-selection-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
  gap: 10px;
  padding: 12px;
  background: #0f0f1e;
  border-radius: 8px;
  width: 100%;
}

/* Responsive grid for different screen sizes */
@media (min-width: 1920px) {
  .card-selection-grid {
    grid-template-columns: repeat(20, 1fr);
    gap: 12px;
  }
}

@media (min-width: 1600px) and (max-width: 1919px) {
  .card-selection-grid {
    grid-template-columns: repeat(16, 1fr);
    gap: 10px;
  }
}

@media (min-width: 1200px) and (max-width: 1599px) {
  .card-selection-grid {
    grid-template-columns: repeat(13, 1fr);
    gap: 9px;
  }
}

@media (min-width: 900px) and (max-width: 1199px) {
  .card-selection-grid {
    grid-template-columns: repeat(10, 1fr);
    gap: 8px;
  }
}

@media (max-width: 899px) {
  .card-selection-grid {
    grid-template-columns: repeat(6, 1fr);
    gap: 8px;
  }
}

.card-number-cell {
  aspect-ratio: 1 / 1;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: bold;
  color: white;
  font-family: 'Courier New', monospace;
  background: linear-gradient(135deg, #7b1fa2 0%, #6a1b9a 100%);
  border: 2px solid rgba(123, 31, 162, 0.3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;

  &:hover {
    transform: scale(1.08);
    box-shadow: 0 4px 12px rgba(123, 31, 162, 0.6);
    border-color: rgba(123, 31, 162, 0.8);
    z-index: 2;
  }

  &.card-registered {
    background: linear-gradient(135deg, #d32f2f 0%, #c62828 100%);
    border-color: rgba(211, 47, 47, 0.5);
    animation: pulse-red 2s infinite;
  }

  &.card-selected {
    background: linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%);
    border-color: #e1bee7;
    box-shadow: 0 0 20px rgba(156, 39, 176, 0.8);
    z-index: 1;
  }
}

@media (min-width: 1600px) {
  .card-number-cell {
    font-size: 1.4rem;
  }
}

@media (max-width: 899px) {
  .card-number-cell {
    font-size: 0.9rem;
  }
}

@keyframes pulse-red {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.8;
  }
}

.card-selection-info {
  margin-top: 16px;
}

.reward-ball-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 20px;
}

.reward-label-text {
  font-size: 0.95rem;
  color: white;
  font-weight: 600;
  margin-bottom: 8px;
  text-align: center;
}

.reward-ball {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.2rem;
  font-weight: bold;
  color: white;
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
  border: 5px solid white;
  animation: pulse 2s infinite;
  margin: 6px 0;
}

.reward-currency {
  font-size: 1.1rem;
  color: #4caf50;
  font-weight: bold;
  margin-top: 6px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.reward-breakdown-text {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 8px;
  text-align: center;
}

.betting-modal-card {
  border-radius: 12px !important;
}

.betting-modal-title {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: bold;
  font-size: 1.3rem;
}

.betting-input {
  background: white !important;

  :deep(.v-field) {
    background: white !important;
  }

  :deep(.v-field__input) {
    background: white !important;
    color: #333 !important;
  }

  :deep(.v-field__outline) {
    color: #667eea !important;
  }
}

.card-details-card {
  overflow: hidden;
  background: #ffffff !important;
  border: 1px solid #d7dce5 !important;
  border-radius: 12px !important;
  box-shadow: 0 14px 36px rgba(27, 31, 59, 0.28) !important;

  :deep(.v-card-text) {
    background: #ffffff !important;
    color: #111827 !important;
  }
}

.card-detail-display {
  max-width: 380px;
  margin: 0 auto;
}

.detail-bingo-card {
  width: 100%;
  border-collapse: separate;
  border-spacing: 3px;
  background: #f1f3f7;
  border-radius: 8px;
  padding: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  .detail-card-cell {
    width: 48px;
    height: 48px;
    text-align: center;
    font-size: 1rem;
    font-weight: bold;
    background: #ffffff;
    color: #111827;
    border: 1px solid #c9ced6;
    border-radius: 7px;
    transition: all 0.3s;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

    &:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    }

    &.free-space {
      background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
      color: #111827;
      font-size: 1rem;
      font-weight: bold;
      border-color: #fbc02d;
    }

    &.called-marked {
      background: #ef4444;
      color: #ffffff;
      border-color: #b91c1c;
      box-shadow: 0 0 0 1px #ffffff, 0 3px 8px rgba(185, 28, 28, 0.35);
    }

    &.winning-marked {
      background: #22c55e;
      color: #ffffff;
      border-color: #15803d;
      box-shadow: 0 0 0 1px #ffffff, 0 0 12px rgba(34, 197, 94, 0.55);
    }
  }
}

.card-detail-close {
  margin: 0;
  color: #ffffff;
}

.card-detail-close-box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  background: #d32f2f;
}

.card-detail-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #111827;
}

.card-detail-number {
  font-size: 1.35rem;
  font-weight: 800;
}

.inline-fee-field {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid #e2e6eb;
}

.static-card-display {
  margin: 20px auto;
  max-width: 400px;
}

.bingo-card-header {
  display: flex;
  justify-content: space-around;
  margin-bottom: 8px;
  padding: 0 6px;

  .card-letter {
    width: 48px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
    font-weight: 800;
    color: #ffffff;
    background: linear-gradient(135deg, #7986cb 0%, #5c6bc0 100%);
    border-radius: 8px 8px 5px 5px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
}

.static-bingo-card {
  width: 100%;
  border-collapse: separate;
  border-spacing: 4px;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  .card-cell {
    width: 70px;
    height: 70px;
    text-align: center;
    font-size: 1.5rem;
    font-weight: bold;
    background: white;
    border: 2px solid #ddd;
    border-radius: 6px;
    transition: all 0.3s;

    &:hover {
      background: #f0f0f0;
      transform: scale(1.05);
    }

    &.free-space {
      background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
      color: #333;
      font-size: 1rem;
      font-weight: bold;
    }
  }
}

.card-info {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 16px;
}

.pattern-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 20px 0;
  padding: 16px;
  background: linear-gradient(145deg, #f8f9fa 0%, #ffffff 100%);
  border-radius: 16px;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.05);
}

.pattern-card-header {
  display: flex;
  justify-content: space-around;
  width: 100%;
  max-width: 280px;
  margin-bottom: 12px;
  gap: 4px;
}

.pattern-header-letter {
  width: 50px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  font-weight: 800;
  color: white;
  border-radius: 8px;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.2),
    inset 0 -2px 4px rgba(0, 0, 0, 0.15);
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 8px;
    left: 12px;
    width: 20px;
    height: 12px;
    background: radial-gradient(ellipse at center, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
    border-radius: 50%;
    transform: rotate(-45deg);
  }

  &.letter-b {
    background: linear-gradient(135deg, #2196f3 0%, #1565c0 100%);
  }

  &.letter-i {
    background: linear-gradient(135deg, #ef5350 0%, #c62828 100%);
  }

  &.letter-n {
    background: linear-gradient(135deg, #66bb6a 0%, #2e7d32 100%);
  }

  &.letter-g {
    background: linear-gradient(135deg, #ffa726 0%, #ef6c00 100%);
  }

  &.letter-o {
    background: linear-gradient(135deg, #ab47bc 0%, #6a1b9a 100%);
  }
}

.pattern-grid {
  border-collapse: separate;
  border-spacing: 4px;
  background: #1a1a2e;
  padding: 10px;
  border-radius: 12px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
}

.pattern-cell {
  width: 50px;
  height: 50px;
  text-align: center;
  font-size: 1.1rem;
  font-weight: 700;
  background: linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%);
  color: #666;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  &.pattern-active {
    background: linear-gradient(135deg, #66bb6a 0%, #43a047 100%);
    color: white;
    border-color: #2e7d32;
    box-shadow:
      0 4px 12px rgba(76, 175, 80, 0.5),
      0 0 0 2px rgba(255, 255, 255, 0.3);
    font-weight: 800;
    transform: scale(1.05);
  }

  &.pattern-free {
    background: linear-gradient(135deg, #ffd54f 0%, #ffca28 100%);
    color: #333;
    font-size: 0.75rem;
    font-weight: 800;
    border-color: #fbc02d;

    &.pattern-active {
      background: linear-gradient(135deg, #66bb6a 0%, #43a047 100%);
      color: white;
      border-color: #2e7d32;
    }
  }
}

.winning-pattern-card {
  background: linear-gradient(135deg, #fff9c4 0%, #fff59d 100%) !important;
  border: 3px solid #fbc02d !important;
}

.late-claim-card {
  background: linear-gradient(135deg, #ffcdd2 0%, #ef9a9a 100%) !important;
  border: 3px solid #d32f2f !important;
}

.winning-title {
  background: linear-gradient(135deg, #fbc02d 0%, #f9a825 100%);
  color: #333;
  font-weight: bold;
}

.late-claim-title {
  background: linear-gradient(135deg, #d32f2f 0%, #c62828 100%) !important;
  color: white !important;
}

.winning-grid {
  border-collapse: collapse;
  border: 3px solid #333;
  background: white;
  margin: 0 auto;
}

.winning-cell {
  width: 60px;
  height: 60px;
  border: 2px solid #333;
  text-align: center;
  font-size: 1.8rem;
  font-weight: bold;
  background: white;
  color: #999;

  &.winning-marked {
    background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
    color: white;
    font-size: 2rem;
  }

  &.free-space {
    background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
    color: #333;
    font-size: 1rem;
  }
}

.history-card {
  background: #0d1a29 !important;
  border: 2px solid #1b6c9e !important;
  border-radius: 5px !important;
  box-shadow: 0 10px 32px rgba(1, 8, 18, 0.58) !important;
}

.history-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: #101f31 !important;
  color: #e2edf8;
  min-height: 52px;
  padding: 8px 14px !important;
  border-bottom: 1px solid #215477;
}

.history-heading {
  display: flex;
  flex-direction: column;
  gap: 1px;
  line-height: 1.2;
}

.history-heading strong {
  color: #f4f9ff;
  font-size: 0.86rem;
  letter-spacing: 0.08em;
}

.history-kicker {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #51c8f7;
  font-size: 0.56rem;
  font-weight: 800;
  letter-spacing: 0.2em;
}

.history-heading-meta {
  display: flex;
  align-items: center;
  gap: 18px;
}

.history-game-status {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: #7cc5e3;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  white-space: nowrap;
}

.history-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #50d5eb;
  box-shadow: 0 0 0 3px rgba(80, 213, 235, 0.14), 0 0 10px rgba(80, 213, 235, 0.8);
}

.history-prize {
  color: #7aa8c4;
  font-size: 0.61rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  white-space: nowrap;
}

.history-content {
  background: #0d1a29;
  padding: 10px !important;
}

.history-board-scroll {
  overflow-x: auto;
  padding-bottom: 3px;
}

.history-board {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 820px;
  padding: 7px;
  background: #07111d;
  border: 1px solid #17354d;
  border-radius: 3px;
  box-shadow: inset 0 0 24px rgba(1, 7, 16, 0.8);
}

.history-row {
  display: grid;
  grid-template-columns: 34px repeat(15, minmax(0, 1fr));
  gap: 3px;
}

.history-letter,
.history-number {
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
  font-family: 'Courier New', monospace;
  font-weight: 800;
}

.history-letter {
  color: #a9d9ed;
  font-size: 1.1rem;
  background: #174b6b;
  text-shadow: 0 0 10px rgba(116, 217, 255, 0.4);
  border: 1px solid #2e86af;
}

.history-number {
  position: relative;
  min-width: 0;
  color: #46657b;
  background: #152334;
  border: 1px solid #1a3349;
  font-size: clamp(0.76rem, 1.4vw, 1rem);
  letter-spacing: 0.03em;
  transition: transform 0.18s ease, filter 0.18s ease, box-shadow 0.18s ease, color 0.18s ease;

  &.history-number--uncalled {
    background: #152334;
    color: #46657b;
  }

  &.history-number--called {
    color: #e8fbff;
    background: #1485bc;
    border-color: #42c7ef;
    text-shadow: 0 0 9px rgba(178, 244, 255, 0.85);
    box-shadow: inset 0 -3px 0 rgba(4, 62, 98, 0.35), 0 0 8px rgba(20, 133, 188, 0.45);
  }

  &.history-number--latest {
    z-index: 1;
    outline: 2px solid #77e5ff;
    outline-offset: 2px;
    box-shadow: 0 0 0 4px rgba(112, 215, 255, 0.2), 0 0 18px rgba(112, 215, 255, 0.85);
    animation: history-latest-pulse 1.8s ease-in-out infinite;
  }

  &:hover {
    transform: translateY(-1px);
    filter: brightness(1.2);
  }
}

@keyframes history-latest-pulse {

  0%,
  100% {
    filter: brightness(1);
  }

  50% {
    filter: brightness(1.35);
  }
}

.history-footer {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 10px 4px 2px;
  color: #7694aa;
  border-top: 1px solid #17354d;
}

.history-stat {
  display: flex;
  align-items: baseline;
  min-width: 82px;
  gap: 3px;
}

.history-stat-label,
.history-last-call>span {
  color: #54728b;
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.12em;
}

.history-stat strong {
  color: #d8f3ff;
  font-size: 1.3rem;
  line-height: 1;
}

.history-stat-total {
  color: #54728b;
  font-size: 0.8rem;
}

.history-progress-wrap {
  flex: 1;
  min-width: 130px;
}

.history-progress-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 0.65rem;
}

.history-progress-label strong {
  color: #61d8f7;
}

.history-progress-track {
  height: 6px;
  overflow: hidden;
  border-radius: 99px;
  background: #1a3247;
}

.history-progress-value {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #2b91c6, #48d7ec);
  box-shadow: 0 0 12px rgba(72, 215, 236, 0.5);
  transition: width 0.3s ease;
}

.history-legend {
  display: flex;
  gap: 12px;
  color: #5f7b91;
  font-size: 0.68rem;
  white-space: nowrap;
}

.history-legend span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.history-legend-dot {
  width: 8px;
  height: 8px;
  display: inline-block;
  border-radius: 50%;
}

.history-legend-dot--called {
  background: #37c9ed;
}

.history-legend-dot--available {
  background: #304a60;
}

.history-last-call {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  min-width: 74px;
}

.history-last-call strong {
  color: #d8f3ff;
  font-family: 'Courier New', monospace;
  font-size: 1.1rem;
}

.history-last-call strong.ball-b {
  color: #55b8ff;
}

.history-last-call strong.ball-i {
  color: #ff7c86;
}

.history-last-call strong.ball-n {
  color: #65dc96;
}

.history-last-call strong.ball-g {
  color: #ffc05e;
}

.history-last-call strong.ball-o {
  color: #c18ae9;
}

@media (max-width: 800px) {
  .history-title {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
  }

  .history-heading-meta {
    justify-content: space-between;
    width: 100%;
  }

  .history-footer {
    align-items: stretch;
    flex-wrap: wrap;
    gap: 14px;
  }

  .history-progress-wrap {
    order: 3;
    flex-basis: 100%;
  }
}

@media (max-width: 520px) {
  .history-content {
    padding: 10px !important;
  }

  .history-board {
    min-width: 690px;
    padding: 10px;
    gap: 5px;
  }

  .history-row {
    grid-template-columns: 34px repeat(15, minmax(0, 1fr));
    gap: 4px;
  }

  .history-letter,
  .history-number {
    min-height: 34px;
  }

  .history-letter {
    font-size: 0.95rem;
  }

  .history-footer {
    gap: 12px;
  }

  .history-legend {
    width: 100%;
    order: 4;
  }
}

.tv-bingo-board {
  position: relative;
  overflow: hidden;
}

.tv-grid-cell--shuffling {
  animation: history-cell-shuffle 260ms ease-in-out infinite alternate !important;
  will-change: transform, filter, background-color;
}

.tv-grid-cell--shuffle-active {
  background: #43a047 !important;
  border-color: #b8ffb8 !important;
  color: #ffffff !important;
  box-shadow: 0 0 18px rgba(76, 175, 80, 0.95) !important;
  transform: scale(1.18) !important;
  animation: history-cell-shuffle-active 180ms ease-in-out infinite alternate !important;
}

.tv-grid-row:nth-child(2) .tv-grid-cell--shuffling {
  animation-delay: 90ms;
}

.tv-grid-row:nth-child(3) .tv-grid-cell--shuffling {
  animation-delay: 180ms;
}

.tv-grid-row:nth-child(4) .tv-grid-cell--shuffling {
  animation-delay: 270ms;
}

.tv-grid-row:nth-child(5) .tv-grid-cell--shuffling {
  animation-delay: 360ms;
}

@keyframes history-cell-shuffle {
  from {
    transform: translateY(-3px) rotate(-1deg);
    filter: brightness(1);
  }

  to {
    transform: translateY(3px) rotate(1deg);
    filter: brightness(1.45);
  }
}

@keyframes history-cell-shuffle-active {
  from {
    filter: brightness(1);
  }

  to {
    filter: brightness(1.8);
  }
}

.loading-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* ========================================
   TV BOARD LAYOUT STYLES
   ======================================== */

/* TV Board Container */
.tv-bingo-board {
  background-color: #1a222a !important;
  color: #ffffff;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
}

.tv-board-main {
  display: flex;
  flex-direction: row;
  border-bottom: 2px solid #10161b;
}

/* Sidebar Strip */
.tv-bingo-sidebar {
  width: 50px;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  padding: 8px 0;
}

.tv-sidebar-letter {
  font-size: 28px;
  font-weight: 900;
  color: #c62828;
  line-height: 1;
}

/* Numbers Matrix Grid */
.tv-numbers-grid {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 8px;
  gap: 6px;
  background-color: #232b35;
}

.tv-grid-row {
  display: grid;
  grid-template-columns: repeat(15, 1fr);
  gap: 6px;
}

.tv-grid-cell {
  background-color: #2d3745;
  color: #606f7b;
  text-align: center;
  font-size: 22px;
  font-weight: 700;
  padding: 6px 0;
  border-radius: 3px;
  transition: all 0.3s ease;
}

.tv-cell--called {
  background-color: #ffffff !important;
  color: #1a222a !important;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
}

.tv-cell--latest {
  background-color: #4caf50 !important;
  color: #ffffff !important;
  box-shadow: 0 0 15px rgba(76, 175, 80, 0.9);
  animation: pulse-latest 1s ease-in-out infinite;
}

@keyframes pulse-latest {

  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.1);
  }
}

/* Progress Line Bar */
.tv-color-progress-bar {
  display: flex;
  height: 10px;
  width: 100%;
}

.bar-segment {
  transition: flex 0.3s ease;
}

.bar-blue {
  flex: 4;
  background-color: #0288d1;
}

.bar-green {
  flex: 4;
  background-color: #2e7d32;
}

.bar-yellow {
  flex: 2;
  background-color: #fbc02d;
}

/* Bottom Footer Bar */
.tv-board-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: #171d24;
  gap: 20px;
}

/* Current Ball Container */
.tv-current-ball-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

/* Current Ball Ring */
.tv-current-ball-ring {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  background-color: #cddc39;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4px solid #afb42b;
  box-shadow: 0 4px 12px rgba(205, 220, 57, 0.5);
}

.tv-current-ball-inner {
  width: 82px;
  height: 82px;
  background: #ffffff;
  border-radius: 50%;
  color: #000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.ball-letter-top {
  font-size: 14px;
  font-weight: 800;
  line-height: 1;
  color: #000;
}

.ball-number-main {
  font-size: 34px;
  font-weight: 900;
  line-height: 1;
  color: #000;
}

/* Last Calls Section */
.tv-last-calls-label {
  font-size: 10px;
  text-transform: uppercase;
  color: #8898aa;
  font-weight: 600;
}

.tv-recent-balls-row {
  display: flex;
  gap: 4px;
  align-items: center;
}

.recent-mini-ball {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* Control Stack */
.tv-center-controls {
  display: flex;
  align-items: center;
  justify-content: center;
}

.control-btn-stack {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 160px;
}

.control-btn-stack .v-btn {
  text-transform: none;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.tv-board-extra-controls {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 16px;
  min-width: 250px;
  max-width: 330px;
}

.tv-speed-control,
.tv-verify-control {
  width: 145px;
}

.tv-control-label {
  color: #78909c;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.tv-speed-value {
  color: #eceff1;
  font-size: 11px;
  text-align: center;
}

.tv-verify-control {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Circular Stat Counters */
.tv-stats-container {
  display: flex;
  align-items: center;
  gap: 16px;
}

.tv-stat-circle {
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.circle-green {
  width: 70px;
  height: 70px;
  background-color: #2e7d32;
  color: #fff;
}

.circle-orange {
  width: 70px;
  height: 70px;
  background-color: #e65100;
  color: #fff;
}

.circle-red-large {
  width: 110px;
  height: 110px;
  background-color: #e53935;
  border: 4px solid #ffffff;
  color: #fff;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  line-height: 1.2;
}

.stat-label {
  font-size: 10px;
  text-transform: uppercase;
  opacity: 0.9;
  margin-top: 2px;
}

.stat-label-top {
  font-size: 10px;
  text-transform: uppercase;
  opacity: 0.9;
  margin-bottom: 4px;
}

.stat-value-large {
  font-size: 30px;
  font-weight: 900;
  line-height: 1;
}

/* Responsive Adjustments for TV Board */
@media (max-width: 1200px) {
  .tv-grid-cell {
    font-size: 18px;
    padding: 4px 0;
  }

  .tv-sidebar-letter {
    font-size: 24px;
  }

  .tv-current-ball-ring {
    width: 90px;
    height: 90px;
  }

  .tv-current-ball-inner {
    width: 68px;
    height: 68px;
  }

  .ball-number-main {
    font-size: 28px;
  }

  .circle-red-large {
    width: 90px;
    height: 90px;
  }

  .stat-value-large {
    font-size: 24px;
  }
}

@media (max-width: 960px) {
  .tv-board-footer {
    flex-direction: column;
    gap: 16px;
  }

  .tv-stats-container {
    width: 100%;
    justify-content: space-around;
  }

  .control-btn-stack {
    width: 100%;
  }

  .tv-board-extra-controls {
    width: 100%;
    max-width: 100%;
  }
}

@media (max-width: 600px) {
  .pattern-settings-inner {
    padding: 14px 12px 16px;
  }

  .pattern-settings-heading,
  .pattern-settings-controls {
    align-items: stretch;
    flex-direction: column;
  }

  .pattern-settings-controls .v-select,
  .pattern-settings-controls .v-btn {
    width: 100%;
  }

  .header-pattern-preview .pattern-card-header {
    gap: 4px;
  }

  .header-pattern-preview .pattern-grid {
    border-spacing: 3px;
    padding: 4px;
  }

  .header-pattern-preview .pattern-cell {
    height: 52px;
    padding: 6px 2px;
    font-size: 0.78rem;
  }

  .tv-grid-cell {
    font-size: 14px;
    padding: 2px 0;
  }

  .tv-sidebar-letter {
    font-size: 20px;
  }

  .tv-bingo-sidebar {
    width: 40px;
  }

  .tv-grid-row {
    gap: 3px;
  }

  .tv-numbers-grid {
    gap: 3px;
    padding: 4px;
  }

  .tv-board-extra-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .tv-speed-control,
  .tv-verify-control {
    width: 100%;
  }
}

.bingo-room-terminal {
  background: #f5f6f8;
  min-height: 100vh;
}

.terminal-header {
  color: #fff;
  box-shadow: 0 2px 5px rgba(24, 31, 38, 0.2);
}

.terminal-header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 42px;
  padding: 0 24px;
  background: linear-gradient(105deg, #9d482b 0%, #b7662d 45%, #d8a911 100%);
}

.terminal-brand {
  display: inline-flex;
  align-items: center;
  border: 0;
  padding: 0;
  background: transparent;
  color: #fff;
  font: inherit;
  font-size: 0.92rem;
  font-weight: 800;
  cursor: pointer;
}

.terminal-brand-logo {
  width: 28px;
  height: 28px;
  margin-right: 7px;
  border-radius: 50%;
  object-fit: cover;
}

.terminal-header-actions {
  display: flex;
  align-items: center;
}

.terminal-user-name {
  margin: 0 6px 0 2px;
  color: #fff;
  font-size: 0.74rem;
  font-weight: 700;
}

.terminal-color-bar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  min-height: 24px;
  color: #fff;
}

.bar-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  color: inherit;
  font: inherit;
  min-width: 0;
}

.tab-black {
  background: #101114;
}

.tab-blue {
  background: #1f73be;
}

.tab-green {
  background: #258548;
}

.tab-yellow {
  background: #e3b313;
  color: #171717;
}

.tab-label {
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.terminal-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 6px;
  padding: 4px;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.terminal-content {
  max-width: 1440px;
  margin: 0 auto;
  padding: 28px 32px 44px;
}

.terminal-info-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  margin-bottom: 24px;
}

.info-box {
  min-height: 124px;
  padding: 18px 20px;
  border: 1px solid #d7dce2;
  border-radius: 5px;
  background: #fff;
  box-shadow: 0 2px 6px rgba(35, 45, 55, 0.08);
}

.info-label {
  color: #131313;
  font-size: 1rem;
  font-weight: 900;
  letter-spacing: 0.12em;
}

.bet-control-wrap {
  display: inline-flex;
  align-items: center;
  margin-top: 14px;
  overflow: hidden;
  border: 1px solid #c8ced5;
  border-radius: 4px;
  background: #eef0f2;
}

.bet-btn {
  width: 42px;
  height: 38px;
  border: 0;
  background: #d9dde1;
  color: #29313a;
  font-size: 1.3rem;
  cursor: pointer;
}

.bet-input-field {
  width: 72px;
  height: 38px;
  border: 0;
  border-right: 1px solid #c8ced5;
  border-left: 1px solid #c8ced5;
  background: #f8f9fa;
  color: #20252a;
  text-align: center;
  font-size: 1rem;
  font-weight: 700;
}

.bet-input-field:focus {
  outline: 2px solid #2378bd;
  outline-offset: -2px;
}

.game-number-val {
  margin: 8px 0 7px;
  color: #20252a;
  font-size: 1.25rem;
  font-weight: 800;
}

.login-badge-btn {
  min-width: 76px;
  font-weight: 700;
}

.wallet-status-banner {
  margin-top: 14px;
  padding: 10px;
  border-radius: 4px;
  background: #2e9b55;
  color: #fff;
  font-size: 1rem;
  font-weight: 800;
}

.card-grid-container {
  padding: 22px;
  border: 1px solid #d7dce2;
  border-radius: 5px;
  background: #fff;
  box-shadow: 0 2px 6px rgba(35, 45, 55, 0.08);
}

.cards-flex-wrap,
.cards-sub-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 2px;
}

.terminal-card-tile {
  flex: 1 0 72px;
  max-width: 92px;
  height: 48px;
  border: 1px solid #19713d;
  border-radius: 4px;
  background: #39a957;
  color: #fff;
  font-size: 1rem;
  font-weight: 800;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease;
}

.terminal-card-tile:hover {
  background: #268c43;
  transform: translateY(-1px);
}

.terminal-card-tile:focus-visible,
.terminal-start-btn:focus-visible,
.bet-btn:focus-visible,
.terminal-icon-btn:focus-visible {
  outline: 2px solid #1f73be;
  outline-offset: 1px;
}

.terminal-card-tile.tile-selected {
  background: #d32f2f;
  border-color: #a51f1f;
  box-shadow: inset 0 0 0 2px #8d1717;
}

.terminal-card-tile.tile-selected:hover {
  background: #b71c1c;
}

.cards-sub-row {
  margin-top: 16px;
}

.card-catalog-empty {
  padding: 32px 12px;
  color: #68717c;
  font-size: 0.9rem;
  font-weight: 700;
  text-align: center;
}

.tile-sub {
  max-width: 92px;
}

.card-range-summary {
  display: flex;
  justify-content: center;
  min-height: 26px;
  margin-top: 12px;
}

.range-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 56px;
  min-height: 24px;
  padding: 3px 12px;
  border: 1px solid #2c914a;
  border-radius: 12px;
  background: #39a957;
  color: #fff;
  font-size: 0.72rem;
  font-weight: 800;
  line-height: 1;
}

.terminal-start-btn {
  display: block;
  width: 100%;
  max-width: 620px;
  min-height: 52px;
  margin: 28px auto 0;
  border: 0;
  border-radius: 5px;
  background: #238747;
  color: #fff;
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  box-shadow: 0 3px 6px rgba(26, 91, 49, 0.25);
}

.terminal-start-btn:hover:not(:disabled) {
  background: #1c713b;
}

.terminal-start-btn:disabled {
  background: #aeb5bb;
  box-shadow: none;
  cursor: not-allowed;
}

@media (max-width: 700px) {
  .terminal-header-top {
    min-height: 38px;
    padding: 0 12px;
  }

  .terminal-brand {
    font-size: 0.78rem;
  }

  .terminal-user-name {
    display: none;
  }

  .terminal-color-bar {
    min-height: 22px;
  }

  .terminal-content {
    padding: 16px 12px 30px;
  }

  .terminal-info-grid {
    grid-template-columns: 1fr;
  }

  .terminal-card-tile {
    flex-basis: 54px;
    height: 42px;
  }
}
</style>
