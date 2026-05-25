import axios, {AxiosInstance} from "axios";
import { getApiUrl } from '@/utils/apiUrl';
import { devLog, devWarn } from '@/utils/devLog';

export default class Api {
    protected httpClient: AxiosInstance;

    constructor() {
        const apiUrl = getApiUrl();

        this.httpClient = axios.create({
            baseURL: `${apiUrl}/api`,
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            }
        });

        // Add request interceptor to include token on every request
        this.httpClient.interceptors.request.use(
            (config) => {
                // Read token from localStorage (works in Electron)
                const token = localStorage.getItem('token');
                
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                    devLog('🔑 Token added to request');
                } else {
                    devWarn('⚠️ No token found in localStorage');
                }
                
                // Always return config - don't reject if no token
                // (login/register routes don't need token)
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );
    }
}

