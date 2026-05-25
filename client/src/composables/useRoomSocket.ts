import { onBeforeUnmount, type Ref } from 'vue';
import { useSocket } from '@/store/socket';
import {
  EXTRACTED_NUMBERS_EVENT,
  MATCH_ENDED_EVENT,
  MATCH_PAUSED_EVENT,
  MATCH_RESET_EVENT,
  NEW_MATCH_STARTED_EVENT,
  ON_ENTER_ROOM_EVENT,
  ON_EXIT_ROOM_EVENT,
} from '@/constants/socketEvents';

type GameStatus = 'idle' | 'playing' | 'paused';

export interface RoomSocketHandlers {
  roomId: Ref<number>;
  calledNumbers: Ref<number[]>;
  lastCalledNumber: Ref<number>;
  gameStatus: Ref<GameStatus>;
  room: Ref<any>;
  currentPattern: Ref<string>;
  selectedPatternForMatch: Ref<string>;
  matchWinners: Ref<any[]>;
  registeredCards: Ref<number[]>;
  verificationResult: Ref<any>;
  verifyCardNumber: Ref<string>;
  selectedCardForView: Ref<number | null>;
  selectedCardGrid: Ref<any>;
  showCardDetailsModal: Ref<boolean>;
  onNumberCalled: (letter: string, number: number) => void;
  showToast: (message: string, color?: string) => void;
  /** O(1) duplicate check; falls back to array scan if omitted */
  isNumberCalled?: (number: number) => boolean;
}

/**
 * Registers room socket listeners once; cleans up all handlers on unmount.
 */
export function useRoomSocket(handlers: RoomSocketHandlers) {
  const socketStore = useSocket();

  const joinRoom = () => {
    socketStore.client?.emit(ON_ENTER_ROOM_EVENT, {
      roomId: handlers.roomId.value,
    });
  };

  const onConnect = () => {
    joinRoom();
  };

  const onExtracted = ({ number }: { number: number }) => {
    const alreadyCalled = handlers.isNumberCalled
      ? handlers.isNumberCalled(number)
      : handlers.calledNumbers.value.includes(number);
    if (alreadyCalled) {
      return;
    }
    handlers.lastCalledNumber.value = number;
    handlers.calledNumbers.value.push(number);
    const letter = ['B', 'I', 'N', 'G', 'O'][Math.floor((number - 1) / 15)] || '?';
    handlers.onNumberCalled(letter, number);
  };

  const onNewMatch = ({ room: updatedRoom }: { room: any }) => {
    handlers.room.value = {
      ...handlers.room.value,
      ...updatedRoom,
      managers: updatedRoom?.managers ?? handlers.room.value?.managers ?? [],
    };
    handlers.calledNumbers.value = [];
    handlers.lastCalledNumber.value = 0;
    handlers.gameStatus.value = 'playing';
    handlers.matchWinners.value = [];
    handlers.selectedPatternForMatch.value = handlers.currentPattern.value;
  };

  const onPaused = () => {
    handlers.gameStatus.value = 'paused';
  };

  const onEnded = () => {
    handlers.gameStatus.value = 'idle';
  };

  const onReset = () => {
    handlers.calledNumbers.value = [];
    handlers.lastCalledNumber.value = 0;
    handlers.gameStatus.value = 'idle';
    handlers.verificationResult.value = null;
    handlers.verifyCardNumber.value = '';
    handlers.matchWinners.value = [];
    handlers.registeredCards.value = [];
    handlers.selectedCardForView.value = null;
    handlers.selectedCardGrid.value = null;
    handlers.showCardDetailsModal.value = false;
  };

  function setup() {
    socketStore.ensureConnected();
    const socket = socketStore.client;
    if (!socket) {
      return;
    }

    socket.on('connect', onConnect);
    socket.on(EXTRACTED_NUMBERS_EVENT, onExtracted);
    socket.on(NEW_MATCH_STARTED_EVENT, onNewMatch);
    socket.on(MATCH_PAUSED_EVENT, onPaused);
    socket.on(MATCH_ENDED_EVENT, onEnded);
    socket.on(MATCH_RESET_EVENT, onReset);

    if (socket.connected) {
      joinRoom();
    } else {
      socket.once('connect', joinRoom);
    }
  }

  function teardown() {
    const socket = socketStore.client;
    if (!socket) {
      return;
    }
    socket.off('connect', onConnect);
    socket.off(EXTRACTED_NUMBERS_EVENT, onExtracted);
    socket.off(NEW_MATCH_STARTED_EVENT, onNewMatch);
    socket.off(MATCH_PAUSED_EVENT, onPaused);
    socket.off(MATCH_ENDED_EVENT, onEnded);
    socket.off(MATCH_RESET_EVENT, onReset);
    socket.emit(ON_EXIT_ROOM_EVENT, { roomId: handlers.roomId.value });
  }

  onBeforeUnmount(teardown);

  return { socketStore, setup, teardown, joinRoom };
}
