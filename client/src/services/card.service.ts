import Api from '@/services/Api';

class CardService extends Api {
  async create(quantity = 1, roomId?: number) {
    return this.httpClient.post('/cards', { quantity, roomId });
  }

  async generateBulk() {
    return this.httpClient.post('/cards/bulk-generate');
  }

  async getAll() {
    return this.httpClient.get('/cards');
  }

  async getAvailable() {
    return this.httpClient.get('/cards/available');
  }

  async getByCardNumber(cardNumber: string) {
    return this.httpClient.get(`/cards/${cardNumber}`);
  }

  async getByRoom(roomId: number) {
    return this.httpClient.get(`/cards/room/${roomId}`);
  }

  async getUserCardsInRoom(userId: number, roomId: number) {
    return this.httpClient.get(`/cards/user/${userId}/room/${roomId}`);
  }

  async verify(cardNumber: string, calledNumbers: number[], pattern: string) {
    return this.httpClient.post('/cards/verify', {
      cardNumber,
      calledNumbers,
      pattern,
    });
  }

  async assignCard(cardNumber: string, userId: number, roomId: number) {
    return this.httpClient.post('/cards/assign', {
      cardNumber,
      userId,
      roomId,
    });
  }

  async unassignCard(cardNumber: string) {
    return this.httpClient.post(`/cards/unassign/${cardNumber}`);
  }

  async lockCard(cardNumber: string, matchId: number) {
    return this.httpClient.post('/cards/lock', {
      cardNumber,
      matchId,
    });
  }

  async unlockMatch(matchId: number) {
    return this.httpClient.post(`/cards/unlock-match/${matchId}`);
  }

  async delete(cardId: number) {
    return this.httpClient.delete(`/cards/${cardId}`);
  }
}

export default CardService;
