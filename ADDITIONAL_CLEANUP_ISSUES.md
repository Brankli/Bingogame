# Additional Cleanup Issues Found

## Issue #1: App.vue - Module-Level Side Effects

### Problem
The `App.vue` component has initialization code running at the module level (outside lifecycle hooks), which can cause issues:

```javascript
// This runs immediately when the module loads
if (cookies.get('token')) {
  token.value = cookies.get('token');

  services?.authService.me()
    .then(({ data }) => {
      auth.setUser(data)
      socket.connect(`${process.env.VUE_APP_API_URL || 'http://localhost:3000'}`, token.value);
    });
}
```

### Issues:
1. **No Error Handling**: The promise chain has no `.catch()` handler
2. **No Cleanup**: Socket connection is never cleaned up
3. **Timing Issues**: Runs before component is mounted
4. **Testing Issues**: Hard to test module-level code

### Recommended Fix:

```vue
<script setup>
import { computed, inject, ref, onMounted, onBeforeUnmount } from "vue";
import { useCookies } from "vue3-cookies";
import { useAuth } from "@/store/auth";
import { useSocket } from "@/store/socket";
import { storeToRefs } from "pinia";
import { useRoute, useRouter } from "vue-router";

// Store
const auth = useAuth();
const { user } = storeToRefs(auth);
const socket = useSocket();
const { cookies } = useCookies();
const route = useRoute();
const router = useRouter();

// Services
const services = inject('services');

// Data
const loginDialog = ref(false);
const username = ref(null);
const password = ref(null);
const token = ref(null);
const notInRoom = computed(() => {
  const path = route.path || '';
  return !path.includes('/rooms/') && !path.includes('/bingo-rooms/');
});

// Initialize auth on mount
onMounted(async () => {
  const savedToken = cookies.get('token');
  if (savedToken) {
    token.value = savedToken;
    
    try {
      const { data } = await services?.authService.me();
      auth.setUser(data);
      socket.connect(
        `${process.env.VUE_APP_API_URL || 'http://localhost:3000'}`, 
        token.value
      );
    } catch (error) {
      console.error('Failed to restore session:', error);
      // Clear invalid token
      cookies.remove('token');
      token.value = null;
    }
  }
});

// Cleanup on unmount (though App rarely unmounts)
onBeforeUnmount(() => {
  // Disconnect socket if needed
  if (socket.client) {
    socket.client.disconnect();
  }
});

// Methods
async function login() {
  try {
    const loginResponse = await services?.authService.login(username.value, password.value);
    if (!loginResponse.data.access_token) {
      alert('Login failed');
      return;
    }

    token.value = loginResponse.data.access_token;
    cookies.set('token', token.value);
    auth.setUser(loginResponse.data.user);
    loginDialog.value = false;
    window.location.reload();
  } catch (error) {
    alert('Login failed: ' + (error.response?.data?.message || error.message));
  }
}

function goToAdminDashboard() {
  router.push({ name: 'admin-dashboard' });
}

async function logout() {
  cookies.remove('token');
  auth.setUser(null);
  token.value = null;
  
  // Disconnect socket
  if (socket.client) {
    socket.client.disconnect();
  }
}
</script>
```

### Benefits of Fix:
✅ Proper error handling
✅ Runs in correct lifecycle phase
✅ Easier to test
✅ Socket cleanup on logout
✅ Invalid token handling

## Issue #2: Potential Memory Leaks in Large Arrays

### Components with Large Arrays:

1. **BingoRoomView.vue**
   - `calledNumbers` - Can grow to 75 items
   - `registeredCards` - Can grow to 400 items
   - `ringBalls` - Fixed at 75 items

2. **RoomView.vue**
   - `calledNumbers` - Can grow to 90 items
   - `matches` - Can grow indefinitely

3. **AdminDashboard.vue**
   - `rooms` - Can grow with many rooms
   - `users` - Can grow with many users

### Recommendation:
These are generally fine, but consider:
- Pagination for large lists (users, rooms)
- Clearing arrays on unmount
- Virtual scrolling for very large lists

### Example Fix for BingoRoomView:

```typescript
onBeforeUnmount(() => {
  // ... existing cleanup ...
  
  // Clear large arrays to help garbage collection
  calledNumbers.value = [];
  registeredCards.value = [];
  ringBalls.value = [];
});
```

## Issue #3: Speech Synthesis Global State

### Problem:
Multiple components use `window.speechSynthesis` but it's a global singleton.

**Components using it:**
- BingoRoomView.vue
- RoomView.vue

### Potential Issue:
If you navigate between rooms quickly, speech from the previous room might still be playing.

### Current Cleanup:
✅ Both components call `window.speechSynthesis.cancel()` in `onBeforeUnmount`

### Recommendation:
Consider adding a check before starting speech:

```typescript
const speakMessage = (message: string) => {
  try {
    // Cancel any ongoing speech first
    window.speechSynthesis.cancel();
    
    const voiceMessage = new SpeechSynthesisUtterance(message);
    voiceMessage.rate = 1;
    voiceMessage.pitch = 1;
    window.speechSynthesis.speak(voiceMessage);
  } catch (error) {
    console.error('Speech synthesis error:', error);
  }
};
```

## Issue #4: Router Navigation Guards

### Check if any navigation guards need cleanup:

```bash
# Search for navigation guards
grep -r "beforeEach\|beforeRouteEnter\|beforeRouteLeave" client/src/
```

**Found:**
- `RoomView.vue` has `onBeforeRouteLeave` ✅ (properly emits exit event)

## Summary of Issues

| Issue | Severity | Status | Priority |
|-------|----------|--------|----------|
| App.vue module-level code | Medium | Found | High |
| Large array cleanup | Low | Optional | Low |
| Speech synthesis race | Low | Already handled | Low |
| Navigation guards | None | Clean | - |

## Recommended Actions

### High Priority:
1. ✅ Fix App.vue initialization (move to onMounted)
2. ✅ Add error handling to auth check
3. ✅ Add socket cleanup on logout

### Medium Priority:
4. Consider pagination for admin lists
5. Add virtual scrolling if lists grow very large

### Low Priority:
6. Add array cleanup in onBeforeUnmount (optional optimization)
7. Add defensive checks before speech synthesis

## Testing Checklist

After fixes:
- [ ] Login/logout works correctly
- [ ] Token restoration works on page refresh
- [ ] Invalid tokens are handled gracefully
- [ ] Socket disconnects on logout
- [ ] No console errors on navigation
- [ ] Memory usage stable over time
- [ ] Speech doesn't overlap between rooms

## Files to Modify

1. **client/src/App.vue** (High Priority)
   - Move initialization to onMounted
   - Add error handling
   - Add socket cleanup

2. **client/src/views/BingoRoomView.vue** (Optional)
   - Add array cleanup in onBeforeUnmount

3. **client/src/views/AdminDashboard.vue** (Optional)
   - Consider pagination for large lists
