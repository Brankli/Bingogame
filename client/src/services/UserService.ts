import Api from "@/services/Api";
import {User} from "../../../src/user/entities/user.entity";
import {AxiosPromise} from "axios";

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
}
