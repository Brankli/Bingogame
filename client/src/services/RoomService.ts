import Api from "@/services/Api";
import {Room} from "../../../src/room/entities/room.entity";
import {AxiosPromise} from "axios";

export default class RoomService extends Api {
    public index(): AxiosPromise<Room[]> {
        return this.httpClient.get<Room[]>('/rooms');
    }

    public create(name: string): AxiosPromise<Room> {
        return this.httpClient.post<Room>(`/rooms`, { name });
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
}
