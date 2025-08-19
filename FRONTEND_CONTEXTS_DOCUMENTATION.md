# Frontend Contexts Documentation - BookMyCinema

## Table of Contents
1. [Overview](#overview)
2. [Context Architecture](#context-architecture)
3. [Individual Context Files](#individual-context-files)
4. [Context Integration](#context-integration)
5. [Data Flow](#data-flow)
6. [State Management](#state-management)
7. [Best Practices](#best-practices)

## Overview

React Contexts in BookMyCinema provide global state management and shared functionality across components. They handle authentication, real-time updates, and user session management.

### Context Structure:
```
src/contexts/
├── AuthContext.js      - Traditional authentication context
├── ClerkProvider.js    - Clerk authentication wrapper
└── SocketContext.js    - Real-time socket communication
```

---

## Context Architecture

### Context Pattern Structure:
```javascript
// Standard Context Pattern
const MyContext = createContext();

export const useMyContext = () => {
  const context = useContext(MyContext);
  if (!context) {
    throw new Error('useMyContext must be used within MyProvider');
  }
  return context;
};

export const MyProvider = ({ children }) => {
  const [state, setState] = useState(initialState);
  
  const value = {
    state,
    actions: {
      updateState: (newState) => setState(newState)
    }
  };
  
  return (
    <MyContext.Provider value={value}>
      {children}
    </MyContext.Provider>
  );
};
```

### Context Hierarchy:
```
App
├── ClerkProvider (Authentication)
│   ├── SocketProvider (Real-time)
│   │   ├── AuthProvider (Fallback Auth)
│   │   │   └── Application Components
```

---

## Individual Context Files

### 1. AuthContext.js - Traditional Authentication

**Purpose**: Provides traditional JWT-based authentication as fallback to Clerk

#### Context Creation:
```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

**How it works**:
1. **Context Creation**: Creates React context for authentication
2. **Hook Export**: Provides useAuth hook with error checking
3. **Error Handling**: Throws error if used outside provider

#### Provider Implementation:
```javascript
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);
```

**Initialization Flow**:
1. **Token Check**: Looks for existing token in localStorage
2. **Header Setup**: Sets Authorization header if token exists
3. **User Fetch**: Attempts to fetch user data
4. **Loading State**: Manages loading state during initialization

#### User Fetching:
```javascript
const fetchUser = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/auth/me');
    setUser(response.data.user);
  } catch (error) {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  } finally {
    setLoading(false);
  }
};
```

**How it works**:
1. **API Call**: Requests current user data from backend
2. **Success**: Sets user state with response data
3. **Error Handling**: Clears invalid token and headers
4. **Cleanup**: Always sets loading to false

#### Login Function:
```javascript
const login = async (email, password) => {
  try {
    const response = await axios.post('http://localhost:5000/api/auth/login', { email, password });
    const { token, user } = response.data;
    
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(user);
    
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      message: error.response?.data?.message || 'Login failed' 
    };
  }
};
```

**Login Flow**:
1. **API Request**: Sends credentials to login endpoint
2. **Token Storage**: Saves JWT token to localStorage
3. **Header Setup**: Sets Authorization header for future requests
4. **State Update**: Updates user state
5. **Response**: Returns success/failure with message

#### Register Function:
```javascript
const register = async (userData) => {
  try {
    const response = await axios.post('http://localhost:5000/api/auth/register', userData);
    const { token, user } = response.data;
    
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(user);
    
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      message: error.response?.data?.message || 'Registration failed' 
    };
  }
};
```

**Registration Flow**:
1. **API Request**: Sends user data to register endpoint
2. **Auto-Login**: Automatically logs in user after registration
3. **Token Management**: Same as login flow
4. **Error Handling**: Returns detailed error messages

#### Logout Function:
```javascript
const logout = () => {
  localStorage.removeItem('token');
  delete axios.defaults.headers.common['Authorization'];
  setUser(null);
};
```

**Logout Flow**:
1. **Token Removal**: Clears token from localStorage
2. **Header Cleanup**: Removes Authorization header
3. **State Reset**: Sets user to null

### 2. SocketContext.js - Real-time Communication

**Purpose**: Manages WebSocket connections for real-time updates

#### Context Setup:
```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';
import io from 'socket.io-client';
import { useAuth } from '@clerk/clerk-react';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);
```

#### Provider Implementation:
```javascript
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { userId, isSignedIn } = useAuth();
```

**State Management**:
- `socket`: Socket.io instance
- `connected`: Connection status
- `userId`: Current user ID from Clerk
- `isSignedIn`: Authentication status

#### Socket Connection:
```javascript
useEffect(() => {
  const socketInstance = io(process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000');
  
  socketInstance.on('connect', () => {
    console.log('Socket connected');
    setConnected(true);
    
    // Register user ID with socket server
    if (isSignedIn && userId) {
      socketInstance.emit('register-user', userId);
      console.log('Registered user ID with socket server:', userId);
    }
  });
```

**Connection Flow**:
1. **Socket Creation**: Creates socket.io connection to backend
2. **Connection Event**: Handles successful connection
3. **User Registration**: Registers user ID with socket server
4. **State Update**: Updates connection status

#### Event Listeners:
```javascript
// Movie events
socketInstance.on('movie-added', (movie) => {
  window.dispatchEvent(new CustomEvent('movies-updated'));
});

socketInstance.on('movie-updated', (movie) => {
  window.dispatchEvent(new CustomEvent('movies-updated'));
});

socketInstance.on('movie-deleted', (data) => {
  window.dispatchEvent(new CustomEvent('movies-updated'));
});
```

**Event Handling Pattern**:
1. **Socket Event**: Receives event from server
2. **Custom Event**: Dispatches browser custom event
3. **Component Listening**: Components listen for custom events
4. **State Update**: Components update their state accordingly

#### Seat Booking Events:
```javascript
// Seat conflict - user-specific
socketInstance.on('seat-conflict', (data) => {
  if (data.userId === userId) {
    window.dispatchEvent(new CustomEvent('seat-conflict', { detail: data }));
    console.log('Received seat conflict notification for this user:', data);
  }
});

// Auto-released seats - user-specific
socketInstance.on('seats-auto-released', (data) => {
  if (!data.userId || data.userId === userId) {
    window.dispatchEvent(new CustomEvent('seats-auto-released', { detail: data }));
    console.log('Seats auto-released for this user:', data);
  }
});

// General seat availability - all users
socketInstance.on('seats-available', (data) => {
  window.dispatchEvent(new CustomEvent('seats-available', { detail: data }));
});
```

**Seat Event Types**:
1. **User-Specific Events**: Only handled by specific user
2. **General Events**: Broadcast to all users
3. **Event Data**: Includes seat information and user context
4. **Custom Events**: Dispatched to window for component handling

### 3. ClerkProvider.js - Clerk Authentication Wrapper

**Purpose**: Wraps Clerk authentication with automatic user synchronization

#### User Sync Component:
```javascript
const UserSync = ({ children }) => {
  const { isSignedIn, user } = useUser();
  
  useEffect(() => {
    const syncUser = async () => {
      if (isSignedIn && user) {
        try {
          // Get token
          const token = await user.getToken();
          
          // Set token in API
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Sync user with database
          await api.post('/auth/sync-clerk-user');
          console.log('User synced with database');
        } catch (error) {
          console.error('Error syncing user:', error);
        }
      }
    };
    
    syncUser();
  }, [isSignedIn, user]);
  
  return <>{children}</>;
};
```

**Sync Flow**:
1. **Auth Check**: Monitors Clerk authentication state
2. **Token Retrieval**: Gets JWT token from Clerk
3. **API Setup**: Sets Authorization header
4. **Database Sync**: Syncs user data with backend database
5. **Error Handling**: Logs sync errors

#### Provider Wrapper:
```javascript
const ClerkProviderWrapper = ({ children }) => {
  const publishableKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;
  
  return (
    <ClerkProviderOriginal publishableKey={publishableKey}>
      <UserSync>
        {children}
      </UserSync>
    </ClerkProviderOriginal>
  );
};
```

**Wrapper Flow**:
1. **Environment Setup**: Gets Clerk publishable key
2. **Provider Wrapping**: Wraps original Clerk provider
3. **Auto-Sync**: Includes UserSync component
4. **Children Rendering**: Renders child components

---

## Context Integration

### Provider Hierarchy Setup:
```javascript
// App.js
function App() {
  return (
    <ClerkProviderWrapper>
      <SocketProvider>
        <AuthProvider>
          <Router>
            <Routes>
              {/* Application routes */}
            </Routes>
          </Router>
        </AuthProvider>
      </SocketProvider>
    </ClerkProviderWrapper>
  );
}
```

### Context Usage in Components:
```javascript
// Component using multiple contexts
const BookingComponent = () => {
  // Authentication
  const { user } = useAuth();
  const { userId, isSignedIn } = useUser(); // Clerk
  
  // Real-time updates
  const { socket, connected } = useSocket();
  
  useEffect(() => {
    // Listen for seat updates
    const handleSeatConflict = (event) => {
      const { conflicts, showId } = event.detail;
      // Handle seat conflict
    };
    
    window.addEventListener('seat-conflict', handleSeatConflict);
    
    return () => {
      window.removeEventListener('seat-conflict', handleSeatConflict);
    };
  }, []);
  
  return (
    <div>
      {isSignedIn ? (
        <BookingForm userId={userId} />
      ) : (
        <LoginPrompt />
      )}
    </div>
  );
};
```

---

## Data Flow

### Authentication Flow:
```
1. User Login → Clerk/AuthContext
2. Token Generation → JWT/Clerk Token
3. API Header Setup → Authorization Header
4. User Data Fetch → Backend API
5. State Update → Context State
6. Component Re-render → UI Update
```

### Real-time Update Flow:
```
1. Backend Event → Socket Server
2. Socket Emission → Connected Clients
3. Event Reception → SocketContext
4. Custom Event Dispatch → Window
5. Component Listener → Event Handler
6. State Update → Component Re-render
```

### User Sync Flow:
```
1. Clerk Authentication → User Login/Signup
2. Token Retrieval → Clerk Session
3. API Configuration → Authorization Header
4. Database Sync → Backend API Call
5. User Creation/Update → Database
6. Context State Update → User Data
```

---

## State Management

### Authentication State:
```javascript
// AuthContext state
{
  user: {
    id: "user123",
    email: "user@example.com",
    name: "John Doe",
    role: "user"
  },
  loading: false
}

// Clerk state (from useUser)
{
  isSignedIn: true,
  user: {
    id: "clerk_user_123",
    emailAddresses: [...],
    firstName: "John",
    lastName: "Doe"
  }
}
```

### Socket State:
```javascript
// SocketContext state
{
  socket: SocketIOInstance,
  connected: true
}

// Event data examples
{
  // Seat conflict event
  detail: {
    showId: "show123",
    conflicts: ["A1", "A2"],
    userId: "user123",
    message: "Seats are being selected by another user"
  }
}
```

---

## Best Practices

### 1. Context Separation:
```javascript
// Separate concerns into different contexts
// ✅ Good
const AuthContext = createContext(); // Authentication only
const SocketContext = createContext(); // Real-time only
const ThemeContext = createContext(); // UI theme only

// ❌ Avoid
const AppContext = createContext(); // Everything mixed
```

### 2. Error Boundaries:
```javascript
// Wrap contexts with error boundaries
const ContextErrorBoundary = ({ children }) => {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      {children}
    </ErrorBoundary>
  );
};

// Usage
<ContextErrorBoundary>
  <AuthProvider>
    <App />
  </AuthProvider>
</ContextErrorBoundary>
```

### 3. Context Optimization:
```javascript
// Memoize context values to prevent unnecessary re-renders
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  
  const value = useMemo(() => ({
    user,
    login,
    logout
  }), [user]);
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
```

### 4. Custom Hooks:
```javascript
// Create specific hooks for different use cases
export const useAuthUser = () => {
  const { user } = useAuth();
  return user;
};

export const useAuthActions = () => {
  const { login, logout, register } = useAuth();
  return { login, logout, register };
};

export const useIsAuthenticated = () => {
  const { user } = useAuth();
  return !!user;
};
```

### 5. Event Cleanup:
```javascript
// Always clean up event listeners
useEffect(() => {
  const handleEvent = (event) => {
    // Handle event
  };
  
  window.addEventListener('custom-event', handleEvent);
  
  return () => {
    window.removeEventListener('custom-event', handleEvent);
  };
}, []);
```

---

## Performance Considerations

### 1. Context Splitting:
- Split large contexts into smaller, focused ones
- Prevent unnecessary re-renders
- Use multiple providers when needed

### 2. Memoization:
- Memoize context values
- Use useMemo for expensive calculations
- Optimize selector functions

### 3. Event Management:
- Clean up event listeners
- Debounce frequent events
- Use event delegation when possible

### 4. Socket Optimization:
- Limit socket connections
- Use rooms for targeted updates
- Implement reconnection logic

---

## Testing Contexts

### Unit Testing:
```javascript
// Test context providers
describe('AuthProvider', () => {
  it('should provide authentication state', () => {
    const TestComponent = () => {
      const { user, login } = useAuth();
      return (
        <div>
          <span data-testid="user">{user?.name || 'No user'}</span>
          <button onClick={() => login('test@test.com', 'password')}>
            Login
          </button>
        </div>
      );
    };
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    expect(screen.getByTestId('user')).toHaveTextContent('No user');
  });
});
```

### Integration Testing:
```javascript
// Test context integration
describe('Context Integration', () => {
  it('should sync user data between contexts', async () => {
    const TestApp = () => {
      const { user } = useAuth();
      const { userId } = useUser();
      
      return (
        <div>
          <span data-testid="auth-user">{user?.id}</span>
          <span data-testid="clerk-user">{userId}</span>
        </div>
      );
    };
    
    render(
      <ClerkProviderWrapper>
        <AuthProvider>
          <TestApp />
        </AuthProvider>
      </ClerkProviderWrapper>
    );
    
    // Test user sync
    await waitFor(() => {
      expect(screen.getByTestId('auth-user')).toHaveTextContent('user123');
      expect(screen.getByTestId('clerk-user')).toHaveTextContent('user123');
    });
  });
});
```

---

## Troubleshooting

### Common Issues:

#### 1. Context Not Found Error:
```javascript
// Error: useAuth must be used within an AuthProvider
// Solution: Ensure component is wrapped with provider
<AuthProvider>
  <ComponentUsingAuth />
</AuthProvider>
```

#### 2. Socket Connection Issues:
```javascript
// Check socket connection status
const { socket, connected } = useSocket();

if (!connected) {
  return <div>Connecting to real-time updates...</div>;
}
```

#### 3. Token Synchronization:
```javascript
// Ensure tokens are synced between contexts
useEffect(() => {
  const syncTokens = async () => {
    if (isSignedIn && user) {
      const clerkToken = await user.getToken();
      // Update API headers
      api.defaults.headers.common['Authorization'] = `Bearer ${clerkToken}`;
    }
  };
  
  syncTokens();
}, [isSignedIn, user]);
```

---

## Conclusion

The context layer provides:

- **Global State Management**: Shared state across components
- **Authentication Integration**: Multiple auth strategies
- **Real-time Communication**: WebSocket event handling
- **User Synchronization**: Automatic data sync
- **Event Management**: Custom event system
- **Performance Optimization**: Memoization and cleanup
- **Error Handling**: Robust error boundaries
- **Testing Support**: Comprehensive test utilities

This architecture ensures scalable, maintainable, and robust state management for the BookMyCinema frontend application.