import {defineStore} from "pinia";
import {computed, Ref, ref} from "vue";
import {User} from "../../../src/user/entities/user.entity";

export const useAuth = defineStore('auth', () => {
    const user: Ref<User | null> = ref(null);

    const logged = computed(() => user.value !== null);

    function setUser(newUser: User | null) {
        user.value = newUser;
    }

    function logout() {
        user.value = null;
        // Clear token from localStorage
        localStorage.removeItem('token');
        console.log('✅ Token cleared from localStorage');
    }

    return { user, logged, setUser, logout };
})
