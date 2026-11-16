<template>
  <section class="daily-report">
    <div class="report-header">
      <div>
        <div class="report-kicker">Financial overview</div>
        <h2 class="report-title">
          <v-icon color="primary" class="mr-2">mdi-dice-5</v-icon>
          Daily Bingo Report
        </h2>
      </div>
      <v-btn variant="outlined" color="primary" :loading="loading" @click="loadReport">
        <v-icon class="mr-2">mdi-refresh</v-icon>
        Refresh
      </v-btn>
    </div>

    <v-row class="mb-2">
      <v-col cols="12" md="6">
        <v-text-field
          v-model="startDate"
          type="date"
          label="Start Date"
          hint="Start of reporting period"
          persistent-hint
          variant="outlined"
          @change="loadReport"
        />
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field
          v-model="endDate"
          type="date"
          label="End Date"
          hint="End of reporting period"
          persistent-hint
          variant="outlined"
          @change="loadReport"
        />
      </v-col>
    </v-row>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">
      {{ error }}
    </v-alert>

    <v-row class="mb-4">
      <v-col cols="12" md="4">
        <v-card class="summary-card bets-card" elevation="1">
          <v-card-text>
            <div class="summary-label">Total Bets</div>
            <div class="summary-value">{{ formatMoney(report.totals.bets) }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="summary-card payouts-card" elevation="1">
          <v-card-text>
            <div class="summary-label">Total Payouts</div>
            <div class="summary-value">{{ formatMoney(report.totals.payouts) }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="summary-card profit-card" elevation="1">
          <v-card-text>
            <div class="summary-label">Net Profit</div>
            <div class="summary-value">{{ formatMoney(report.totals.profit) }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-card elevation="1">
      <v-table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Room</th>
            <th>Bet Amount</th>
            <th>Payout</th>
            <th>Profit/Loss</th>
            <th>Numbers</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in report.rows" :key="row.matchId">
            <td>{{ formatDate(row.date) }}</td>
            <td>{{ row.roomName }}</td>
            <td>{{ formatMoney(row.betAmount) }}</td>
            <td class="payout">{{ formatMoney(row.payout) }}</td>
            <td :class="row.profitLoss >= 0 ? 'profit' : 'loss'">
              {{ formatMoney(row.profitLoss) }}
            </td>
            <td>
              <span v-for="number in row.numbers" :key="number" class="number-chip">
                {{ number }}
              </span>
              <span v-if="!row.numbers.length" class="text-medium-emphasis">No calls</span>
            </td>
          </tr>
          <tr v-if="!loading && !report.rows.length">
            <td colspan="6" class="empty-state">No games found for this period.</td>
          </tr>
        </tbody>
      </v-table>
      <v-progress-linear v-if="loading" indeterminate color="primary" />
    </v-card>
  </section>
</template>

<script setup lang="ts">
import { inject, onMounted, ref } from 'vue';
import type { Services } from '@/services';
import type { DailyReport } from '@/types/report';

const services = inject<Services>('services');
const today = new Date().toISOString().slice(0, 10);
const startDate = ref(today);
const endDate = ref(today);
const loading = ref(false);
const error = ref('');
const report = ref<DailyReport>({
  startDate: today,
  endDate: today,
  currency: 'ETB',
  totals: { bets: 0, payouts: 0, profit: 0 },
  rows: [],
});

function formatMoney(value: number): string {
  return `${Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ETB`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function loadReport() {
  if (!startDate.value || !endDate.value) {
    return;
  }
  loading.value = true;
  error.value = '';
  try {
    const response = await services?.reportService.getDaily(
      startDate.value,
      endDate.value,
    );
    if (response?.data) {
      report.value = response.data;
    }
  } catch (requestError: unknown) {
    const responseMessage =
      typeof requestError === 'object' &&
      requestError !== null &&
      'response' in requestError &&
      typeof requestError.response === 'object' &&
      requestError.response !== null &&
      'data' in requestError.response &&
      typeof requestError.response.data === 'object' &&
      requestError.response.data !== null &&
      'message' in requestError.response.data &&
      typeof requestError.response.data.message === 'string'
        ? requestError.response.data.message
        : '';
    const requestMessage =
      requestError instanceof Error ? requestError.message : '';
    error.value =
      responseMessage ||
      requestMessage ||
      'Unable to load the daily report.';
  } finally {
    loading.value = false;
  }
}

onMounted(loadReport);
</script>

<style scoped>
.daily-report {
  min-width: 0;
}

.report-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.report-kicker {
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.report-title {
  display: flex;
  align-items: center;
  color: #26364a;
  font-size: 1.65rem;
}

.summary-card {
  min-height: 118px;
  border-left: 4px solid;
}

.bets-card {
  border-left-color: #2563eb;
}

.payouts-card {
  border-left-color: #16a34a;
}

.profit-card {
  border-left-color: #166534;
}

.summary-label {
  color: #475569;
  font-size: 1.05rem;
}

.summary-value {
  margin-top: 8px;
  color: #1d4ed8;
  font-size: 1.7rem;
  font-weight: 600;
}

.payouts-card .summary-value {
  color: #15803d;
}

.profit-card .summary-value {
  color: #166534;
}

.payout,
.profit {
  color: #166534;
  font-weight: 600;
}

.loss {
  color: #b91c1c;
  font-weight: 600;
}

.number-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  margin: 2px;
  padding: 3px 6px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  color: #334155;
  font-size: 0.78rem;
}

.empty-state {
  padding: 28px;
  color: #64748b;
  text-align: center;
}

@media (max-width: 600px) {
  .report-header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
