<template>
          <!-- Static card library (master deck) -->
          <v-row class="mb-4">
            <v-col cols="12">
              <v-card class="modern-generation-card" elevation="0" color="indigo-lighten-5">
                <v-card-title class="d-flex align-center flex-wrap gap-2">
                  <v-icon color="indigo">mdi-library-shelves</v-icon>
                  <span class="text-h6 font-weight-bold">Static Card Library (Master Deck)</span>
                  <v-spacer />
                  <v-chip
                    :color="staticLibraryStatus?.complete ? 'success' : 'warning'"
                    variant="flat"
                    size="small"
                  >
                    {{ staticLibraryStatus?.total ?? 0 }}/400
                  </v-chip>
                </v-card-title>
                <v-card-text>
                  <p class="text-body-2 mb-3">
                    All rooms created with <strong>Static</strong> mode use these same 400 card patterns.
                    <strong>Automatic</strong> rooms get unique cards per room.
                  </p>
                  <v-alert
                    :type="staticLibraryStatus?.complete ? 'success' : 'warning'"
                    variant="tonal"
                    density="compact"
                    class="mb-3"
                  >
                    {{ staticLibraryStatus?.message || 'Loading static library status...' }}
                  </v-alert>
                  <v-progress-linear
                    v-if="cardGenProgress > 0"
                    :model-value="cardGenProgress"
                    color="indigo"
                    height="8"
                    rounded
                    class="mb-3"
                  />
                  <div class="d-flex flex-wrap gap-2">
                    <v-btn
                      color="indigo"
                      variant="elevated"
                      :loading="generatingStaticLibrary"
                      :disabled="staticLibraryStatus?.complete"
                      @click="generateStaticCardLibrary(false)"
                    >
                      <v-icon class="mr-1">mdi-plus-circle</v-icon>
                      Generate Static Library
                    </v-btn>
                    <v-btn
                      color="error"
                      variant="outlined"
                      :loading="generatingStaticLibrary"
                      @click="generateStaticCardLibrary(true)"
                    >
                      <v-icon class="mr-1">mdi-refresh</v-icon>
                      Reset Library
                    </v-btn>
                    <v-btn variant="text" @click="loadStaticLibraryStatus">
                      <v-icon class="mr-1">mdi-refresh</v-icon>
                      Refresh Status
                    </v-btn>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

