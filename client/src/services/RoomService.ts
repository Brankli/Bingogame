import Api from "@/services/Api";
import type { Room } from '@/types/room';
import type { RoomCardMode } from '@/types/room';
import type {
  RoomCardPreview,
  RoomCardStatus,
  RoomCardGenerationResult,
  RoomCreateResponse,
  StaticCardLibraryStatus,
  StaticCardLibraryGenerateResult,
} from '@/types/roomCards';
import { AxiosPromise } from 'axios';

export default class RoomService extends Api {
    public index(): AxiosPromise<Room[]> {
        return this.httpClient.get<Room[]>('/rooms');
    }

    public create(
        name: string,
        cardMode: RoomCardMode = 'automatic',
    ): AxiosPromise<RoomCreateResponse> {
        return this.httpClient.post<RoomCreateResponse>(`/rooms`, { name, cardMode });
    }

    public getStaticCardLibraryStatus(): AxiosPromise<StaticCardLibraryStatus> {
        return this.httpClient.get<StaticCardLibraryStatus>(
            '/rooms/static-card-library/status',
        );
    }

    public generateStaticCardLibrary(
        reset = false,
    ): AxiosPromise<StaticCardLibraryGenerateResult> {
        return this.httpClient.post<StaticCardLibraryGenerateResult>(
            '/rooms/static-card-library/generate',
            { reset },
        );
    }

    public getRoomCardStatus(roomId: number): AxiosPromise<RoomCardStatus> {
        return this.httpClient.get<RoomCardStatus>(`/rooms/${roomId}/card-status`);
    }

    public previewRoomCard(roomId: number, index = 1): AxiosPromise<RoomCardPreview> {
        return this.httpClient.get<RoomCardPreview>(`/rooms/${roomId}/cards/preview`, {
            params: { index },
        });
    }

    public async exportRoomCards(roomId: number): Promise<void> {
        const response = await this.httpClient.get(`/rooms/${roomId}/cards/export`, {
            responseType: 'blob',
        });
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `room-${roomId}-cards.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
    }

    public show(roomId: number): AxiosPromise<Room> {
        return this.httpClient.get<Room>(`/rooms/${roomId}`);
    }

    public ticketPrice(roomId: number, ticketPrice: number) {
        return this.httpClient.post<Room>(`/rooms/${roomId}/ticket-price`, { ticketPrice });
    }

    public resetPrize(roomId: number, prizeToReset: string) {
        return this.httpClient.post<Room>(`/rooms/${roomId}/reset-prize`, { prizeToReset });
    }

    public assignManager(userId: number, roomId: number): AxiosPromise<any> {
        return this.httpClient.post('/rooms/assign-manager', { userId, roomId });
    }

    public removeManager(userId: number, roomId: number): AxiosPromise<any> {
        return this.httpClient.post('/rooms/remove-manager', { userId, roomId });
    }

    public getUserManagedRooms(userId: number): AxiosPromise<Room[]> {
        return this.httpClient.get<Room[]>(`/rooms/user/${userId}/managed`);
    }

    public canManageRoom(roomId: number): AxiosPromise<{ canManage: boolean }> {
        return this.httpClient.get(`/rooms/${roomId}/can-manage`);
    }

    public delete(roomId: number): AxiosPromise<any> {
        return this.httpClient.delete(`/rooms/${roomId}`);
    }

    public findAll(): AxiosPromise<Room[]> {
        return this.index();
    }

    public cleanupInvalidManagers(): AxiosPromise<{ success: boolean; message: string; count: number }> {
        return this.httpClient.post('/rooms/cleanup-invalid-managers');
    }

    public generateCardsForRoom(
        roomId: number,
        options: { reset?: boolean } = {},
    ): AxiosPromise<RoomCardGenerationResult & { success: boolean }> {
        return this.httpClient.post(`/rooms/${roomId}/generate-cards`, options);
    }

    public copyCardsFromRoom(
        targetRoomId: number,
        sourceRoomId: number,
    ): AxiosPromise<{ success: boolean; message: string; copied: number; total: number }> {
        return this.httpClient.post(`/rooms/${targetRoomId}/copy-cards`, { sourceRoomId });
    }
}
