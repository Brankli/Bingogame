<template>
  <v-card class="card-grid-container">
    <v-card-title class="grid-title">
      <v-icon class="mr-2">mdi-cards</v-icon>
      Bingo Cards ({{ cards.length }}/400)
      <v-spacer></v-spacer>
      <v-chip v-if="selectedCards.length > 0" color="success" closable @click:close="selectedCards = []">
        Selected: {{ selectedCards.length }} cards
      </v-chip>
    </v-card-title>

    <v-card-text class="pa-4">
      <div class="cards-grid">
        <v-btn
          v-for="card in cards"
          :key="card.id"
          class="card-button"
          :class="{
            'selected': isCardSelected(card.cardNumber),
            'color-purple': true
          }"
          @click="toggleCard(card.cardNumber)"
          @dblclick="viewCard(card)"
          elevation="2"
        >
          {{ card.cardNumber.replace('CARD-', '') }}
        </v-btn>
      </div>

      <v-alert type="info" variant="tonal" class="mt-4">
        <strong>Instructions:</strong><br>
        • Single click to select/deselect a card<br>
        • Double click to view card details<br>
        • Select multiple cards for bulk operations
      </v-alert>

      <v-divider class="my-4"></v-divider>

      <v-row v-if="selectedCards.length > 0">
        <v-col cols="12">
          <v-btn color="success" block size="large" @click="confirmSelection">
            <v-icon class="mr-2">mdi-check-circle</v-icon>
            Confirm Selection ({{ selectedCards.length }} cards)
          </v-btn>
        </v-col>
      </v-row>
    </v-card-text>

    <!-- Card Preview Dialog -->
    <v-dialog v-model="previewDialog" max-width="500">
      <v-card v-if="previewCard">
        <v-card-title class="preview-title">
          {{ previewCard.cardNumber }}
        </v-card-title>

        <v-card-text>
          <div class="bingo-preview">
            <div class="bingo-header">
              <span v-for="letter in ['B', 'I', 'N', 'G', 'O']" :key="letter" class="header-letter">
                {{ letter }}
              </span>
            </div>
            <table class="preview-grid">
              <tbody>
                <tr v-for="(row, rowIndex) in previewCard.grid" :key="rowIndex">
                  <td
                    v-for="(num, colIndex) in row"
                    :key="colIndex"
                    class="preview-cell"
                    :class="{ 'free-cell': num === 0 }"
                  >
                    {{ num === 0 ? 'FREE' : num }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-btn color="primary" block @click="previewDialog = false">
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup lang="ts">
/* eslint-disable no-undef */
import { ref } from 'vue';

defineProps<{
  cards: any[];
}>();

const emit = defineEmits(['cards-selected']);

const selectedCards = ref<string[]>([]);
const previewDialog = ref(false);
const previewCard = ref<any>(null);

const isCardSelected = (cardNumber: string) => {
  return selectedCards.value.includes(cardNumber);
};

const toggleCard = (cardNumber: string) => {
  const index = selectedCards.value.indexOf(cardNumber);
  if (index > -1) {
    selectedCards.value.splice(index, 1);
  } else {
    selectedCards.value.push(cardNumber);
  }
};

const confirmSelection = () => {
  emit('cards-selected', selectedCards.value);
  selectedCards.value = [];
};

const viewCard = (card: any) => {
  previewCard.value = card;
  previewDialog.value = true;
};
</script>

<style scoped lang="scss">
.card-grid-container {
  border-radius: 12px !important;
}

.grid-title {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 1.3rem;
  font-weight: bold;
  padding: 20px;
}

.selection-info {
  background: #f0f0f0;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  max-height: 100px;
  overflow-y: auto;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
  gap: 8px;
  max-height: 600px;
  overflow-y: auto;
  padding: 8px;
  background: #1a1a2e;
  border-radius: 8px;
}

.card-button {
  min-width: 70px !important;
  height: 60px !important;
  font-size: 1.1rem !important;
  font-weight: bold !important;
  border-radius: 8px !important;
  transition: all 0.3s !important;
  color: white !important;
  
  /* Default - Purple */
  &.color-purple {
    background: linear-gradient(135deg, #7b1fa2 0%, #6a1b9a 100%) !important;
  }
  
  /* Selected - Red */
  &.selected {
    transform: scale(1.1);
    box-shadow: 0 0 20px rgba(211, 47, 47, 0.8) !important;
    background: linear-gradient(135deg, #d32f2f 0%, #c62828 100%) !important;
  }
  
  &:hover {
    transform: scale(1.05);
  }
}

.preview-title {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 1.5rem;
  font-weight: bold;
  padding: 20px;
  text-align: center;
}

.bingo-preview {
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

.preview-grid {
  width: 100%;
  border-collapse: collapse;
  border: 3px solid #333;
}

.preview-cell {
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
