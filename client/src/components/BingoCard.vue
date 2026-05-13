<template>
  <v-card class="bingo-card" :class="{ 'winning-card': isWinning }">
    <v-card-title class="text-center bg-primary">
      <div class="bingo-header">
        <span v-for="(letter, index) in ['B', 'I', 'N', 'G', 'O']" :key="index" class="bingo-letter">
          {{ letter }}
        </span>
      </div>
    </v-card-title>
    
    <v-card-subtitle class="text-center py-2">
      Card #{{ cardNumber }}
    </v-card-subtitle>

    <v-card-text class="pa-2">
      <table class="bingo-grid">
        <tbody>
          <tr v-for="(row, rowIndex) in grid" :key="rowIndex">
            <td
              v-for="(number, colIndex) in row"
              :key="colIndex"
              class="bingo-cell"
              :class="{
                'marked': isMarked(rowIndex, colIndex),
                'free-space': isFreeSpace(rowIndex, colIndex),
                'winning-cell': isWinningCell(rowIndex, colIndex)
              }"
              @click="toggleMark(rowIndex, colIndex)"
            >
              <div class="cell-content">
                {{ isFreeSpace(rowIndex, colIndex) ? 'FREE' : number }}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </v-card-text>

    <v-card-actions v-if="showActions" class="justify-center">
      <v-btn color="success" @click="$emit('claim-win')" :disabled="!canClaimWin">
        <v-icon>mdi-trophy</v-icon>
        BINGO!
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
/* eslint-disable no-undef */
import { ref, computed, watch } from 'vue';

const props = defineProps<{
  cardNumber: string;
  grid: number[][];
  calledNumbers: number[];
  winningPattern?: number[][];
  autoMark?: boolean;
  showActions?: boolean;
}>();

const emit = defineEmits(['claim-win', 'mark-cell']);

const markedCells = ref<boolean[][]>(
  Array(5).fill(null).map(() => Array(5).fill(false))
);

// Auto-mark center as FREE
markedCells.value[2][2] = true;

const isFreeSpace = (row: number, col: number) => {
  return row === 2 && col === 2;
};

const isMarked = (row: number, col: number) => {
  if (props.autoMark) {
    return isFreeSpace(row, col) || props.calledNumbers.includes(props.grid[row][col]);
  }
  return markedCells.value[row][col];
};

const isWinningCell = (row: number, col: number) => {
  if (!props.winningPattern) return false;
  return props.winningPattern.some(([r, c]) => r === row && c === col);
};

const isWinning = computed(() => {
  return props.winningPattern && props.winningPattern.length > 0;
});

const canClaimWin = computed(() => {
  // Check if any winning pattern is complete
  return props.calledNumbers.length >= 5;
});

const toggleMark = (row: number, col: number) => {
  if (!props.autoMark && !isFreeSpace(row, col)) {
    markedCells.value[row][col] = !markedCells.value[row][col];
    emit('mark-cell', { row, col, marked: markedCells.value[row][col] });
  }
};

// Auto-mark when numbers are called
watch(() => props.calledNumbers, (newNumbers) => {
  if (props.autoMark) {
    props.grid.forEach((row, rowIndex) => {
      row.forEach((num, colIndex) => {
        if (newNumbers.includes(num) || isFreeSpace(rowIndex, colIndex)) {
          markedCells.value[rowIndex][colIndex] = true;
        }
      });
    });
  }
}, { deep: true });
</script>

<style scoped lang="scss">
.bingo-card {
  max-width: 450px;
  margin: 10px auto;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
  border-radius: 16px !important;
  overflow: hidden;
  
  &.winning-card {
    border: 5px solid gold;
    animation: pulse 1s infinite;
    box-shadow: 0 0 30px rgba(255, 215, 0, 0.8);
  }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); box-shadow: 0 0 30px rgba(255, 215, 0, 0.8); }
  50% { transform: scale(1.02); box-shadow: 0 0 50px rgba(255, 215, 0, 1); }
}

.bingo-header {
  display: flex;
  justify-content: space-around;
  width: 100%;
  font-size: 2.5rem;
  font-weight: bold;
  color: white;
  padding: 15px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.bingo-letter {
  flex: 1;
  text-align: center;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.bingo-grid {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.bingo-cell {
  width: 20%;
  height: 70px;
  border: 3px solid #333;
  text-align: center;
  font-size: 1.8rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  background: white;
  
  &:hover:not(.free-space):not(.marked) {
    background: #e3f2fd;
    transform: scale(1.05);
  }
  
  &.marked {
    background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
    color: white;
    
    &::after {
      content: '✓';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 2.5rem;
      color: white;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
    }
  }
  
  &.free-space {
    background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
    color: #333;
    font-size: 1.2rem;
    font-weight: bold;
    cursor: default;
    box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.2);
  }
  
  &.winning-cell {
    background: linear-gradient(135deg, #ff9800 0%, #ff6f00 100%);
    animation: blink 0.5s infinite;
    color: white;
  }
}

@keyframes blink {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.1); }
}

.cell-content {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-weight: bold;
}
</style>
