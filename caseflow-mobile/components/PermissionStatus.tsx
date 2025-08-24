import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { checkPermissions, requestAllPermissions, openAppSettings, PermissionResult } from '../utils/permissions';
import { Capacitor } from '@capacitor/core';

interface PermissionStatusProps {
  onPermissionsUpdated?: (permissions: PermissionResult) => void;
  showOnlyDenied?: boolean;
}

const PermissionStatus: React.FC<PermissionStatusProps> = ({ 
  onPermissionsUpdated, 
  showOnlyDenied = false 
}) => {
  const [permissions, setPermissions] = useState<PermissionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkCurrentPermissions();
  }, []);

  const checkCurrentPermissions = async () => {
    try {
      const currentPermissions = await checkPermissions();
      setPermissions(currentPermissions);
      onPermissionsUpdated?.(currentPermissions);
    } catch (error) {
      console.error('Failed to check permissions:', error);
    }
  };

  const requestPermissions = async () => {
    setIsLoading(true);
    try {
      const newPermissions = await requestAllPermissions({
        showRationale: true,
        fallbackToSettings: true
      });
      setPermissions(newPermissions);
      onPermissionsUpdated?.(newPermissions);
    } catch (error) {
      console.error('Failed to request permissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenSettings = async () => {
    await openAppSettings();
  };

  if (!permissions) {
    return (
      <View style={{ backgroundColor: 'rgba(17, 24, 39, 0.5)', borderWidth: 1, borderColor: '#374151', borderRadius: 8, padding: 16 }}>
        <Text style={{ textAlign: 'center', color: '#9CA3AF' }}>
          Checking permissions...
        </Text>
      </View>
    );
  }

  const permissionItems = [
    {
      name: 'Camera',
      status: permissions.camera,
      description: 'Required for capturing verification photos and selfies',
      icon: '📷'
    },
    {
      name: 'Location',
      status: permissions.location,
      description: 'Required for tagging photos with GPS coordinates',
      icon: '📍'
    },
    {
      name: 'Notifications',
      status: permissions.notifications,
      description: 'Required for receiving case updates and reminders',
      icon: '🔔'
    }
  ];

  const deniedPermissions = permissionItems.filter(item => item.status.denied);
  const hasAllPermissions = permissionItems.every(item => item.status.granted);

  // If showOnlyDenied is true and all permissions are granted, don't show anything
  if (showOnlyDenied && hasAllPermissions) {
    return null;
  }

  // If showOnlyDenied is true, only show denied permissions
  const itemsToShow = showOnlyDenied ? deniedPermissions : permissionItems;

  if (showOnlyDenied && itemsToShow.length === 0) {
    return null;
  }

  return (
    <View style={{ backgroundColor: 'rgba(17, 24, 39, 0.5)', borderWidth: 1, borderColor: '#374151', borderRadius: 8, padding: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <Text style={{ fontWeight: '600', color: '#F9FAFB', fontSize: 16 }}>
          {showOnlyDenied ? '⚠️ Permission Required' : '🔐 App Permissions'}
        </Text>
        {!hasAllPermissions && (
          <TouchableOpacity
            onPress={requestPermissions}
            disabled={isLoading}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 4,
              backgroundColor: isLoading ? '#6B7280' : '#00a950'
            }}
          >
            <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '600' }}>
              {isLoading ? 'Requesting...' : 'Grant Permissions'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View>
        {itemsToShow.map((item) => (
          <View key={item.name} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
            <Text style={{ fontSize: 18, marginRight: 12 }}>{item.icon}</Text>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontWeight: '500', color: '#F9FAFB' }}>{item.name}</Text>
                <View>
                  {item.status.granted ? (
                    <View style={{
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 4,
                      backgroundColor: 'rgba(34, 197, 94, 0.3)',
                      borderWidth: 1,
                      borderColor: '#15803d'
                    }}>
                      <Text style={{ fontSize: 10, color: '#4ade80' }}>✅ Granted</Text>
                    </View>
                  ) : item.status.denied ? (
                    <View style={{
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 4,
                      backgroundColor: 'rgba(239, 68, 68, 0.3)',
                      borderWidth: 1,
                      borderColor: '#dc2626'
                    }}>
                      <Text style={{ fontSize: 10, color: '#f87171' }}>❌ Denied</Text>
                    </View>
                  ) : (
                    <View style={{
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 4,
                      backgroundColor: 'rgba(245, 158, 11, 0.3)',
                      borderWidth: 1,
                      borderColor: '#d97706'
                    }}>
                      <Text style={{ fontSize: 10, color: '#fbbf24' }}>⏳ Pending</Text>
                    </View>
                  )}
                </View>
              </View>
              <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>{item.description}</Text>
            </View>
          </View>
        ))}
      </View>

      {deniedPermissions.length > 0 && (
        <View style={{
          marginTop: 16,
          padding: 12,
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          borderWidth: 1,
          borderColor: '#dc2626',
          borderRadius: 4
        }}>
          <Text style={{ fontSize: 14, color: '#f87171', marginBottom: 8 }}>
            Some permissions are denied. To enable them:
          </Text>
          <View>
            {Capacitor.getPlatform() === 'ios' && (
              <TouchableOpacity
                onPress={handleOpenSettings}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 4,
                  backgroundColor: '#dc2626',
                  marginBottom: 8
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#ffffff' }}>
                  Open Settings
                </Text>
              </TouchableOpacity>
            )}
            {Capacitor.getPlatform() === 'android' && (
              <Text style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 8 }}>
                Go to: Settings → Apps → CaseFlow Mobile → Permissions
              </Text>
            )}
            <TouchableOpacity
              onPress={checkCurrentPermissions}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 4,
                borderWidth: 1,
                borderColor: '#dc2626',
                backgroundColor: 'transparent'
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#f87171' }}>
                Refresh Status
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {hasAllPermissions && !showOnlyDenied && (
        <View style={{
          marginTop: 16,
          padding: 12,
          backgroundColor: 'rgba(34, 197, 94, 0.2)',
          borderWidth: 1,
          borderColor: '#15803d',
          borderRadius: 4
        }}>
          <Text style={{ fontSize: 14, color: '#4ade80' }}>
            ✅ All permissions granted! The app is ready to use.
          </Text>
        </View>
      )}
    </View>
  );
};

export default PermissionStatus;
