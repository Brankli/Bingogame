<template>
  <v-card class="user-management">
    <v-card-title class="management-title">
      <v-icon class="mr-2">mdi-account-group</v-icon>
      User & Card Management
    </v-card-title>

    <v-card-text>
      <v-tabs v-model="tab" bg-color="primary">
        <v-tab value="cards">Card Grid</v-tab>
        <v-tab value="generate">Generate Cards</v-tab>
      </v-tabs>

      <v-window v-model="tab" class="mt-4">
        <!-- Card Grid Tab -->
        <v-window-item value="cards">
          <CardGrid
            :cards="allCards"
            @cards-selected="onCardSelected"
          />
        </v-window-item>

        <!-- Generate Cards Tab -->
        <v-window-item value="generate">
          <v-row>
            <v-col cols="12" md="6">
              <v-card variant="outlined">
                <v-card-title>Assign Card to Player</v-card-title>
                <v-card-text>
                  <v-autocomplete
                    v-model="selectedUser"
                    :items="users"
                    item-title="username"
                    item-value="id"
                    label="Select Player"
                    prepend-icon="mdi-account"
                    variant="outlined"
                    class="mb-4"
                  ></v-autocomplete>

                  <v-autocomplete
                    v-model="selectedCard"
                    :items="availableCards"
                    item-title="cardNumber"
                    item-value="cardNumber"
                    label="Select Card"
                    prepend-icon="mdi-card-text"
                    variant="outlined"
                    class="mb-4"
                  ></v-autocomplete>

                  <v-btn
                    color="primary"
                    block
                    @click="assignCard"
                    :disabled="!selectedUser || !selectedCard"
                  >
                    <v-icon class="mr-2">mdi-link</v-icon>
                    Assign Card
                  </v-btn>
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="12" md="6">
              <v-card variant="outlined">
                <v-card-title>Quick Actions</v-card-title>
                <v-card-text>
                  <v-btn
                    color="success"
                    block
                    class="mb-2"
                    @click="generateAllCards"
                    :loading="generating"
                  >
                    <v-icon class="mr-2">mdi-cards-playing-outline</v-icon>
                    Generate 400 Cards
                  </v-btn>

                  <v-btn
                    color="info"
                    block
                    class="mb-2"
                    @click="loadData"
                  >
                    <v-icon class="mr-2">mdi-refresh</v-icon>
                    Refresh Data
                  </v-btn>

                  <v-alert type="info" variant="tonal" class="mt-4">
                    <strong>Total Cards:</strong> {{ allCards.length }}/400<br>
                    <strong>Available:</strong> {{ availableCards.length }}<br>
                    <strong>Assigned:</strong> {{ assignedCards.length }}
                  </v-alert>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-window-item>

        <!-- Players Tab -->
        <v-window-item value="players">
          <v-text-field
            v-model="searchPlayer"
            label="Search Player"
            prepend-icon="mdi-magnify"
            variant="outlined"
            clearable
            class="mb-4"
          ></v-text-field>

          <v-list>
            <v-list-item
              v-for="user in filteredUsers"
              :key="user.id"
              class="player-item"
            >
              <template v-slot:prepend>
                <v-avatar color="primary">
                  <v-icon>mdi-account</v-icon>
                </v-avatar>
              </template>

              <v-list-item-title>{{ user.username }}</v-list-item-title>
              <v-list-item-subtitle>
                Cards: {{ getUserCards(user.id).length }}
              </v-list-item-subtitle>

              <template v-slot:append>
                <v-chip
                  v-for="card in getUserCards(user.id)"
                  :key="card.id"
                  class="mr-1"
                  color="success"
                  size="small"
                  closable
                  @click:close="unassignCard(card.cardNumber)"
                >
                  {{ card.cardNumber }}
                </v-chip>
              </template>
            </v-list-item>
          </v-list>
        </v-window-item>

        <!-- All Cards Tab -->
        <v-window-item value="cards">
          <v-text-field
            v-model="searchCard"
            label="Search Card"
            prepend-icon="mdi-magnify"
            variant="outlined"
            clearable
            class="mb-4"
          ></v-text-field>

          <v-data-table
            :headers="cardHeaders"
            :items="filteredCards"
            :items-per-page="10"
            class="elevation-1"
          >
            <template v-slot:[`item.cardNumber`]="{ item }">
              <v-chip color="primary" size="small">
                {{ item.cardNumber }}
              </v-chip>
            </template>

            <template v-slot:[`item.assignedUser`]="{ item }">
              <v-chip v-if="item.assignedUser" color="success" size="small">
                {{ item.assignedUser.username }}
              </v-chip>
              <v-chip v-else color="grey" size="small">
                Unassigned
              </v-chip>
            </template>

            <template v-slot:[`item.isLocked`]="{ item }">
              <v-icon v-if="item.isLocked" color="error">mdi-lock</v-icon>
              <v-icon v-else color="success">mdi-lock-open</v-icon>
            </template>

            <template v-slot:[`item.actions`]="{ item }">
              <v-btn
                icon
                size="small"
                color="primary"
                @click="viewCard(item)"
                class="mr-1"
              >
                <v-icon>mdi-eye</v-icon>
              </v-btn>
              <v-btn
                v-if="item.assignedUser"
                icon
                size="small"
                color="error"
                @click="unassignCard(item.cardNumber)"
              >
                <v-icon>mdi-link-off</v-icon>
              </v-btn>
            </template>
          </v-data-table>

          <!-- Card Preview Dialog -->
          <v-dialog v-model="cardPreviewDialog" max-width="500">
            <v-card v-if="selectedCardForPreview">
              <v-card-title class="card-preview-title">
                {{ selectedCardForPreview.cardNumber }}
              </v-card-title>

              <v-card-text>
                <div class="bingo-card-preview">
                  <div class="bingo-header">
                    <span v-for="letter in ['B', 'I', 'N', 'G', 'O']" :key="letter" class="header-letter">
                      {{ letter }}
                    </span>
                  </div>
                  <table class="card-grid">
                    <tbody>
                      <tr v-for="(row, rowIndex) in selectedCardForPreview.grid" :key="rowIndex">
                        <td
                          v-for="(num, colIndex) in row"
                          :key="colIndex"
                          class="card-cell"
                          :class="{ 'free-cell': num === 0 }"
                        >
                          {{ num === 0 ? 'FREE' : num }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <v-alert type="info" variant="tonal" class="mt-4" v-if="selectedCardForPreview.assignedUser">
                  <strong>Assigned to:</strong> {{ selectedCardForPreview.assignedUser.username }}
                </v-alert>
              </v-card-text>

              <v-card-actions>
                <v-btn color="primary" block @click="cardPreviewDialog = false">
                  Close
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </v-window-item>
      </v-window>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
/* eslint-disable no-undef */
import { ref, computed, inject, onMounted } from 'vue';
import { Services } from '@/services';
import CardGrid from '@/components/CardGrid.vue';

const props = defineProps<{
  roomId: number;
}>();

const emit = defineEmits(['cards-generated', 'cards-selected']);

const services = inject<Services>('services');

const tab = ref('cards');
const users = ref<any[]>([]);
const allCards = ref<any[]>([]);
const selectedUser = ref<number | null>(null);
const selectedCard = ref<string | null>(null);
const searchPlayer = ref('');
const searchCard = ref('');
const generating = ref(false);
const cardPreviewDialog = ref(false);
const selectedCardForPreview = ref<any>(null);

const cardHeaders = [
  { title: 'Card Number', key: 'cardNumber' },
  { title: 'Assigned To', key: 'assignedUser' },
  { title: 'Status', key: 'isLocked' },
  { title: 'Actions', key: 'actions', sortable: false },
];

const availableCards = computed(() => {
  return allCards.value.filter(card => !card.assignedUser);
});

const assignedCards = computed(() => {
  return allCards.value.filter(card => card.assignedUser);
});

const filteredUsers = computed(() => {
  if (!searchPlayer.value) return users.value;
  return users.value.filter(user =>
    user.username.toLowerCase().includes(searchPlayer.value.toLowerCase())
  );
});

const filteredCards = computed(() => {
  if (!searchCard.value) return allCards.value;
  return allCards.value.filter(card =>
    card.cardNumber.toLowerCase().includes(searchCard.value.toLowerCase())
  );
});

const getUserCards = (userId: number) => {
  return allCards.value.filter(card => card.assignedUser?.id === userId);
};

const loadData = async () => {
  try {
    // Load all users
    const usersResponse = await services?.userService.findAll();
    users.value = usersResponse?.data || [];

    // Load all cards
    const cardsResponse = await services?.cardService.getAll();
    allCards.value = cardsResponse?.data || [];
  } catch (error) {
    console.error('Error loading data:', error);
  }
};

const generateAllCards = async () => {
  if (!confirm('Generate 400 cards? This may take a moment.')) return;

  generating.value = true;
  try {
    await services?.cardService.generateBulk();
    alert('400 cards generated successfully!');
    await loadData();
  } catch (error) {
    console.error('Error generating cards:', error);
    alert('Failed to generate cards');
  } finally {
    generating.value = false;
  }
};

const assignCard = async () => {
  if (!selectedUser.value || !selectedCard.value) return;

  try {
    await services?.cardService.assignCard(
      selectedCard.value,
      selectedUser.value,
      props.roomId
    );
    alert('Card assigned successfully!');
    selectedUser.value = null;
    selectedCard.value = null;
    await loadData();
    emit('cards-assigned');
  } catch (error: any) {
    console.error('Error assigning card:', error);
    alert(error.response?.data?.message || 'Failed to assign card');
  }
};

const unassignCard = async (cardNumber: string) => {
  if (!confirm(`Unassign card ${cardNumber}?`)) return;

  try {
    await services?.cardService.unassignCard(cardNumber);
    alert('Card unassigned successfully!');
    await loadData();
  } catch (error) {
    console.error('Error unassigning card:', error);
    alert('Failed to unassign card');
  }
};

const onCardSelected = (cardNumbers: string[]) => {
  console.log('Cards selected:', cardNumbers);
  emit('cards-selected', cardNumbers);
};

onMounted(() => {
  loadData();
});
</script>

<style scoped lang="scss">
.user-management {
  margin: 20px 0;
  border-radius: 12px !important;
}

.management-title {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 1.5rem;
  font-weight: bold;
  padding: 20px;
}

.player-item {
  border-bottom: 1px solid #e0e0e0;
  padding: 16px;

  &:hover {
    background: #f5f5f5;
  }
}

.card-preview-title {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 1.3rem;
  font-weight: bold;
  padding: 16px;
  text-align: center;
}

.bingo-card-preview {
  margin: 20px 0;
}

.bingo-header {
  display: flex;
  justify-content: space-around;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 12px 0;
  border-radius: 8px 8px 0 0;
}

.header-letter {
  flex: 1;
  text-align: center;
  font-size: 1.8rem;
  font-weight: bold;
  color: white;
}

.card-grid {
  width: 100%;
  border-collapse: collapse;
  border: 3px solid #333;
}

.card-cell {
  width: 20%;
  height: 60px;
  border: 2px solid #333;
  text-align: center;
  font-size: 1.5rem;
  font-weight: bold;
  background: white;
  color: #333;

  &.free-cell {
    background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
    color: #333;
    font-size: 1rem;
  }
}
</style>
