import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CaseProvider } from './context/CaseContext';
import BottomNavigation from './components/BottomNavigation';
import { SafeAreaProvider, MobileContainer } from './components/SafeAreaProvider';
import { ResponsiveLayoutProvider } from './components/ResponsiveLayout';
import ErrorBoundary from './components/ErrorBoundary';
import { View, Text, TouchableOpacity } from 'react-native';
import { googleMapsService } from './services/googleMapsService';
import { validateEnvironmentConfig, getEnvironmentConfig } from './config/environment';
import { dataCleanupService } from './services/dataCleanupService';
import { backgroundTaskManager } from './services/backgroundTaskManager';
import { initializeAppPermissions } from './utils/permissions';
import { useWebSocket } from './hooks/useWebSocket';

// Lazy load screens for better code splitting
const NewLoginScreen = lazy(() => import('./screens/NewLoginScreen'));
const DashboardScreen = lazy(() => import('./screens/DashboardScreen'));
const CaseListScreen = lazy(() => import('./screens/CaseListScreen'));
const AssignedCasesScreen = lazy(() => import('./screens/AssignedCasesScreen'));
const InProgressCasesScreen = lazy(() => import('./screens/InProgressCasesScreen'));
const CompletedCasesScreen = lazy(() => import('./screens/CompletedCasesScreen'));
const SavedCasesScreen = lazy(() => import('./screens/SavedCasesScreen'));
const ProfileScreen = lazy(() => import('./screens/ProfileScreen'));
const DigitalIdCardScreen = lazy(() => import('./screens/DigitalIdCardScreen'));

const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Initialize WebSocket connection with offline-first approach
  const {
    isConnected: wsConnected,
    error: wsError,
    connect: connectWebSocket,
  } = useWebSocket({
    autoConnect: false, // Disabled for offline-first
    enableNotifications: true,
    onCaseAssigned: (notification) => {
      // New case assigned via WebSocket
    },
    onCaseStatusChanged: (notification) => {
      // Case status changed via WebSocket
    },
    onCasePriorityChanged: (notification) => {
      // Case priority changed via WebSocket
    },
    onError: (error) => {
      // WebSocket error - silently handled in offline-first mode
    },
  });

  // Initialize services on app start
  useEffect(() => {
    const initializeServices = async () => {
      try {
        // Initialize app permissions first (critical for iOS)
        const permissions = await initializeAppPermissions();

        // Validate environment configuration
        const config = getEnvironmentConfig();
        const isValid = validateEnvironmentConfig(config);

        if (isValid) {
          // Initialize Google Maps service
          await googleMapsService.initialize();
        }

        // Initialize background task manager (includes data cleanup)
        await backgroundTaskManager.initialize();

        // Initialize data cleanup service
        await dataCleanupService.initialize();

        // Try WebSocket connection only if online and authenticated
        if (isAuthenticated && navigator.onLine) {
          setTimeout(() => connectWebSocket(), 5000); // Delayed connection
        }
      } catch (error) {
        console.error('Service initialization error:', error);
      }
    };

    initializeServices();
    // Remove connectWebSocket from dependencies to prevent infinite re-renders
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <MobileContainer>
        <View style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#111827',
          height: '100vh'
        }}>
          <Text style={{ color: '#00a950', fontSize: 18 }}>Loading...</Text>
        </View>
      </MobileContainer>
    );
  }

  // Loading component for lazy-loaded routes
  const RouteLoader = () => (
    <MobileContainer>
      <View style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#111827',
        height: '100vh'
      }}>
        <View style={{ flexDirection: 'column', alignItems: 'center' }}>
          <View style={{ width: 32, height: 32, borderWidth: 2, borderColor: '#00a950', borderTopColor: 'transparent', borderRadius: 16, backgroundColor: 'transparent' }} />
          <Text style={{ color: '#00a950', fontSize: 16 }}>Loading screen...</Text>
        </View>
      </View>
    </MobileContainer>
  );

  return (
    <MobileContainer>
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          {isAuthenticated ? (
            <>
              <Route path="/" element={<DashboardScreen />} />
              <Route path="/cases" element={<CaseListScreen title="All Cases" filter={() => true} emptyMessage="No cases available." tabKey="all" searchPlaceholder="Search all cases..." />} />
              <Route path="/cases/assigned" element={<AssignedCasesScreen />} />
              <Route path="/cases/in-progress" element={<InProgressCasesScreen />} />
              <Route path="/cases/completed" element={<CompletedCasesScreen />} />
              <Route path="/cases/saved" element={<SavedCasesScreen />} />
              <Route path="/profile" element={<ProfileScreen />} />
              <Route path="/digital-id-card" element={<DigitalIdCardScreen />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          ) : (
            <>
              <Route path="/login" element={<NewLoginScreen />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </>
          )}
        </Routes>
      </Suspense>
      {isAuthenticated && <BottomNavigation />}
    </MobileContainer>
  );
};



const App: React.FC = () => {

  try {
    return (
      <ErrorBoundary>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <SafeAreaProvider>
            <ResponsiveLayoutProvider>
              <AuthProvider>
                <CaseProvider>
                  <AppNavigator />
                </CaseProvider>
              </AuthProvider>
            </ResponsiveLayoutProvider>
          </SafeAreaProvider>
        </BrowserRouter>
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('App render error:', error);
    return (
      <View style={{
        backgroundColor: '#111827',
        color: '#ffffff',
        padding: 20,
        minHeight: '100vh',
        fontFamily: 'Arial, sans-serif'
      }}>
        <Text style={{ color: '#ffffff', fontSize: 24, marginBottom: 16 }}>App Error</Text>
        <Text style={{ color: '#ffffff', marginBottom: 16 }}>Failed to render app: {String(error)}</Text>
        <TouchableOpacity onPress={() => window.location.reload()} style={{ backgroundColor: '#00a950', padding: 10, borderRadius: 5 }}>
          <Text style={{ color: '#ffffff' }}>Reload</Text>
        </TouchableOpacity>
      </View>
    );
  }
};

export default App;
