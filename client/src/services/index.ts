import {App} from "vue";
import RoomService from "@/services/RoomService";
import {UserService} from "@/services/UserService";
import {AuthService} from "@/services/AuthService";
import CardService from "@/services/card.service";
import {SyncService} from "@/services/SyncService";
import {ReportService} from "@/services/ReportService";

export interface Services {
    roomService: RoomService,
    userService: UserService,
    authService: AuthService,
    cardService: CardService,
    syncService: SyncService,
    reportService: ReportService,
}

export default {
    install: (app: App) => {
        app.provide('services', {
            roomService: new RoomService(),
            userService: new UserService(),
            authService: new AuthService(),
            cardService: new CardService(),
            syncService: new SyncService(),
            reportService: new ReportService(),
        });
    },
};
