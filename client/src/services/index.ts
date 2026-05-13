import {App} from "vue";
import RoomService from "@/services/RoomService";
import {UserService} from "@/services/UserService";
import {AuthService} from "@/services/AuthService";
import CardService from "@/services/card.service";

export interface Services {
    roomService: RoomService,
    userService: UserService,
    authService: AuthService,
    cardService: CardService,
}

export default {
    install: (app: App) => {
        app.provide('services', {
            roomService: new RoomService(),
            userService: new UserService(),
            authService: new AuthService(),
            cardService: new CardService(),
        });
    },
};