<!-- Compact Room Selector & Stats -->
          <v-row>
            <v-col cols="12" lg="8">
              <v-card class="modern-card-selector" elevation="0">
                <v-card-title class="modern-card-header">
                  <div class="d-flex align-center">
                    <v-avatar color="primary" size="48" class="mr-3">
                      <v-icon color="white" size="24">mdi-door-open</v-icon>
                    </v-avatar>
                    <div>
                      <h3 class="text-h6 font-weight-bold mb-0">Select Room</h3>
                      <p class="text-caption text-grey mb-0">Choose a room to manage cards</p>
                    </div>
                  </div>
                </v-card-title>
                <v-card-text class="pa-6">
                  <v-select
                    v-model="selectedRoomForCardView"
                    :items="rooms"
                    item-title="name"
                    item-value="id"
                    label="Choose a room to manage cards"
                    variant="outlined"
                    density="comfortable"
                    @update:model-value="loadRoomCards"
                  >
                    <template v-slot:prepend-inner>
                      <v-icon color="primary">mdi-door</v-icon>
                    </template>
                  </v-select>

                  <v-row v-if="selectedRoomForCardView" class="mt-2">
                    <v-col cols="6" sm="3">
                      <v-card variant="tonal" color="primary" class="compact-stat-card">
                        <v-card-text class="pa-3 text-center">
                          <v-icon color="primary" size="small" class="mb-1">mdi-door</v-icon>
                          <div class="text-caption text-grey">Room</div>
                          <div class="text-subtitle-2 font-weight-bold">{{ selectedRoomName }}</div>
                          <v-chip
                            v-if="selectedRoomCardMode"
                            size="x-small"
                            :color="selectedRoomCardMode === 'static' ? 'indigo' : 'teal'"
                            class="mt-1"
                          >
                            {{ selectedRoomCardMode === 'static' ? 'STATIC' : 'AUTO' }}
                          </v-chip>
                        </v-card-text>
                      </v-card>
                    </v-col>
                    <v-col cols="6" sm="3">
                      <v-card variant="tonal" color="success" class="compact-stat-card">
                        <v-card-text class="pa-3 text-center">
                          <v-icon color="success" size="small" class="mb-1">mdi-cards</v-icon>
                          <div class="text-caption text-grey">Total</div>
                          <div class="text-subtitle-2 font-weight-bold">{{ roomCards.length }}/400</div>
                        </v-card-text>
                      </v-card>
                    </v-col>
                    <v-col cols="6" sm="3">
                      <v-card variant="tonal" color="info" class="compact-stat-card">
                        <v-card-text class="pa-3 text-center">
                          <v-icon color="info" size="small" class="mb-1">mdi-card-plus</v-icon>
                          <div class="text-caption text-grey">Available</div>
                          <div class="text-subtitle-2 font-weight-bold">{{ availableRoomCards }}</div>
                        </v-card-text>
                      </v-card>
                    </v-col>
                    <v-col cols="6" sm="3">
                      <v-card variant="tonal" color="warning" class="compact-stat-card">
                        <v-card-text class="pa-3 text-center">
                          <v-icon color="warning" size="small" class="mb-1">mdi-account-check</v-icon>
                          <div class="text-caption text-grey">Assigned</div>
                          <div class="text-subtitle-2 font-weight-bold">{{ assignedRoomCards }}</div>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>

                  <v-btn
                    v-if="selectedRoomForCardView"
                    color="info"
                    variant="outlined"
                    block
                    class="mt-4"
                    @click="loadRoomCards"
                  >
                    <v-icon class="mr-2" size="small">mdi-refresh</v-icon>
                    Refresh Cards
                  </v-btn>
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="12" lg="4">
              <v-card class="modern-guide-card" elevation="0">
                <v-card-title class="modern-card-header">
                  <div class="d-flex align-center">
                    <v-avatar color="info" size="48" class="mr-3">
                      <v-icon color="white" size="24">mdi-lightbulb-on</v-icon>
                    </v-avatar>
                    <div>
                      <h3 class="text-h6 font-weight-bold mb-0">Quick Guide</h3>
                      <p class="text-caption text-grey mb-0">How it works</p>
                    </div>
                  </div>
                </v-card-title>
                <v-card-text class="pa-4">
                  <div class="guide-step">
                    <v-chip size="x-small" color="success" class="mb-2">1</v-chip>
                    <div class="text-caption"><strong>Create Room</strong> - Cards auto-generated</div>
                  </div>
                  <div class="guide-step">
                    <v-chip size="x-small" color="primary" class="mb-2">2</v-chip>
                    <div class="text-caption"><strong>Generate/Copy</strong> - Create or copy cards</div>
                  </div>
                  <div class="guide-step">
                    <v-chip size="x-small" color="info" class="mb-2">3</v-chip>
                    <div class="text-caption"><strong>Assign Manager</strong> - ONE user manages room</div>
                  </div>
                  <div class="guide-step">
                    <v-chip size="x-small" color="warning" class="mb-2">4</v-chip>
                    <div class="text-caption"><strong>Distribute</strong> - Manager assigns to players</div>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <!-- Deck status -->
          <v-row v-if="selectedRoomForCardView && roomCardStatus" class="mt-4">
            <v-col cols="12">
              <v-alert
                v-if="roomCardStatus.deckStatus === 'complete'"
                type="success"
                variant="tonal"
                title="Complete deck"
              >
                This room has all 400 cards ready. Generate and copy are disabled.
              </v-alert>
              <v-alert
                v-else-if="roomCardStatus.deckStatus === 'incomplete'"
                type="warning"
                variant="tonal"
                title="Incomplete deck"
              >
                {{ roomCardStatus.missing }} card(s) missing ({{ roomCardStatus.total }}/400).
                Use generate or copy to fill missing slots.
              </v-alert>
              <v-alert
                v-else-if="roomCardStatus.deckStatus === 'empty'"
                type="info"
                variant="tonal"
                title="No cards"
              >
                This room has no cards yet. Generate or copy a deck to get started.
              </v-alert>
              <v-alert
                v-if="roomCardStatus.inUse"
                type="error"
                variant="tonal"
                class="mt-2"
                title="Cards in use"
              >
                {{ roomCardStatus.assigned }} assigned, {{ roomCardStatus.locked }} locked.
                Reset/generate/copy are blocked until cards are unassigned and unlocked.
              </v-alert>
              <v-progress-linear
                v-if="cardGenProgress > 0"
                :model-value="cardGenProgress"
                color="primary"
                height="8"
                rounded
                class="mt-3"
              />
            </v-col>
          </v-row>

          <!-- Tools: preview & export -->
          <v-row v-if="selectedRoomForCardView" class="mt-2">
            <v-col cols="12">
              <v-card variant="outlined" class="pa-4">
                <v-row align="center">
                  <v-col cols="12" sm="4">
                    <v-text-field
                      v-model.number="previewCardIndex"
                      label="Preview card #"
                      type="number"
                      min="1"
                      max="400"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="12" sm="8" class="d-flex flex-wrap gap-2">
                    <v-btn color="info" variant="tonal" @click="previewRoomCard">
                      <v-icon class="mr-1">mdi-eye</v-icon>
                      Preview Sample
                    </v-btn>
                    <v-btn
                      color="secondary"
                      variant="tonal"
                      :disabled="roomCards.length === 0"
                      @click="exportRoomCards"
                    >
                      <v-icon class="mr-1">mdi-download</v-icon>
                      Export CSV
                    </v-btn>
                  </v-col>
                </v-row>
              </v-card>
            </v-col>
          </v-row>

          <!-- Card Generation Options -->
          <v-row
            v-if="selectedRoomForCardView && roomCardStatus && roomCardStatus.total < 400"
            class="mt-4"
          >
            <v-col cols="12">
              <v-card class="modern-generation-card" elevation="0">
                <v-card-title class="modern-card-header">
                  <div class="d-flex align-center">
                    <v-avatar color="success" size="48" class="mr-3">
                      <v-icon color="white" size="24">mdi-cog</v-icon>
                    </v-avatar>
                    <div>
                      <h3 class="text-h6 font-weight-bold mb-0">Card Generation Options</h3>
                      <p class="text-caption text-grey mb-0">Generate or copy 400 cards for this room</p>
                    </div>
                  </div>
                </v-card-title>
                <v-card-text class="pa-6">
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-card class="compact-option-card" variant="outlined" hover>
                        <v-card-text class="pa-4">
                          <div class="d-flex align-center mb-3">
                            <v-avatar color="success" size="56" class="mr-3">
                              <v-icon size="28">mdi-cards-playing-outline</v-icon>
                            </v-avatar>
                            <div>
                              <h4 class="text-subtitle-1 font-weight-bold mb-1">Generate Unique Cards</h4>
                              <p class="text-caption text-grey mb-0">
                                Fill {{ roomCardStatus?.missing ?? 0 }} missing slot(s) only
                              </p>
                            </div>
                          </div>
                          <v-btn
                            color="success"
                            block
                            class="mb-2"
                            :disabled="!roomCardStatus?.canGenerate"
                            :loading="generatingRoomCards"
                            @click="generateCardsForRoom(false)"
                          >
                            <v-icon class="mr-2" size="small">mdi-plus-circle</v-icon>
                            {{ selectedRoomCardMode === 'static' ? 'Apply Static Deck' : 'Generate Missing Cards' }}
                          </v-btn>
                          <v-btn
                            color="error"
                            block
                            variant="outlined"
                            :disabled="!roomCardStatus?.canReset || roomCardStatus?.total === 0"
                            :loading="generatingRoomCards"
                            @click="generateCardsForRoom(true)"
                          >
                            <v-icon class="mr-2" size="small">mdi-refresh</v-icon>
                            Reset & Regenerate Deck
                          </v-btn>
                        </v-card-text>
                      </v-card>
                    </v-col>

                    <v-col cols="12" md="6">
                      <v-card class="compact-option-card" variant="outlined" hover>
                        <v-card-text class="pa-4">
                          <div class="d-flex align-center mb-3">
                            <v-avatar color="primary" size="56" class="mr-3">
                              <v-icon size="28">mdi-content-copy</v-icon>
                            </v-avatar>
                            <div>
                              <h4 class="text-subtitle-1 font-weight-bold mb-1">Copy from Room</h4>
                              <p class="text-caption text-grey mb-0">Use same patterns</p>
                            </div>
                          </div>
                          <v-select
                            v-model="selectedSourceRoom"
                            :items="roomsWithCards"
                            item-title="displayName"
                            item-value="id"
                            label="Select source room"
                            variant="outlined"
                            density="compact"
                            class="mb-2"
                          >
                            <template v-slot:prepend-inner>
                              <v-icon color="primary" size="small">mdi-door</v-icon>
                            </template>
                          </v-select>
                          <v-btn
                            color="primary"
                            block
                            @click="copyCardsFromRoom"
                            :disabled="!selectedSourceRoom || !roomCardStatus?.canCopy"
                            :loading="copyingCards"
                          >
                            <v-icon class="mr-2" size="small">mdi-content-copy</v-icon>
                            Copy Cards
                          </v-btn>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <!-- Cards Table - Compact -->
          <v-row v-if="selectedRoomForCardView" class="mt-4">
            <v-col cols="12">
              <v-card class="modern-table-card" elevation="0">
                <v-card-title class="modern-card-header d-flex align-center justify-space-between">
                  <div class="d-flex align-center">
                    <v-avatar color="primary" size="48" class="mr-3">
                      <v-icon color="white" size="24">mdi-view-list</v-icon>
                    </v-avatar>
                    <div>
                      <h3 class="text-h6 font-weight-bold mb-0">Cards for {{ selectedRoomName }}</h3>
                      <p class="text-caption text-grey mb-0">{{ filteredRoomCards.length }} cards</p>
                    </div>
                  </div>
                  <v-chip color="primary" variant="flat" size="small">
                    {{ filteredRoomCards.length }} / {{ roomCards.length }}
                  </v-chip>
                </v-card-title>
                <v-card-text class="pa-6">
                  <v-text-field
                    v-model="cardSearch"
                    label="Search Card Number"
                    variant="outlined"
                    density="compact"
                    clearable
                    class="mb-4"
                  >
                    <template v-slot:prepend-inner>
                      <v-icon color="primary" size="small">mdi-magnify</v-icon>
                    </template>
                  </v-text-field>

                  <v-table class="compact-cards-table" v-if="filteredRoomCards.length > 0">
                    <thead>
                      <tr>
                        <th>Card Number</th>
                        <th>Assigned To</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="card in paginatedRoomCards" :key="card.id">
                        <td>
                          <v-chip color="primary" size="small" variant="flat">
                            {{ card.cardNumber }}
                          </v-chip>
                        </td>
                        <td>
                          <v-chip v-if="card.assignedUser" color="success" size="small" variant="flat">
                            <v-icon size="x-small" class="mr-1">mdi-account</v-icon>
                            {{ card.assignedUser.username }}
                          </v-chip>
                          <v-chip v-else color="grey" size="small" variant="outlined">
                            Unassigned
                          </v-chip>
                        </td>
                        <td>
                          <v-chip 
                            :color="card.isLocked ? 'error' : 'success'" 
                            size="small"
                            variant="flat"
                          >
                            <v-icon size="x-small">{{ card.isLocked ? 'mdi-lock' : 'mdi-lock-open' }}</v-icon>
                          </v-chip>
                        </td>
                      </tr>
                    </tbody>
                  </v-table>

                  <v-pagination
                    v-if="totalRoomCardsPages > 1"
                    v-model="roomCardsPage"
                    :length="totalRoomCardsPages"
                    :total-visible="5"
                    class="mt-4"
                    size="small"
                    rounded="circle"
                  ></v-pagination>

                  <div v-else-if="roomCards.length === 0" class="empty-cards-state">
                    <v-icon size="60" color="grey-lighten-1">mdi-cards-outline</v-icon>
                    <h4 class="text-subtitle-1 mt-3 mb-2">No Cards Found</h4>
                    <p class="text-caption text-grey">Generate or copy cards to get started</p>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

    <!-- Card preview dialog -->
    <v-dialog v-model="showCardPreviewDialog" max-width="420">
      <v-card v-if="previewCardData">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2" color="primary">mdi-eye</v-icon>
          Preview: {{ previewCardData.cardNumber }}
        </v-card-title>
        <v-card-text>
          <div class="preview-bingo-grid">
            <div class="preview-header-row">
              <span v-for="letter in ['B', 'I', 'N', 'G', 'O']" :key="letter">{{ letter }}</span>
            </div>
            <div
              v-for="(row, rowIndex) in previewCardData.grid"
              :key="rowIndex"
              class="preview-row"
            >
              <span
                v-for="(cell, colIndex) in row"
                :key="colIndex"
                :class="{ 'free-cell': cell === 0 }"
              >
                {{ cell === 0 ? 'FREE' : cell }}
              </span>
            </div>
          </div>
          <p class="text-caption text-grey mt-3 mb-0">
            Sample only — not saved until you generate the deck.
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showCardPreviewDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
</template>


