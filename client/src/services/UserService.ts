import Api from "@/services/Api";
import type { User } from '@/types/user';
import type { EarningsTransaction } from '@/types/earnings';
import { AxiosPromise } from 'axios';

export class UserService extends Api {
    public findAll(): AxiosPromise<User[]> {
        return this.httpClient.get<User[]>(`/users`);
    }

    public getAll(): AxiosPromise<User[]> {
        return this.httpClient.get<User[]>(`/users`);
    }

    public show(id: number): AxiosPromise<User> {
        return this.httpClient.get<User>(`/users/${id}`);
    }

    public create(userData: any): AxiosPromise<User> {
        return this.httpClient.post<User>(`/users`, userData);
    }

    public update(id: number, userData: Partial<User>): AxiosPromise<User> {
        return this.httpClient.patch<User>(`/users/${id}`, userData);
    }

    public updateRole(id: number, role: string): AxiosPromise<User> {
        return this.httpClient.patch<User>(`/users/${id}`, { role });
    }

    public remove(id: number): AxiosPromise<any> {
        return this.httpClient.delete(`/users/${id}`);
    }

    public delete(id: number): AxiosPromise<any> {
        return this.httpClient.delete(`/users/${id}`);
    }

    public changePassword(currentPassword: string, newPassword: string): AxiosPromise<any> {
        return this.httpClient.post(`/users/change-password`, {
            currentPassword,
            newPassword,
        });
    }

    public adjustEarnings(userId: number, amount: number, type: string, reason?: string): AxiosPromise<any> {
        return this.httpClient.post(`/users/adjust-earnings`, {
            userId,
            amount,
            type,
            reason,
        });
    }

    public getEarningsHistory(userId: number): AxiosPromise<{ data: EarningsTransaction[] } | EarningsTransaction[]> {
        return this.httpClient.get(`/users/${userId}/earnings-history`);
    }
}
