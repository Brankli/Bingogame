<template>
  <div class="bingo-room" v-if="room">
    <!-- Header with Navigation -->
    <v-app-bar color="primary" dark elevation="4" class="room-header">
      <v-btn icon @click="goBack">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      
      <v-toolbar-title>
        <v-icon class="mr-2">mdi-cards</v-icon>
        {{ room.name || '75-Ball Bingo' }}
      </v-toolbar-title>

      <v-spacer></v-spacer>

      <v-chip class="mr-3" color="white" text-color="primary" v-if="user">
        <v-icon left small>mdi-account</v-icon>
        {{ user.username }}
      </v-chip>

      <v-btn icon @click="confirmLogout">
        <v-icon>mdi-logout</v-icon>
      </v-btn>
    </v-app-bar>

    <v-row class="room-content">
      <!-- Left Panel: Number Display & Controls -->
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
              <div
                v-for="num in calledNumbers.slice(-5).reverse()"
                :key="num"
                class="recent-ball"
                :class="getBallColor(num)"
              >
                {{ num }}
              </div>
            </div>

            <!-- Pattern Selection -->
            <v-select
              v-model="currentPattern"
              :items="patterns"
              label="Current Pattern"
              class="mt-4"
              v-if="canManageRoom"
              :disabled="gameStatus !== 'idle'"
            ></v-select>

            <v-chip class="mt-2" color="info" v-else>
              Pattern: {{ currentPattern }}
            </v-chip>

            <!-- Pattern Preview Toggle Button -->
            <v-btn
              v-if="canManageRoom"
              @click="showPatternPreview = !showPatternPreview"
              variant="outlined"
              size="small"
              class="mt-2"
              block
              color="primary"
            >
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
                      <td
                        v-for="col in 5"
                        :key="col"
                        class="pattern-cell"
                        :class="{ 
                          'pattern-active': isPatternCell(row - 1, col - 1, currentPattern),
                          'pattern-free': row === 3 && col === 3
                        }"
                      >
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
        <v-card class="mb-4">
          <v-card-title class="text-subtitle-1 bg-primary">
            <v-icon class="mr-2">mdi-volume-high</v-icon>
            Voice Settings
          </v-card-title>
          <v-card-text class="pa-3">
            <LanguageSelector 
              @language-changed="handleLanguageChange"
              class="mb-3"
            />
            <VolumeControl 
              @volume-changed="handleVolumeChange"
            />
          </v-card-text>
        </v-card>

        <!-- Admin Controls -->
        <v-card v-if="canManageRoom" class="mb-4">
          <v-card-title class="bg-error">
            <v-icon>mdi-cog</v-icon>
            Game Controls
          </v-card-title>
          <v-card-text>
            <!-- Calling Speed Control -->
            <v-card variant="tonal" color="info" class="mb-3" v-if="gameStatus !== 'idle'">
              <v-card-text class="pa-3">
                <div class="d-flex align-center justify-space-between mb-2">
                  <span class="text-subtitle-2 font-weight-bold">
                    <v-icon size="small" class="mr-1">mdi-speedometer</v-icon>
                    Calling Speed
                  </span>
                  <v-chip size="small" color="primary">
                    {{ callingSpeedLabel }}
                  </v-chip>
                </div>
                <v-slider
                  v-model="callingSpeed"
                  :min="1000"
                  :max="5000"
                  :step="500"
                  thumb-label="always"
                  color="primary"
                  @update:model-value="changeCallingSpeed"
                  :disabled="gameStatus !== 'playing'"
                >
                  <template v-slot:thumb-label="{ modelValue }">
                    {{ (modelValue / 1000).toFixed(1) }}s
                  </template>
                </v-slider>
                <div class="d-flex justify-space-between text-caption text-grey">
                  <span>Fast (1s)</span>
                  <span>Normal (3s)</span>
                  <span>Slow (5s)</span>
                </div>
              </v-card-text>
            </v-card>

            <v-btn
              color="success"
              block
              @click="startNewGame"
              :disabled="gameStatus === 'playing' || registeredCards.length === 0"
              class="mb-2"
            >
              <v-icon>mdi-play</v-icon>
              Start Game
            </v-btn>

            <v-btn
              color="warning"
              block
              @click="pauseGame"
              v-if="gameStatus === 'playing'"
              class="mb-2"
            >
              <v-icon>mdi-pause</v-icon>
              Pause (BINGO Called!)
            </v-btn>

            <v-btn
              color="primary"
              block
              @click="resumeGame"
              v-if="gameStatus === 'paused' && matchWinners.length === 0"
              class="mb-2"
            >
              <v-icon>mdi-play</v-icon>
              Resume
            </v-btn>

            <v-btn
              color="success"
              block
              @click="finishGame"
              v-if="gameStatus === 'paused' && matchWinners.length > 0"
              class="mb-2"
              size="large"
            >
              <v-icon>mdi-flag-checkered</v-icon>
              Finish Game ({{ matchWinners.length }} Winner{{ matchWinners.length > 1 ? 's' : '' }})
            </v-btn>

            <v-divider class="my-4"></v-divider>

            <v-btn
              color="error"
              block
              @click="resetGame"
              class="mb-2"
              :disabled="gameStatus === 'playing' && calledNumbers.length < 75"
            >
              <v-icon>mdi-refresh</v-icon>
              {{ gameStatus === 'idle' ? 'Reset Game' : 'Back to Card Selection' }}
            </v-btn>

            <v-divider class="my-4"></v-divider>

            <!-- Betting Configuration Button -->
            <v-btn
              color="primary"
              block
              @click="showBettingModal = true"
              v-if="gameStatus === 'idle'"
              class="mb-2"
            >
              <v-icon>mdi-currency-usd</v-icon>
              Betting Settings
            </v-btn>

            <v-btn
              color="deep-purple"
              block
              @click="openShuffleRing"
              v-if="gameStatus === 'idle'"
              class="mb-2"
            >
              <v-icon>mdi-atom-variant</v-icon>
              Shuffle 75 Balls
            </v-btn>

            <v-btn
              v-if="isAdmin"
              color="secondary"
              block
              @click="showUserManagement = !showUserManagement"
            >
              <v-icon>mdi-account-group</v-icon>
              {{ showUserManagement ? 'Hide' : 'Show' }} User Management
            </v-btn>
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
              <v-text-field
                v-model.number="betAmount"
                label="Bet Amount per Card (Birr)"
                type="number"
                variant="outlined"
                prepend-inner-icon="mdi-currency-usd"
                min="0"
                hint="Amount each player pays per card"
                persistent-hint
                class="mb-4 betting-input"
              ></v-text-field>

              <v-text-field
                v-model.number="houseFee"
                label="House Fee per Card (Birr)"
                type="number"
                variant="outlined"
                prepend-inner-icon="mdi-home"
                min="0"
                hint="Fee deducted per card"
                persistent-hint
                class="betting-input"
              ></v-text-field>

              <v-alert type="info" density="compact" class="mt-4">
                <strong>Current Settings:</strong><br>
                Bet: {{ betAmount }} Birr | Fee: {{ houseFee }} Birr
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

        <!-- Circular Shuffle Ring Modal -->
        <v-dialog v-model="showShuffleRingModal" max-width="650" class="shuffle-dialog">
          <div class="shuffle-ring-container">
            <div class="shuffle-ring-wrapper">
              <div class="shuffle-ring-boundary"></div>
              <div
                v-for="ball in ringBalls"
                :key="ball.number"
                class="ring-ball"
                :class="[getBallColor(ball.number), { moving: ringShuffleActive }]"
                :style="{
                  transform: `translate(${ball.x}px, ${ball.y}px)`,
                  transitionDuration: `${ball.duration}ms`,
                }"
              >
                {{ ball.number }}
              </div>
            </div>
            <div class="shuffle-actions">
              <v-btn 
                color="red-darken-2" 
                variant="elevated" 
                size="x-large" 
                @click="closeShuffleRing"
                prepend-icon="mdi-close-circle"
              >
                Close
              </v-btn>
              <v-btn 
                color="deep-purple" 
                variant="elevated" 
                size="x-large" 
                @click="startRingShuffleMotion(10000)"
                prepend-icon="mdi-shuffle-variant"
              >
                Shuffle Again
              </v-btn>
            </div>
          </div>
        </v-dialog>
      </v-col>

      <!-- Center Panel: Card Selection & Calling History -->
      <v-col cols="12" lg="9" md="8" class="right-panel">
        <!-- Floating Pause Button (when playing) -->
        <div v-if="canManageRoom && gameStatus === 'playing'" class="floating-pause-container">
          <v-card class="floating-pause-card" elevation="8">
            <v-card-text class="pa-4">
              <v-row align="center" no-gutters>
                <v-col class="grow">
                  <div class="pause-alert-text">
                    <v-icon color="warning" size="large" class="mr-2">mdi-alert-circle</v-icon>
                    <span><strong>Game in Progress!</strong> Click PAUSE when someone calls BINGO</span>
                  </div>
                </v-col>
                <v-col class="shrink ml-4">
                  <v-btn 
                    color="warning" 
                    variant="elevated" 
                    @click="pauseGame"
                    size="x-large"
                    class="pause-btn-prominent"
                  >
                    <v-icon class="mr-2" size="large">mdi-pause-circle</v-icon>
                    PAUSE
                  </v-btn>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </div>

        <!-- Floating Game Ended Button (when all numbers called) -->
        <div v-if="canManageRoom && calledNumbers.length >= 75 && gameStatus !== 'idle'" class="floating-pause-container">
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
                  <v-btn 
                    color="error" 
                    variant="elevated" 
                    @click="resetGame"
                    size="large"
                  >
                    <v-icon class="mr-2">mdi-refresh</v-icon>
                    New Game
                  </v-btn>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </div>
        <!-- Card Selection Grid - Only visible when game is idle -->
        <v-card class="card-selection-card mb-4" v-if="canManageRoom && gameStatus === 'idle'">
          <v-card-title class="card-selection-title">
            <v-icon class="mr-2">mdi-cards</v-icon>
            Card Selection & Registration
            <v-spacer></v-spacer>
            <!-- Ball-style counter -->
            <div class="registered-counter-ball">
              {{ registeredCards.length }}
            </div>
          </v-card-title>
          <v-card-text class="pa-4">
            <!-- Total Reward Display -->
            <div class="reward-ball-container mb-4">
              <div class="reward-label-text">Total Reward</div>
              <div class="reward-ball">
                {{ totalReward }}
              </div>
              <div class="reward-currency">Birr</div>
            </div>

            <!-- Card Selection Grid (like calling history) -->
            <div class="card-selection-grid">
              <div
                v-for="cardNum in totalCards"
                :key="cardNum"
                class="card-number-cell"
                :class="{
                  'card-registered': isCardRegistered(cardNum),
                  'card-selected': selectedCardForView === cardNum
                }"
                @click="toggleCardRegistration(cardNum)"
                @dblclick="viewCardDetails(cardNum)"
              >
                {{ cardNum }}
              </div>
            </div>
          </v-card-text>
        </v-card>

        <!-- Card Details Modal -->
        <v-dialog v-model="showCardDetailsModal" max-width="500">
          <v-card class="card-details-card">
            <v-card-title class="card-details-title">
              <v-icon class="mr-2">mdi-card-account-details</v-icon>
              Card #{{ selectedCardForView }}
              <v-spacer></v-spacer>
              <v-btn
                icon
                size="small"
                variant="text"
                @click="
                  showCardDetailsModal = false;
                  selectedCardForView = null;
                  selectedCardGrid = null;
                "
              >
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </v-card-title>
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
                      <td
                        v-for="col in 5"
                        :key="col"
                        class="detail-card-cell"
                        :class="{
                          'free-space': row === 3 && col === 3,
                          'winning-marked': isWinningPatternCell(row - 1, col - 1),
                        }"
                      >
                        <span v-if="row === 3 && col === 3">FREE</span>
                        <span v-else>{{ getCardCellValue(row - 1, col - 1) }}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div class="card-detail-info mt-3">
                  <v-chip color="indigo" variant="elevated">
                    Card #{{ selectedCardForView }}
                  </v-chip>
                  <v-chip
                    :color="isCardRegistered(selectedCardForView || 0) ? 'success' : 'grey'"
                    variant="elevated"
                  >
                    {{ isCardRegistered(selectedCardForView || 0) ? 'Registered' : 'Not Registered' }}
                  </v-chip>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-dialog>

        <!-- Calling History - Only visible when game is playing or paused -->
        <v-card class="history-card" v-if="gameStatus !== 'idle'">
          <v-card-title class="history-title">
            <v-icon class="mr-2">mdi-history</v-icon>
            Calling History ({{ calledNumbers.length }}/75 numbers)
            <v-spacer></v-spacer>
            <!-- Reward Info During Game -->
            <v-chip color="success" variant="elevated" size="large">
              <v-icon start>mdi-trophy</v-icon>
              Prize: {{ totalReward }} Birr
            </v-chip>
          </v-card-title>
          <v-card-text class="history-content">
            <div class="history-grid">
              <div
                v-for="num in 75"
                :key="num"
                class="history-number"
                :class="{
                  [getBallColor(num)]: isNumberCalled(num),
                  'uncalled': !isNumberCalled(num)
                }"
              >
                {{ num }}
              </div>
            </div>
          </v-card-text>
        </v-card>

        <!-- Verification Section - Below History Card -->
        <v-card class="verify-card mt-4" v-if="canManageRoom && gameStatus === 'paused'">
          <v-card-title class="verify-title">
            <v-icon class="mr-2">mdi-check-decagram</v-icon>
            Verify BINGO
          </v-card-title>
          <v-card-text class="pa-4">
            <v-text-field
              v-model="verifyCardNumber"
              label="Card Number"
              placeholder="Enter card number (e.g., 1 or CARD-001)"
              variant="outlined"
              density="comfortable"
              class="mb-3"
              prepend-inner-icon="mdi-card-account-details"
            ></v-text-field>

            <v-btn
              color="success"
              block
              size="large"
              @click="verifyWin"
              :loading="verifying"
              class="mb-3"
              elevation="2"
            >
              <v-icon class="mr-2">mdi-check-circle</v-icon>
              Verify Win
            </v-btn>

            <v-alert 
              v-if="verificationResult" 
              :type="verificationResult.isValid ? 'success' : 'error'" 
              variant="tonal"
              prominent
            >
              <template v-slot:prepend>
                <v-icon :icon="verificationResult.isValid ? 'mdi-trophy' : 'mdi-alert-circle'"></v-icon>
              </template>
              {{ verificationResult.message }}
            </v-alert>
          </v-card-text>
        </v-card>

        <!-- Winning Pattern Visualization (when valid win OR late claim) -->
        <v-card 
          class="winning-pattern-card mt-4" 
          :class="{ 'late-claim-card': verificationResult && verificationResult.lateClaim }"
          v-if="verificationResult && (verificationResult.isValid || verificationResult.lateClaim)"
        >
          <v-card-title class="winning-title" :class="{ 'late-claim-title': verificationResult.lateClaim }">
            <v-icon class="mr-2">{{ verificationResult.lateClaim ? 'mdi-clock-alert' : 'mdi-trophy' }}</v-icon>
            <span v-if="verificationResult.lateClaim" style="color: #d32f2f;">
              LATE CLAIM - Pattern Completed Earlier
            </span>
            <span v-else-if="verificationResult.patternNames && verificationResult.patternNames.length > 1">
              Winning Patterns ({{ verificationResult.patternNames.length }}): {{ verificationResult.patternNames.join(', ') }}
            </span>
            <span v-else-if="verificationResult.patternNames && verificationResult.patternNames.length === 1">
              Winning Pattern: {{ verificationResult.patternNames[0] }}
            </span>
            <span v-else>
              Winning Pattern - {{ activePattern.toUpperCase() }}
            </span>
          </v-card-title>
          <v-card-text class="pa-4">
            <v-alert 
              v-if="verificationResult.lateClaim" 
              type="error" 
              variant="tonal" 
              density="compact"
              class="mb-3"
            >
              <v-icon class="mr-2">mdi-alert-circle</v-icon>
              This pattern was completed earlier. You must call BINGO immediately when you win!
            </v-alert>
            <v-alert 
              v-else-if="verificationResult.patternNames && verificationResult.patternNames.length > 1" 
              type="success" 
              variant="tonal" 
              density="compact"
              class="mb-3"
            >
              <v-icon class="mr-2">mdi-star-circle</v-icon>
              This card matches {{ verificationResult.patternNames.length }} different winning patterns!
            </v-alert>
            <table class="winning-grid">
              <tbody>
                <tr v-for="row in 5" :key="row">
                  <td
                    v-for="col in 5"
                    :key="col"
                    class="winning-cell"
                    :class="{
                      'winning-marked': isWinningPatternCell(row - 1, col - 1),
                      'free-space': row === 3 && col === 3
                    }"
                  >
                    {{ row === 3 && col === 3 ? 'FREE' : getWinningCardCellValue(row - 1, col - 1) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </v-card-text>
        </v-card>

        <!-- User Management (Admin Only) -->
        <div v-if="isAdmin && showUserManagement" class="mt-4">
          <UserManagement
            :room-id="roomId"
            @cards-assigned="onCardsAssigned"
          />
        </div>
      </v-col>
    </v-row>

    <v-snackbar
      v-model="toast.show"
      :color="toast.color"
      location="top right"
      timeout="4500"
    >
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
    <v-progress-circular
      indeterminate
      color="primary"
      size="64"
    ></v-progress-circular>
    <p class="mt-4 text-white">Loading room...</p>
  </div>
</template>

<script setup lang="ts">
/* eslint-disable no-undef */
import { ref, computed, inject, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuth } from '@/store/auth';
import { useSocket } from '@/store/socket';
import { Services } from '@/services';
import UserManagement from '@/components/UserManagement.vue';
import LanguageSelector from '@/components/LanguageSelector.vue';
import VolumeControl from '@/components/VolumeControl.vue';
import { getAmharicAudioService } from '@/services/AmharicAudioService';
import {
  EXTRACTED_NUMBERS_EVENT,
  NEW_MATCH_STARTED_EVENT,
  ON_ENTER_ROOM_EVENT,
  ON_EXIT_ROOM_EVENT,
} from '../../../src/sockets/consts/sockets.const';

const route = useRoute();
const router = useRouter();
const auth = useAuth();
const socket = useSocket();
const services = inject<Services>('services');

const roomId = computed(() => +route.params.roomId);
const { user } = auth;
const { client } = socket;

const room = ref<any>(null);
const lastCalledNumber = ref<number>(0);
const calledNumbers = ref<number[]>([]);
const gameStatus = ref<'idle' | 'playing' | 'paused'>('idle');
const currentPattern = ref('horizontal');
const selectedPatternForMatch = ref('horizontal');
const showUserManagement = ref(false);
const showPatternPreview = ref(false); // Collapsed by default
const showLogoutDialog = ref(false);
const verifyCardNumber = ref('');
const verifying = ref(false);
const verificationResult = ref<any>(null);
const matchWinners = ref<Array<{ cardNumber: string; timestamp: Date; specialWin?: boolean }>>([]); // Track all winners for current match
const totalCards = ref(400); // Total number of cards available (400 cards)
const registeredCards = ref<number[]>([]); // Array of registered card numbers
const selectedCardForView = ref<number | null>(null); // Card selected for viewing details
const betAmount = ref(10); // Bet amount per card in Birr
const houseFee = ref(2); // House fee per card in Birr
const showBettingModal = ref(false); // Show/hide betting configuration modal
const selectedCardGrid = ref<number[][] | null>(null);

// Calling speed control
const callingSpeed = ref(3000); // Default 3 seconds
const callingSpeedLabel = computed(() => {
  const speed = callingSpeed.value / 1000;
  if (speed <= 1.5) return 'Very Fast';
  if (speed <= 2.5) return 'Fast';
  if (speed <= 3.5) return 'Normal';
  if (speed <= 4.5) return 'Slow';
  return 'Very Slow';
});
const canManageRoomByApi = ref(false);
const showCardDetailsModal = ref(false);
const showShuffleRingModal = ref(false);
type RingBall = { number: number; x: number; y: number; duration: number };
const ringBalls = ref<RingBall[]>([]);
const ringShuffleActive = ref(false);
let ringShuffleInterval: number | null = null;
let ringShuffleTimeout: number | null = null;
const toast = ref<{ show: boolean; message: string; color: string }>({
  show: false,
  message: '',
  color: 'info',
});

// Language and audio support
const currentLanguage = ref(localStorage.getItem('voiceLanguage') || 'en');
const amharicAudio = getAmharicAudioService();

const patterns = [
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

const canManageRoom = computed(() => {
  if (canManageRoomByApi.value) return true;
  if (!room.value || !user) return false;
  
  // Admin can manage any room
  if (user.role === 'admin') return true;
  
  // Owner can manage their room
  if (room.value.owner?.id === user.id) return true;
  
  // Check if user is assigned as manager
  if (room.value.managers) {
    return room.value.managers.some((m: any) => m.user.id === user.id);
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
  const totalFee = registeredCards.value.length * houseFee.value;
  return Math.max(0, totalBet - totalFee);
});

const prizePerWinner = computed(() => {
  const winnerCount = matchWinners.value.length;
  if (winnerCount === 0) return totalReward.value;
  return Math.floor(totalReward.value / winnerCount);
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

const isNumberCalled = (num: number): boolean => {
  return calledNumbers.value.includes(num);
};

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
      'Invalid win': 'winner-invalid',
      'Invalid claim': 'card-locked',
      'Late claim rejected': 'winner-invalid',
      'must call BINGO immediately': 'winner-invalid',
      'Starting new game': 'game-start',
      'Game started': 'game-start',
      'started successfully': 'game-start',
      'Good luck everyone': 'game-start',
      'Game paused': 'game-paused',
      'BINGO called': 'game-paused',
      'paused for BINGO': 'game-paused',
      'Game resumed': 'game-resumed',
      'Continuing to call': 'game-resumed',
      'Please register': 'please-wait',
      'Card locked': 'card-locked',
      'locked due to': 'card-locked',
      'card is now locked': 'card-locked',
      'valid': 'winner-valid',
      'Invalid': 'winner-invalid',
      'Failed to verify': 'try-again',
      'Failed to save': 'try-again',
      'Room loaded': 'new-game',
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
    if (message.toLowerCase().includes('failed') || message.toLowerCase().includes('error')) {
      console.log(`[Audio Debug] ✅ Playing Amharic try-again for: "${message}"`);
      await amharicAudio.playEvent('try-again');
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
  const message = lang === 'am' ? 'Language changed to Amharic' : 'Language changed to English';
  showToast(message, 'info');
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
    .map(([row, col]: [number, number]) => {
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

const randomPointInRing = (): { x: number; y: number } => {
  const radius = 210;
  const angle = Math.random() * Math.PI * 2;
  const distance = Math.sqrt(Math.random()) * radius;
  const centerOffset = 229;
  return {
    x: centerOffset + Math.cos(angle) * distance,
    y: centerOffset + Math.sin(angle) * distance,
  };
};

const initializeRingBalls = () => {
  ringBalls.value = Array.from({ length: 75 }, (_, idx) => {
    const point = randomPointInRing();
    return {
      number: idx + 1,
      x: point.x,
      y: point.y,
      duration: 320 + (idx % 8) * 35,
    };
  });
};

const shuffleRingPositions = () => {
  ringBalls.value = ringBalls.value.map((ball, index) => {
    const point = randomPointInRing();
    return {
      ...ball,
      x: point.x,
      y: point.y,
      duration: 250 + ((index + Math.floor(Math.random() * 10)) % 9) * 40,
    };
  });
};

const stopRingShuffleMotion = () => {
  ringShuffleActive.value = false;
  if (ringShuffleInterval !== null) {
    window.clearInterval(ringShuffleInterval);
    ringShuffleInterval = null;
  }
  if (ringShuffleTimeout !== null) {
    window.clearTimeout(ringShuffleTimeout);
    ringShuffleTimeout = null;
  }
};

const startRingShuffleMotion = (durationMs = 10000) => {
  if (ringBalls.value.length !== 75) {
    initializeRingBalls();
  }
  stopRingShuffleMotion();
  ringShuffleActive.value = true;
  
  // Play shuffle sound
  playShuffleSound();
  
  ringShuffleInterval = window.setInterval(shuffleRingPositions, 320);
  ringShuffleTimeout = window.setTimeout(() => {
    stopRingShuffleMotion();
  }, durationMs);
};

const playShuffleSound = () => {
  try {
    // Create a simple shuffle sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.3);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (error) {
    console.log('Audio not supported:', error);
  }
};

const openShuffleRing = () => {
  showShuffleRingModal.value = true;
  startRingShuffleMotion(10000);
};

const closeShuffleRing = () => {
  showShuffleRingModal.value = false;
  stopRingShuffleMotion();
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
    showToast('Only admin or assigned room manager can start a game.', 'warning');
    return;
  }
  if (registeredCards.value.length === 0) {
    const message = 'Please register at least one card before starting the game.';
    showToast(message, 'warning');
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
  showToast(startMessage, 'success');
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
    registeredCards: registeredCardNumbers,
  });
  
  // Check if socket is connected
  if (!client || !client.connected) {
    console.error('[Frontend] ❌ Socket not connected!');
    showToast('Connection error. Please refresh the page.', 'error');
    return;
  }
  
  console.log('[Frontend] ✅ Socket connected, emitting event...');
  
  client?.emit('new-match', {
    roomId: roomId.value,
    soldCards: registeredCards.value.length,
    houseFeePerCard: houseFee.value,
    registeredCards: registeredCardNumbers, // Send the actual card numbers
  }, (response: any) => {
    // Acknowledgment callback
    if (response?.error) {
      console.error('[Frontend] ❌ Server error:', response.error);
      showToast(`Error starting game: ${response.error}`, 'error');
    } else {
      console.log('[Frontend] ✅ Server acknowledged new-match event');
    }
  });
  gameStatus.value = 'playing';
  matchWinners.value = []; // Clear winners list for new game
  
  showToast(`Game started with ${registeredCards.value.length} registered cards!`, 'success');
};

const normalizeCardNumber = (raw: string): string => {
  const value = String(raw || '')
    .trim()
    .toUpperCase();
  if (!value) return '';
  
  // If it's already in the ROOM-CAR format (e.g., ROOM9-CAR0001), return as-is
  if (/^ROOM\d+-CAR\d+$/.test(value)) {
    return value;
  }
  
  // If it's in SOEMB-CA format (old format), return as-is
  if (value.startsWith('SOEMB-CA')) {
    return value;
  }
  
  // If it's just a number (e.g., "1", "11", "123")
  if (/^\d+$/.test(value)) {
    const num = parseInt(value, 10);
    const currentRoomId = room.value?.id || 0;
    return `ROOM${currentRoomId}-CAR${String(num).padStart(4, '0')}`;
  }
  
  // If it starts with CARD- (e.g., "CARD-001", "CARD-1")
  if (value.startsWith('CARD-')) {
    const suffix = value.slice(5);
    if (/^\d+$/.test(suffix)) {
      const num = parseInt(suffix, 10);
      const currentRoomId = room.value?.id || 0;
      return `ROOM${currentRoomId}-CAR${String(num).padStart(4, '0')}`;
    }
  }
  
  // Default: try to extract number and convert
  const match = value.match(/\d+/);
  if (match) {
    const num = parseInt(match[0], 10);
    const currentRoomId = room.value?.id || 0;
    return `ROOM${currentRoomId}-CAR${String(num).padStart(4, '0')}`;
  }
  
  // If all else fails, return as-is
  return value;
};

const pauseGame = () => {
  if (!canManageRoom.value) {
    showToast('Only admin or assigned room manager can pause a game.', 'warning');
    return;
  }
  
  console.log('[PAUSE] ========== PAUSE GAME CLICKED ==========');
  console.log('[PAUSE] Match ID:', room.value?.currentMatch?.id);
  console.log('[PAUSE] Room ID:', roomId.value);
  console.log('[PAUSE] Socket connected:', client?.connected);
  console.log('[PAUSE] Emitting pause-match event...');
  
  client?.emit('pause-match', { 
    matchId: room.value?.currentMatch?.id,
    roomId: roomId.value 
  });
  
  gameStatus.value = 'paused';
  console.log('[PAUSE] ✅ Game status set to paused');
  
  // Announce pause
  speakMessage('Game paused. BINGO called!');
};

const resumeGame = () => {
  if (!canManageRoom.value) {
    showToast('Only admin or assigned room manager can resume a game.', 'warning');
    return;
  }
  client?.emit('play-match', {
    matchId: room.value?.currentMatch?.id,
    roomId: roomId.value,
  });
  gameStatus.value = 'playing';
  
  // Announce resume
  speakMessage('Game resumed. Continuing to call numbers.');
};

const changeCallingSpeed = (newSpeed: number) => {
  if (!canManageRoom.value) {
    showToast('Only admin or assigned room manager can change speed.', 'warning');
    return;
  }
  
  if (gameStatus.value !== 'playing') {
    return;
  }
  
  client?.emit('change-speed', {
    matchId: room.value?.currentMatch?.id,
    roomId: roomId.value,
    speed: newSpeed,
  });
  
  const speedLabel = callingSpeedLabel.value;
  showToast(`Calling speed changed to ${speedLabel} (${(newSpeed / 1000).toFixed(1)}s)`, 'info');
};

const finishGame = () => {
  if (!canManageRoom.value) {
    showToast('Only admin or assigned room manager can finish a game.', 'warning');
    return;
  }
  
  if (matchWinners.value.length === 0) {
    showToast('No winners verified yet.', 'warning');
    return;
  }
  
  // END THE GAME - All winners verified!
  gameStatus.value = 'idle';
  
  // Announce game end with winner celebration
  const winnerCount = matchWinners.value.length;
  if (winnerCount === 1) {
    speakMessage(`Congratulations to our winner! Game complete.`);
  } else {
    speakMessage(`Congratulations to all ${winnerCount} winners! Game complete.`);
  }
  
  // Show game ended message
  const winnersList = matchWinners.value.map(w => w.cardNumber).join(', ');
  const gameEndMessage = `🎉 Game Over! Winners (${matchWinners.value.length}): ${winnersList}`;
  showToast(gameEndMessage, 'success');
  speakMessage(`Game ended. ${matchWinners.value.length} winner${matchWinners.value.length > 1 ? 's' : ''} verified!`);
  
  // Emit game end event to backend
  if (room.value?.currentMatch?.id) {
    client?.emit('end-match', {
      matchId: room.value.currentMatch.id,
      roomId: roomId.value,
      winners: matchWinners.value
    });
  }
};

const resetGame = () => {
  if (!canManageRoom.value) {
    showToast('Only admin or assigned room manager can reset a game.', 'warning');
    return;
  }
  
  // Emit reset event to backend
  if (room.value?.currentMatch?.id) {
    client?.emit('reset-match', {
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
    
    verificationResult.value = response?.data;
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
      // Add winner to the list
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
        
        const successMessage = `Card ${normalizedCardNumber} wins with ${patternTitle}${winnerInfo}. ${patternDetails ? `Pattern: ${patternDetails}` : ''}`.trim();
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
      const unregisteredMessage = `❌ UNREGISTERED CARD! ${response?.data.message || 'This card was not registered for this game.'}`;
      showToast(unregisteredMessage, 'error');
      speakMessage(`Card not registered. Only registered cards can win.`);
      
      // Do NOT lock the card, just reject the verification
      // Auto-resume if no valid winners exist
      if (matchWinners.value.length === 0) {
        showToast('Game resuming automatically...', 'info');
        setTimeout(() => resumeGame(), 2000);
      }
    } else if (response?.data.cardLocked) {
      // Card is locked from previous wrong claim
      const lockedMessage = `Card ${normalizedCardNumber} is locked due to a previous wrong claim.`;
      showToast(lockedMessage, 'error');
      speakMessage(`Invalid claim. ${normalizedCardNumber} is locked.`);
      
      // Auto-resume if no valid winners exist
      if (matchWinners.value.length === 0) {
        showToast('Game resuming automatically...', 'info');
        setTimeout(() => resumeGame(), 1500);
      }
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
        
        // Play late claim audio (Amharic toast)
        if (currentLanguage.value === 'am') {
          try {
            await amharicAudio.playToast('winner-late');
            console.log('[Audio Debug] ✅ Played late claim toast audio');
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
        
        // Only resume game if NO winners have been verified yet
        // If there are already winners, the game should stay paused
        if (matchWinners.value.length === 0) {
          showToast('Game resuming automatically...', 'info');
          setTimeout(() => resumeGame(), 1500);
        } else {
          showToast('Invalid claim. Game remains paused because valid winners exist.', 'info');
        }
      }
    }
  } catch (error) {
    console.error('Error verifying win:', error);
    const message = 'Failed to verify win. Please try again.';
    showToast(message, 'error');
    speakMessage(message);
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
    speakMessage('Failed to save betting settings.');
  }
};

// Reusable function to load/refresh room data
const loadRoomData = async () => {
  try {
    const response = await services?.roomService.show(roomId.value);
    room.value = response?.data;
    betAmount.value = Number(room.value?.ticketPrice || 0);
    
    const permission = await services?.roomService.canManageRoom(roomId.value);
    canManageRoomByApi.value = Boolean(permission?.data?.canManage);
  } catch (error) {
    console.error('Error loading room data:', error);
  }
};

const getPatternCoordinates = (pattern: string) => {
  const patterns: { [key: string]: number[][] } = {
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
  return patternCoords.some(coords => 
    coords.some(([r, c]) => r === row && c === col)
  );
};

const isWinningPatternCell = (row: number, col: number) => {
  if (!verificationResult.value) return false;
  
  // Check all winning patterns if available
  const winningPatterns = verificationResult.value.winningPatterns;
  if (Array.isArray(winningPatterns) && winningPatterns.length > 0) {
    // Check if this cell is in ANY of the winning patterns
    return winningPatterns.some(pattern => 
      pattern.some(([r, c]) => r === row && c === col)
    );
  }
  
  // Fallback to single pattern
  const winningPattern = verificationResult.value.winningPattern;
  if (!winningPattern) return false;
  return winningPattern.some(([r, c]) => r === row && c === col);
};

onMounted(async () => {
  initializeRingBalls();
  
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
        calledNumbers.value = room.value.currentMatch.matchNumbers.map((mn: any) => mn.number);
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

    // Connect to socket AFTER room is loaded
    client?.emit(ON_ENTER_ROOM_EVENT, { roomId: roomId.value });
    
    // Monitor socket connection status
    console.log('[Socket] Connection status:', client?.connected ? 'CONNECTED ✅' : 'DISCONNECTED ❌');
    
    client?.on('connect', () => {
      console.log('[Socket] ✅ Connected to server');
      showToast('Connected to game server', 'success');
      // Rejoin room after reconnection
      client?.emit(ON_ENTER_ROOM_EVENT, { roomId: roomId.value });
    });
    
    client?.on('disconnect', (reason) => {
      console.log('[Socket] ❌ Disconnected from server. Reason:', reason);
      showToast('Disconnected from server. Reconnecting...', 'warning');
    });
    
    client?.on('connect_error', (error) => {
      console.error('[Socket] ❌ Connection error:', error);
      showToast('Connection error. Please check your internet.', 'error');
    });

    // Setup socket listeners
    client?.on(EXTRACTED_NUMBERS_EVENT, ({ number }) => {
      if (calledNumbers.value.includes(number)) {
        return;
      }
      lastCalledNumber.value = number;
      calledNumbers.value.push(number);
      
      // Announce number in selected language
      const letter = getBallLetter(number);
      announceNumber(letter, number);
    });

    client?.on(NEW_MATCH_STARTED_EVENT, ({ room: updatedRoom }) => {
      room.value = {
        ...room.value,
        ...updatedRoom,
        managers: updatedRoom?.managers ?? room.value?.managers ?? [],
      };
      calledNumbers.value = [];
      lastCalledNumber.value = 0;
      gameStatus.value = 'playing';
      matchWinners.value = []; // Clear winners for new match
      selectedPatternForMatch.value = currentPattern.value;
    });

    client?.on('match-paused', ({ matchId }) => {
      console.log('Match paused:', matchId);
      gameStatus.value = 'paused';
    });

    client?.on('match-reset', () => {
      console.log('Match reset');
      // Clear all state immediately
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
    });
  } catch (error) {
    console.error('Error loading room:', error);
    showToast('Failed to load room. Please try again.', 'error');
  }
});

// Cleanup when leaving the room
onBeforeUnmount(() => {
  stopRingShuffleMotion();
  // Remove all socket listeners
  client?.off(EXTRACTED_NUMBERS_EVENT);
  client?.off(NEW_MATCH_STARTED_EVENT);
  client?.off('match-paused');
  client?.off('match-reset');
  
  // Leave the room
  client?.emit(ON_EXIT_ROOM_EVENT, { roomId: roomId.value });
  
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
  display: block !important;
}

.right-panel {
  display: block !important;
}

.info-card {
  background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%) !important;
  border-radius: 16px !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
  border: 1px solid rgba(255, 255, 255, 0.8) !important;
}

.info-card-title {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  color: white !important;
  padding: 20px !important;
  border-radius: 16px 16px 0 0 !important;
  
  h2 {
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: 0.5px;
    margin: 0;
  }
}

.current-ball {
  margin: 24px auto;
  padding: 16px;
  background: linear-gradient(145deg, #f8f9fa 0%, #ffffff 100%);
  border-radius: 20px;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.05);
}

.ball-display {
  width: 160px;
  height: 160px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 4.5rem;
  font-weight: 800;
  color: white;
  margin: 0 auto;
  box-shadow: 
    0 12px 28px rgba(0, 0, 0, 0.25),
    0 0 0 8px rgba(255, 255, 255, 0.9),
    inset 0 -8px 16px rgba(0, 0, 0, 0.15);
  border: none;
  animation: pulse 2s infinite;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 15%;
    left: 20%;
    width: 40%;
    height: 30%;
    background: radial-gradient(ellipse at center, rgba(255, 255, 255, 0.4) 0%, transparent 70%);
    border-radius: 50%;
    transform: rotate(-45deg);
  }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); box-shadow: 0 12px 28px rgba(0, 0, 0, 0.25), 0 0 0 8px rgba(255, 255, 255, 0.9), inset 0 -8px 16px rgba(0, 0, 0, 0.15); }
  50% { transform: scale(1.05); box-shadow: 0 16px 36px rgba(0, 0, 0, 0.3), 0 0 0 10px rgba(255, 255, 255, 0.95), inset 0 -10px 20px rgba(0, 0, 0, 0.2); }
}

.ball-letter {
  font-size: 2rem;
  font-weight: 800;
  margin-top: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: none;
  letter-spacing: 2px;
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
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 20px;
  padding: 12px;
  background: linear-gradient(145deg, #f8f9fa 0%, #ffffff 100%);
  border-radius: 16px;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.05);
}

.recent-ball {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  font-weight: 800;
  color: white;
  box-shadow: 
    0 6px 16px rgba(0, 0, 0, 0.2),
    0 0 0 4px rgba(255, 255, 255, 0.9),
    inset 0 -4px 8px rgba(0, 0, 0, 0.15);
  border: none;
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
  0%, 100% {
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
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
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
  background: white !important;
  border: 2px solid #7b1fa2 !important;
}

.card-details-title {
  background: linear-gradient(135deg, #7b1fa2 0%, #6a1b9a 100%);
  color: white;
  font-weight: bold;
}

.card-detail-display {
  max-width: 380px;
  margin: 0 auto;
}

.detail-bingo-card {
  width: 100%;
  border-collapse: separate;
  border-spacing: 3px;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  
  .detail-card-cell {
    width: 48px;
    height: 48px;
    text-align: center;
    font-size: 1rem;
    font-weight: bold;
    background: linear-gradient(135deg, #7b1fa2 0%, #6a1b9a 100%);
    color: white;
    border: 2px solid #6a1b9a;
    border-radius: 6px;
    transition: all 0.3s;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    
    &:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    }
    
    &.free-space {
      background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
      color: #333;
      font-size: 1rem;
      font-weight: bold;
      border-color: #fbc02d;
    }

    &.winning-marked {
      background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
      border-color: #2e7d32;
      box-shadow: 0 0 12px rgba(76, 175, 80, 0.8);
    }
  }
}

.card-detail-info {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.static-card-display {
  margin: 20px auto;
  max-width: 400px;
}

.bingo-card-header {
  display: flex;
  justify-content: space-around;
  margin-bottom: 8px;
  
  .card-letter {
    width: 48px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
    font-weight: bold;
    color: white;
    background: linear-gradient(135deg, #7986cb 0%, #5c6bc0 100%);
    border-radius: 8px;
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
  background: #1a1a2e !important;
  border: 2px solid #333 !important;
}

.history-title {
  background: #16213e !important;
  color: white;
  font-size: 1.2rem;
  padding: 12px 16px;
}

.history-content {
  background: #1a1a2e;
  padding: 16px !important;
}

.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
  padding: 8px;
  background: #0f0f1e;
  border-radius: 8px;
}

.history-number {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  font-weight: bold;
  color: white;
  font-family: 'Courier New', monospace;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  border: 2px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s;
  
  &.uncalled {
    background: #2a2a3e;
    color: #555;
    border-color: #333;
  }
  
  &:hover {
    transform: scale(1.05);
  }
}

.shuffle-dialog {
  background: transparent !important;
}

.shuffle-dialog .v-overlay__content {
  background: rgba(14, 18, 32, 0.95) !important;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.8);
}

.shuffle-ring-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
}

.shuffle-ring-wrapper {
  position: relative;
  width: 500px;
  height: 500px;
}

.shuffle-ring-boundary {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 8px solid #c5cae9;
  box-shadow:
    0 0 0 6px rgba(63, 81, 181, 0.35),
    inset 0 0 48px rgba(255, 255, 255, 0.15),
    0 8px 32px rgba(0, 0, 0, 0.5);
  background: radial-gradient(circle at center, rgba(255, 255, 255, 0.08) 0%, rgba(8, 10, 25, 0.92) 78%);
}

.ring-ball {
  position: absolute;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 700;
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  transition-property: transform;
  transition-timing-function: ease-in-out;
}

.ring-ball.moving {
  animation: ringBallPulse 0.8s ease-in-out infinite;
}

@keyframes ringBallPulse {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.25); }
}

.shuffle-actions {
  display: flex;
  gap: 24px;
  justify-content: center;
  width: 100%;
  margin-top: 8px;
}

.shuffle-actions .v-btn {
  min-width: 180px;
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0.5px;
  font-size: 1.1rem;
  padding: 12px 24px;
}

.loading-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
</style>