<script setup lang="ts">
import { computed } from 'vue';
import { useAdminDashboard } from '../../composables/useAdminDashboard';

const {
  assignedRoomCards,
  availableRoomCards,
  cardGenProgress,
  cardSearch,
  copyCardsFromRoom,
  copyingCards,
  exportRoomCards,
  filteredRoomCards,
  generateCardsForRoom,
  generateStaticCardLibrary,
  generatingRoomCards,
  generatingStaticLibrary,
  loadRoomCards,
  loadStaticLibraryStatus,
  staticLibraryStatus,
  paginatedRoomCards,
  previewCardData,
  previewCardIndex,
  previewRoomCard,
  roomCardStatus,
  roomCards,
  roomCardsPage,
  rooms,
  roomsWithCards,
  selectedRoomForCardView,
  selectedRoomName,
  selectedSourceRoom,
  showCardPreviewDialog,
  totalRoomCardsPages,
} = useAdminDashboard();

const selectedRoomCardMode = computed(() => {
  const room = rooms.value.find((r: { id: number }) => r.id === selectedRoomForCardView.value);
  return room?.cardMode ?? 'automatic';
});
</script>

<style scoped>
.preview-bingo-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preview-header-row,
.preview-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 4px;
  text-align: center;
  font-weight: 600;
}

.preview-header-row span {
  background: #4e73df;
  color: white;
  padding: 6px 0;
  border-radius: 4px;
  font-size: 0.75rem;
}

.preview-row span {
  background: #f0f2f5;
  padding: 8px 4px;
  border-radius: 4px;
  font-size: 0.8rem;
}

.preview-row .free-cell {
  background: #ffe082;
  font-weight: 700;
}
</style>
